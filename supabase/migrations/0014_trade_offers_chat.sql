-- Riftzada — oferta com cartas (troca + valor) e conversa entre quem anuncia e quem se interessa
--
-- 1. A oferta passa a levar cartas além do valor. Venda que aceita troca e anúncio de troca recebem
--    "R$ X + estas cartas"; oferta só em dinheiro continua só para venda que aceita ofertas.
-- 2. Conversa por anúncio: cada pessoa interessada tem uma conversa com quem anunciou.
--    Toda escrita passa pelas funções abaixo; a RLS só deixa as duas pontas lerem.

-- ---------- Oferta com cartas ----------
-- cards: [{ "name": "Ahri, Alluring", "qty": 1, "card_id": "<uuid do catálogo>" | null }]
alter table public.listing_offers
  add column cards jsonb not null default '[]' check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) <= 10);
alter table public.listing_offers drop constraint listing_offers_amount_cents_check;
alter table public.listing_offers
  add constraint listing_offers_amount_cents_check check (amount_cents between 0 and 100000000),
  add constraint listing_offers_not_empty check (amount_cents > 0 or jsonb_array_length(cards) > 0);

-- A versão de 3 argumentos sai do caminho sem DROP (o Supabase pede confirmação manual para DROP);
-- fica sem permissão de execução para ninguém.
alter function public.make_listing_offer(uuid, int, text) rename to make_listing_offer_v1;
revoke execute on function public.make_listing_offer_v1(uuid, int, text) from public, anon, authenticated;

-- Comprador faz (ou refaz) a oferta.
--   Só dinheiro: venda que aceita ofertas, abaixo do preço e acima do mínimo do vendedor.
--   Com cartas: anúncio de troca ou venda que aceita troca; o valor (pode ser zero) fica abaixo do preço.
create or replace function public.make_listing_offer(target_listing uuid, amount int, note text default null, offered_cards jsonb default '[]')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l public.market_listings;
  clean jsonb := '[]';
  item jsonb;
  item_name text;
  item_qty int;
  item_card uuid;
  offer_id uuid;
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  select * into l from public.market_listings where id = target_listing;
  if not found or l.is_hidden or not public.is_member(l.community_id) then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;
  if l.seller_id = me then raise exception 'cannot offer on own listing' using errcode = '42501'; end if;
  if l.status <> 'available' then raise exception 'listing does not accept offers' using errcode = '22023'; end if;

  if offered_cards is null or jsonb_typeof(offered_cards) <> 'array' or jsonb_array_length(offered_cards) > 10 then
    raise exception 'invalid cards' using errcode = '22023';
  end if;
  for item in select * from jsonb_array_elements(offered_cards) loop
    item_name := trim(item ->> 'name');
    item_qty := coalesce((item ->> 'qty')::int, 1);
    if item_name is null or char_length(item_name) not between 1 and 120 or item_qty not between 1 and 99 then
      raise exception 'invalid cards' using errcode = '22023';
    end if;
    item_card := nullif(item ->> 'card_id', '')::uuid;
    if item_card is not null and not exists (select 1 from public.cards where id = item_card) then item_card := null; end if;
    clean := clean || jsonb_build_array(jsonb_build_object('name', item_name, 'qty', item_qty, 'card_id', item_card));
  end loop;

  if jsonb_array_length(clean) = 0 then
    if l.kind <> 'sell' or not l.accepts_offers then
      raise exception 'listing does not accept offers' using errcode = '22023';
    end if;
    if amount is null or amount < 1 or (l.price_cents is not null and amount >= l.price_cents) then
      raise exception 'offer must be below the price' using errcode = '22023';
    end if;
    if l.min_offer_cents is not null and amount < l.min_offer_cents then
      raise exception 'offer below the minimum' using errcode = '22023';
    end if;
  else
    if not (l.kind = 'trade' or (l.kind = 'sell' and l.accepts_trade)) then
      raise exception 'listing does not accept trades' using errcode = '22023';
    end if;
    amount := coalesce(amount, 0);
    if amount < 0 or (l.price_cents is not null and amount >= l.price_cents) then
      raise exception 'offer must be below the price' using errcode = '22023';
    end if;
  end if;
  if char_length(note) > 280 then raise exception 'message too long' using errcode = '22023'; end if;

  update public.listing_offers
    set amount_cents = amount, cards = clean, message = nullif(trim(note), ''), counter_cents = null, status = 'pending'
    where listing_id = target_listing and buyer_id = me and status in ('pending', 'countered')
    returning id into offer_id;
  if offer_id is null then
    insert into public.listing_offers (listing_id, buyer_id, amount_cents, cards, message)
    values (target_listing, me, amount, clean, nullif(trim(note), ''))
    returning id into offer_id;
  end if;
  return offer_id;
end $$;

revoke execute on function public.make_listing_offer(uuid, int, text, jsonb) from public, anon;
grant execute on function public.make_listing_offer(uuid, int, text, jsonb) to authenticated;

-- ---------- Conversa por anúncio ----------
-- Uma conversa = (anúncio, pessoa interessada). A outra ponta é sempre quem anunciou.
create table public.listing_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index listing_messages_thread_idx on public.listing_messages (listing_id, buyer_id, created_at);
create index listing_messages_buyer_idx on public.listing_messages (buyer_id, created_at desc);

alter table public.listing_messages enable row level security;
-- Só as duas pontas leem. Escrita só pelas funções (sem política de insert/update/delete).
create policy "messages: as duas pontas leem" on public.listing_messages for select to authenticated
  using (buyer_id = auth.uid() or exists (select 1 from public.market_listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- Manda uma mensagem. Quem se interessa começa a conversa (target_buyer = ele mesmo);
-- quem anunciou só responde a quem já mandou mensagem ou fez oferta.
create or replace function public.send_listing_message(target_listing uuid, target_buyer uuid, body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l public.market_listings;
  text_body text := trim(body);
  message_id uuid;
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  select * into l from public.market_listings where id = target_listing;
  if not found or not public.is_member(l.community_id) or (l.is_hidden and l.seller_id <> me) then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;
  if text_body is null or char_length(text_body) not between 1 and 1000 then
    raise exception 'invalid message' using errcode = '22023';
  end if;

  if me = l.seller_id then
    if target_buyer is null or target_buyer = me or not (
      exists (select 1 from public.listing_messages m where m.listing_id = l.id and m.buyer_id = target_buyer)
      or exists (select 1 from public.listing_offers o where o.listing_id = l.id and o.buyer_id = target_buyer)
    ) then
      raise exception 'no conversation with this person' using errcode = '42501';
    end if;
  elsif target_buyer is distinct from me then
    raise exception 'not your conversation' using errcode = '42501';
  end if;

  insert into public.listing_messages (listing_id, buyer_id, sender_id, body)
  values (l.id, target_buyer, me, text_body)
  returning id into message_id;
  return message_id;
end $$;

-- Marca como lidas as mensagens que a outra ponta mandou nesta conversa.
create or replace function public.mark_listing_chat_read(target_listing uuid, target_buyer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  update public.listing_messages m set read_at = now()
  where m.listing_id = target_listing and m.buyer_id = target_buyer and m.sender_id <> me and m.read_at is null
    and (m.buyer_id = me or exists (select 1 from public.market_listings l where l.id = m.listing_id and l.seller_id = me));
end $$;

revoke execute on function public.send_listing_message(uuid, uuid, text), public.mark_listing_chat_read(uuid, uuid) from public, anon;
grant execute on function public.send_listing_message(uuid, uuid, text), public.mark_listing_chat_read(uuid, uuid) to authenticated;

-- No Supabase: mensagens novas chegam na hora pelo Realtime (que respeita a RLS acima).
-- Num Postgres comum (CI) a publicação não existe e esta parte é pulada.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.listing_messages;
  end if;
end $$;
