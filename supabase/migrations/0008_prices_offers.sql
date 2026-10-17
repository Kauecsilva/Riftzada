-- Riftzada — preço sugerido, desconto e ofertas no mercado
--
-- 1. Preço de referência do TCGplayer, importado todo dia do tcgcsv.com (espelho público dos preços
--    do TCGplayer, que não tem API aberta), com a cotação do dólar (open.er-api.com) para converter.
--      upsert_tcgplayer_prices(set, products, prices)  grava um set (testável sem rede)
--      sync_card_prices()                             busca câmbio + todos os sets e chama a de cima
--    Para rodar na mão: select public.sync_card_prices();
-- 2. A LigaRiftbound bloqueia acesso automático (Cloudflare), então o vendedor informa o menor preço
--    de lá no anúncio (com idioma e condição). O anúncio guarda qual base usou e o desconto aplicado.
-- 3. Ofertas: o comprador oferece abaixo do preço; o vendedor aceita, recusa ou faz contraproposta,
--    e o comprador aceita ou recusa a contraproposta. Toda escrita passa pelas funções abaixo.

-- ---------- Câmbio ----------
create table public.exchange_rates (
  base text not null,
  quote text not null,
  rate numeric(12, 6) not null check (rate > 0),
  source text not null check (char_length(source) <= 60),
  updated_at timestamptz not null default now(),
  primary key (base, quote)
);

-- ---------- Preços de referência por carta ----------
create table public.card_prices (
  card_id uuid not null references public.cards (id) on delete cascade,
  source text not null check (source in ('tcgplayer')),
  finish text not null check (finish in ('normal', 'foil')),
  currency text not null default 'USD' check (currency in ('USD', 'BRL')),
  low_cents int check (low_cents >= 0),
  market_cents int check (market_cents >= 0),
  product_id text check (char_length(product_id) <= 20),
  product_url text check (product_url ~ '^https://'),
  updated_at timestamptz not null default now(),
  primary key (card_id, source, finish)
);

alter table public.exchange_rates enable row level security;
alter table public.card_prices enable row level security;
create policy "exchange_rates: logado lê" on public.exchange_rates for select to authenticated using (true);
create policy "card_prices: logado lê" on public.card_prices for select to authenticated using (true);

-- "Kai'Sa - Survivor (Alternate Art)" (Riftcodex) e "Kai'Sa, Survivor (Alternate Art)" (TCGplayer) viram a mesma chave
create or replace function public.card_match_key(card_name text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(lower(card_name), '[^a-z0-9]', '', 'g')
$$;

-- Recebe os arrays "results" de /products e /prices de um set do tcgcsv e grava os preços (em centavos de dólar).
-- Casa a carta pelo set + nome normalizado; só produtos com número de coleção (cartas, não caixas).
create or replace function public.upsert_tcgplayer_prices(set_abbr text, products jsonb, prices jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  with prod as (
    select distinct on (key) key, pid, url
    from (
      select public.card_match_key(p ->> 'name') as key, p ->> 'productId' as pid, p ->> 'url' as url
      from jsonb_array_elements(coalesce(products, '[]')) as p
      where p ->> 'productId' ~ '^\d{1,20}$'
        and exists (select 1 from jsonb_array_elements(coalesce(p -> 'extendedData', '[]')) e where e ->> 'name' = 'Number')
    ) s
    order by key, pid::bigint
  ),
  pr as (
    select x ->> 'productId' as pid, lower(x ->> 'subTypeName') as finish,
      round((x ->> 'lowPrice')::numeric * 100)::int as low, round((x ->> 'marketPrice')::numeric * 100)::int as market
    from jsonb_array_elements(coalesce(prices, '[]')) as x
    where lower(x ->> 'subTypeName') in ('normal', 'foil')
  )
  insert into public.card_prices as cp (card_id, source, finish, currency, low_cents, market_cents, product_id, product_url, updated_at)
  select distinct on (c.id, pr.finish)
    c.id, 'tcgplayer', pr.finish, 'USD', pr.low, pr.market, prod.pid,
    case when prod.url ~ '^https://' then left(prod.url, 300) end, now()
  from public.cards c
  join prod on prod.key = public.card_match_key(c.name)
  join pr on pr.pid = prod.pid
  where c.game = 'riftbound' and c.set_code = upper(set_abbr)
    and (pr.low is not null or pr.market is not null)
  order by c.id, pr.finish
  on conflict (card_id, source, finish) do update set
    low_cents = excluded.low_cents, market_cents = excluded.market_cents, product_id = excluded.product_id,
    product_url = excluded.product_url, updated_at = excluded.updated_at;
  get diagnostics n = row_count;
  return n;
end $$;

-- Busca a cotação USD→BRL e os preços de todos os sets de Riftbound (categoria 89 no TCGplayer).
create or replace function public.sync_card_prices() returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  res record;
  prices_res record;
  grp jsonb;
  rate numeric;
  total int := 0;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '30000');

  -- Câmbio: se falhar, fica a última cotação gravada
  begin
    select status, content into res from extensions.http_get('https://open.er-api.com/v6/latest/USD');
    if res.status = 200 then
      rate := (res.content::jsonb #>> '{rates,BRL}')::numeric;
      if rate > 0 then
        insert into public.exchange_rates (base, quote, rate, source, updated_at)
        values ('USD', 'BRL', rate, 'open.er-api.com', now())
        on conflict (base, quote) do update set rate = excluded.rate, source = excluded.source, updated_at = excluded.updated_at;
      end if;
    end if;
  exception when others then
    raise warning 'câmbio indisponível: %', sqlerrm;
  end;

  select status, content into res from extensions.http_get('https://tcgcsv.com/tcgplayer/89/groups');
  if res.status <> 200 then
    raise exception 'tcgcsv respondeu % na lista de sets', res.status;
  end if;
  for grp in select * from jsonb_array_elements(res.content::jsonb -> 'results') loop
    continue when not exists (select 1 from public.cards where set_code = upper(grp ->> 'abbreviation'));
    select status, content into res from extensions.http_get(format('https://tcgcsv.com/tcgplayer/89/%s/products', grp ->> 'groupId'));
    select status, content into prices_res from extensions.http_get(format('https://tcgcsv.com/tcgplayer/89/%s/prices', grp ->> 'groupId'));
    continue when res.status <> 200 or prices_res.status <> 200;
    total := total + public.upsert_tcgplayer_prices(grp ->> 'abbreviation', res.content::jsonb -> 'results', prices_res.content::jsonb -> 'results');
  end loop;
  return total;
end $$;

revoke execute on function public.upsert_tcgplayer_prices(text, jsonb, jsonb), public.sync_card_prices() from public, anon, authenticated;

-- ---------- Anúncio: base do preço, desconto e ofertas ----------
alter table public.market_listings
  add column price_base text check (price_base in ('liga', 'tcgplayer')),
  add column price_base_cents int check (price_base_cents between 0 and 100000000),
  add column discount_pct int check (discount_pct between 0 and 90),
  add column liga_price_cents int check (liga_price_cents between 0 and 100000000),
  add column liga_language text check (liga_language in ('en', 'zh', 'pt', 'other')),
  add column liga_condition public.card_condition,
  add column accepts_offers boolean not null default false,
  add column min_offer_cents int check (min_offer_cents between 0 and 100000000);

-- ---------- Ofertas ----------
create table public.listing_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents int not null check (amount_cents between 1 and 100000000),
  counter_cents int check (counter_cents between 1 and 100000000),
  message text check (char_length(message) <= 280),
  status text not null default 'pending' check (status in ('pending', 'countered', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Uma oferta em aberto por comprador em cada anúncio
create unique index listing_offers_open on public.listing_offers (listing_id, buyer_id) where status in ('pending', 'countered');
create index listing_offers_listing_idx on public.listing_offers (listing_id, created_at desc);
create index listing_offers_buyer_idx on public.listing_offers (buyer_id);
create trigger listing_offers_touch before update on public.listing_offers for each row execute function public.touch_updated_at();

alter table public.listing_offers enable row level security;
-- Só o comprador e o vendedor veem a oferta. Escrita só pelas funções (sem política de insert/update/delete).
create policy "offers: comprador ou vendedor lê" on public.listing_offers for select to authenticated
  using (buyer_id = auth.uid() or exists (select 1 from public.market_listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- Comprador faz (ou refaz) a oferta. Tem que ficar abaixo do preço e acima do mínimo do vendedor.
create or replace function public.make_listing_offer(target_listing uuid, amount int, note text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l public.market_listings;
  offer_id uuid;
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  select * into l from public.market_listings where id = target_listing;
  if not found or l.is_hidden or not public.is_member(l.community_id) then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;
  if l.seller_id = me then raise exception 'cannot offer on own listing' using errcode = '42501'; end if;
  if l.kind <> 'sell' or not l.accepts_offers or l.status <> 'available' then
    raise exception 'listing does not accept offers' using errcode = '22023';
  end if;
  if amount is null or amount < 1 or (l.price_cents is not null and amount >= l.price_cents) then
    raise exception 'offer must be below the price' using errcode = '22023';
  end if;
  if l.min_offer_cents is not null and amount < l.min_offer_cents then
    raise exception 'offer below the minimum' using errcode = '22023';
  end if;
  if char_length(note) > 280 then raise exception 'message too long' using errcode = '22023'; end if;

  update public.listing_offers
    set amount_cents = amount, message = nullif(trim(note), ''), counter_cents = null, status = 'pending'
    where listing_id = target_listing and buyer_id = me and status in ('pending', 'countered')
    returning id into offer_id;
  if offer_id is null then
    insert into public.listing_offers (listing_id, buyer_id, amount_cents, message)
    values (target_listing, me, amount, nullif(trim(note), ''))
    returning id into offer_id;
  end if;
  return offer_id;
end $$;

-- Responde uma oferta e devolve o novo status.
--   vendedor, oferta pendente:      accept | decline | counter (com valor entre a oferta e o preço)
--   comprador, com contraproposta:  accept | decline
--   comprador, oferta em aberto:    withdraw
-- Oferta aceita em anúncio de 1 unidade deixa o anúncio reservado.
create or replace function public.respond_listing_offer(target_offer uuid, action text, counter int default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  o public.listing_offers;
  l public.market_listings;
  next_status text;
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  select * into o from public.listing_offers where id = target_offer for update;
  if not found then raise exception 'offer not found' using errcode = 'P0002'; end if;
  select * into l from public.market_listings where id = o.listing_id;

  if me = l.seller_id then
    if o.status <> 'pending' then raise exception 'offer is not pending' using errcode = '22023'; end if;
    if action = 'accept' then
      next_status := 'accepted';
    elsif action = 'decline' then
      next_status := 'declined';
    elsif action = 'counter' then
      if counter is null or counter <= o.amount_cents or (l.price_cents is not null and counter >= l.price_cents) then
        raise exception 'counter must be between the offer and the price' using errcode = '22023';
      end if;
      update public.listing_offers set status = 'countered', counter_cents = counter where id = o.id;
      return 'countered';
    else
      raise exception 'invalid action' using errcode = '22023';
    end if;
    update public.listing_offers set status = next_status where id = o.id;
  elsif me = o.buyer_id then
    if action = 'withdraw' and o.status in ('pending', 'countered') then
      next_status := 'withdrawn';
      update public.listing_offers set status = next_status where id = o.id;
    elsif action in ('accept', 'decline') and o.status = 'countered' then
      next_status := case action when 'accept' then 'accepted' else 'declined' end;
      update public.listing_offers
        set status = next_status, amount_cents = case when action = 'accept' then o.counter_cents else o.amount_cents end
        where id = o.id;
    else
      raise exception 'invalid action' using errcode = '22023';
    end if;
  else
    raise exception 'not your offer' using errcode = '42501';
  end if;

  if next_status = 'accepted' and l.quantity = 1 and l.status = 'available' then
    update public.market_listings set status = 'reserved' where id = l.id;
  end if;
  return next_status;
end $$;

revoke execute on function public.make_listing_offer(uuid, int, text), public.respond_listing_offer(uuid, text, int) from public, anon;
grant execute on function public.make_listing_offer(uuid, int, text), public.respond_listing_offer(uuid, text, int) to authenticated;

-- No Supabase: agenda a atualização diária dos preços (o tcgcsv atualiza por volta das 20:00 UTC).
-- Num Postgres comum (CI) o pg_cron não existe e esta parte é pulada.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('sync-card-prices', '30 22 * * *', 'select public.sync_card_prices()');
  end if;
end $$;
