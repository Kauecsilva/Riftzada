-- Riftzada — aviso de preço desatualizado no anúncio
--
-- Anúncio feito pela regra (base Liga ou TCGplayer menos um desconto, ex.: Liga −10%) guarda a base e o
-- desconto. Quando o preço de hoje pela mesma regra fica longe do anunciado, o vendedor recebe um aviso
-- e, em /mercado/revisar-precos, atualiza pela regra ou mantém o preço.
--   price_drifted(a, b)            diferença que vale aviso: ≥ 20% de b e ≥ R$ 2
--   listing_price_drift            anúncio pela regra com o preço de hoje (security invoker: respeita a RLS)
--   notify_price_drift()           cron diário: avisa quem tem anúncio que passou a ficar longe
--   reprice_listings(ids)          vendedor atualiza os anúncios longe pela regra (todos, sem ids)
--   keep_listing_prices(ids)       vendedor mantém o preço; só volta a avisar se a referência andar mais 20%

alter table public.market_listings
  -- Preço pela regra quando o vendedor escolheu manter o dele
  add column price_ack_cents int check (price_ack_cents between 0 and 100000000),
  -- Preço pela regra no último aviso (não repete o aviso todo dia)
  add column price_alerted_cents int check (price_alerted_cents between 0 and 100000000);

-- Preço ou regra mudou: o anúncio volta a ser comparado do zero
create or replace function public.reset_listing_price_review() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.price_cents is distinct from old.price_cents or new.price_base is distinct from old.price_base
     or new.price_base_cents is distinct from old.price_base_cents or new.discount_pct is distinct from old.discount_pct then
    new.price_ack_cents := null;
    new.price_alerted_cents := null;
  end if;
  return new;
end $$;
create trigger market_listings_price_review before update on public.market_listings
  for each row execute function public.reset_listing_price_review();

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in (
  'offer_received', 'offer_countered', 'offer_accepted', 'offer_declined', 'offer_withdrawn',
  'trade_offer', 'message', 'price_review'
));

-- Mesma regra de PRICE_DRIFT em src/lib/domain/pricing.ts
create or replace function public.price_drifted(a int, b int) returns boolean
language sql immutable set search_path = public as $$
  select a is not null and b is not null and abs(a - b) >= 200 and abs(a - b) * 5 >= b
$$;

-- Preço de hoje com a mesma escolha do app (src/lib/domain/pricing.ts): acabamento foil se a variante diz
-- "foil", senão normal, senão o que tiver; Liga só com preço da última semana; TCGplayer no menor anúncio
-- (ou no preço de mercado) convertido para real.
create view public.listing_price_drift with (security_invoker = true) as
with base as (
  select l.id as listing_id, l.seller_id, l.card_id, l.card_name, l.variant, l.price_cents, l.price_base,
         l.price_base_cents, coalesce(l.discount_pct, 0) as discount_pct, l.price_ack_cents, l.price_alerted_cents,
         liga.low_cents as liga_cents, liga.language as liga_language, liga.condition as liga_condition,
         case l.price_base when 'liga' then liga.low_cents else tcg.brl_cents end as base_now_cents
  from public.market_listings l
  left join lateral (
    select lp.low_cents, lp.language, lp.condition
    from public.liga_prices lp
    where lp.card_id = l.card_id and lp.updated_at > now() - interval '7 days'
    order by lp.finish = case when l.variant ~* 'foil' then 'foil' else 'normal' end desc, lp.finish
    limit 1
  ) liga on true
  left join lateral (
    select round(coalesce(cp.low_cents, cp.market_cents) * r.rate)::int as brl_cents
    from public.card_prices cp
    join public.exchange_rates r on r.base = 'USD' and r.quote = 'BRL'
    where cp.card_id = l.card_id and cp.source = 'tcgplayer'
    order by cp.finish = case when l.variant ~* 'foil' then 'foil' else 'normal' end desc, cp.finish
    limit 1
  ) tcg on true
  where l.kind = 'sell' and l.status = 'available' and not l.is_hidden
    and l.price_base is not null and l.price_cents is not null and l.card_id is not null
),
priced as (
  select b.*, round(b.base_now_cents * (100 - b.discount_pct) / 100.0)::int as expected_cents
  from base b
  where b.base_now_cents > 0
)
select p.*,
       public.price_drifted(p.price_cents, p.expected_cents)
         and (p.price_ack_cents is null or public.price_drifted(p.price_ack_cents, p.expected_cents)) as drifted
from priced p;

revoke all on public.listing_price_drift from public, anon;
grant select on public.listing_price_drift to authenticated;

-- Um aviso por vendedor com anúncio que ficou longe desde o último aviso. O aviso não lido anterior
-- é trocado pelo novo, com a contagem de hoje.
create or replace function public.notify_price_drift() returns int
language plpgsql security definer set search_path = public as $$
declare
  s record;
  n int := 0;
begin
  for s in
    select d.seller_id, count(*) as total
    from public.listing_price_drift d
    where d.drifted
    group by d.seller_id
    having bool_or(d.price_alerted_cents is null or public.price_drifted(d.price_alerted_cents, d.expected_cents))
  loop
    delete from public.notifications where user_id = s.seller_id and kind = 'price_review' and read_at is null;
    perform public.notify(s.seller_id, null, 'price_review', null, null, null,
      case when s.total = 1 then '1 anúncio seu está com o preço longe da referência de hoje.'
           else s.total || ' anúncios seus estão com o preço longe da referência de hoje.' end);
    n := n + 1;
  end loop;

  update public.market_listings l set price_alerted_cents = d.expected_cents
  from public.listing_price_drift d
  where d.listing_id = l.id and d.drifted;
  return n;
end $$;

-- Atualiza pela regra os anúncios do vendedor que estão longe (só os ids pedidos, ou todos).
create or replace function public.reprice_listings(targets uuid[] default null) returns int
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  n int;
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  update public.market_listings l set
    price_cents = d.expected_cents,
    price_base_cents = d.base_now_cents,
    liga_price_cents = coalesce(d.liga_cents, l.liga_price_cents),
    liga_language = case when d.liga_cents is null then l.liga_language else d.liga_language end,
    liga_condition = case when d.liga_cents is null then l.liga_condition else d.liga_condition end
  from public.listing_price_drift d
  where d.listing_id = l.id and l.seller_id = me and d.drifted and (targets is null or l.id = any (targets));
  get diagnostics n = row_count;
  return n;
end $$;

-- Mantém o preço dos anúncios escolhidos, guardando a referência de hoje.
create or replace function public.keep_listing_prices(targets uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  n int;
begin
  if me is null then raise exception 'login required' using errcode = '42501'; end if;
  update public.market_listings l set price_ack_cents = d.expected_cents
  from public.listing_price_drift d
  where d.listing_id = l.id and l.seller_id = me and d.drifted and l.id = any (targets);
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.notify_price_drift(), public.reset_listing_price_review() from public, anon, authenticated;
revoke execute on function public.reprice_listings(uuid[]), public.keep_listing_prices(uuid[]) from public, anon;
grant execute on function public.reprice_listings(uuid[]), public.keep_listing_prices(uuid[]) to authenticated;

-- No Supabase: confere depois da coleta da Liga (21:00 UTC) e do TCGplayer (22:30 UTC).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('notify-price-drift', '0 23 * * *', 'select public.notify_price_drift()');
  end if;
end $$;
