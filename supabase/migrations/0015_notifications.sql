-- Riftzada — notificações: propostas recebidas e interações de outros jogadores com você
--
-- Cada linha é um aviso para user_id sobre algo que actor_id fez. Ninguém escreve direto na tabela:
-- os avisos nascem de triggers (ofertas) via public.notify, e o dono só lê e marca como lido.
-- Outras features (troca com cartas, chat) chamam public.notify dos próprios triggers.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in (
    'offer_received', 'offer_countered', 'offer_accepted', 'offer_declined', 'offer_withdrawn',
    'trade_offer', 'message'
  )),
  listing_id uuid references public.market_listings (id) on delete cascade,
  offer_id uuid references public.listing_offers (id) on delete cascade,
  amount_cents int check (amount_cents between 0 and 100000000),
  body text check (char_length(body) <= 280),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index notifications_actor_idx on public.notifications (actor_id);
create index notifications_listing_idx on public.notifications (listing_id);
create index notifications_offer_idx on public.notifications (offer_id);

alter table public.notifications enable row level security;
-- Só o dono lê. Escrita só pelas funções abaixo (sem política de insert/update/delete).
create policy "notifications: dono lê" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

-- Cria um aviso. Ignora aviso para si mesmo. Só triggers e funções do banco chamam.
create or replace function public.notify(
  recipient uuid, actor uuid, what text, listing uuid default null, offer uuid default null,
  amount int default null, note text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if recipient is null or recipient = actor then return; end if;
  insert into public.notifications (user_id, actor_id, kind, listing_id, offer_id, amount_cents, body)
  values (recipient, actor, what, listing, offer, amount, left(nullif(trim(note), ''), 280));
end $$;

-- Marca um aviso (ou todos, sem argumento) do usuário logado como lido.
create or replace function public.mark_notifications_read(target uuid default null) returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (target is null or id = target)
$$;

-- Ofertas: cada mudança de status avisa a outra parte.
--   comprador oferta (ou refaz)          → vendedor: offer_received
--   vendedor contrapropõe                → comprador: offer_countered
--   vendedor aceita/recusa oferta        → comprador: offer_accepted / offer_declined
--   comprador aceita/recusa contraproposta → vendedor: offer_accepted / offer_declined
--   comprador retira                     → vendedor: offer_withdrawn
create or replace function public.notify_listing_offer() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  seller uuid;
begin
  select seller_id into seller from public.market_listings where id = new.listing_id;

  if tg_op = 'INSERT' or (new.status = 'pending' and (old.status <> 'pending' or old.amount_cents <> new.amount_cents)) then
    perform public.notify(seller, new.buyer_id, 'offer_received', new.listing_id, new.id, new.amount_cents, new.message);
  elsif new.status is distinct from old.status then
    if new.status = 'countered' then
      perform public.notify(new.buyer_id, seller, 'offer_countered', new.listing_id, new.id, new.counter_cents);
    elsif new.status in ('accepted', 'declined') and old.status = 'pending' then
      perform public.notify(new.buyer_id, seller, 'offer_' || new.status, new.listing_id, new.id, new.amount_cents);
    elsif new.status in ('accepted', 'declined') and old.status = 'countered' then
      perform public.notify(seller, new.buyer_id, 'offer_' || new.status, new.listing_id, new.id, coalesce(old.counter_cents, new.amount_cents));
    elsif new.status = 'withdrawn' then
      perform public.notify(seller, new.buyer_id, 'offer_withdrawn', new.listing_id, new.id, new.amount_cents);
    end if;
  end if;
  return null;
end $$;

create trigger listing_offers_notify after insert or update on public.listing_offers
  for each row execute function public.notify_listing_offer();

revoke execute on function public.notify(uuid, uuid, text, uuid, uuid, int, text), public.notify_listing_offer() from public, anon, authenticated;
revoke execute on function public.mark_notifications_read(uuid) from public, anon;
grant execute on function public.mark_notifications_read(uuid) to authenticated;
