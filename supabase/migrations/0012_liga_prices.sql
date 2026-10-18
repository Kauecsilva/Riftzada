-- Riftzada — menor preço da LigaRiftbound, coletado automaticamente.
-- A Liga bloqueia acesso vindo de servidor (Cloudflare), então a coleta roda num computador com
-- internet de casa (scripts/liga-sync.mts) e grava aqui pelas duas funções abaixo, que só aceitam
-- quem tem um token de coleta. O token fica só no computador; aqui guardamos o hash.
--   liga_sync_targets(token, max)            próximas cartas a consultar (anunciadas primeiro)
--   upsert_liga_prices(token, nomes, itens)   grava os preços das cartas consultadas
-- Para criar um token (no SQL Editor):
--   insert into public.price_sync_tokens (token_hash, label)
--   values (encode(extensions.digest('<token>', 'sha256'), 'hex'), 'PC do Kaue');

create table public.liga_prices (
  card_id uuid not null references public.cards (id) on delete cascade,
  finish text not null check (finish in ('normal', 'foil')),
  low_cents int not null check (low_cents between 1 and 100000000),
  avg_cents int check (avg_cents between 1 and 100000000),
  high_cents int check (high_cents between 1 and 100000000),
  -- Da oferta mais barata (só quando ela é desta versão)
  language text check (language in ('en', 'zh', 'pt', 'other')),
  condition public.card_condition,
  url text not null check (url ~ '^https://www\.ligariftbound\.com\.br/'),
  updated_at timestamptz not null default now(),
  primary key (card_id, finish)
);
alter table public.liga_prices enable row level security;
create policy "liga_prices: logado lê" on public.liga_prices for select to authenticated using (true);

-- Quando cada nome de carta foi consultado (inclusive sem oferta), para revezar a fila
create table public.liga_sync_log (
  name text primary key,
  checked_at timestamptz not null default now()
);
alter table public.liga_sync_log enable row level security;

create table public.price_sync_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  label text not null check (char_length(label) between 1 and 60),
  created_at timestamptz not null default now()
);
alter table public.price_sync_tokens enable row level security;
-- Sem policies: ninguém lê pela API

-- Nome da página da carta na Liga: sem a variação "(Alternate Art)" etc.
create or replace function public.liga_base_name(card_name text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(card_name, '\s*\([^)]*\)$', '')
$$;

create or replace function public.check_price_sync_token(sync_token text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if sync_token is null or char_length(sync_token) < 32
     or not exists (select 1 from public.price_sync_tokens where token_hash = encode(digest(sync_token, 'sha256'), 'hex')) then
    raise exception 'token de coleta inválido' using errcode = '42501';
  end if;
end $$;

-- Cartas a consultar, agrupadas pelo nome da página. Primeiro as que têm anúncio de venda ativo,
-- depois as nunca consultadas, depois as consultadas há mais tempo. Variações que a Liga não separa
-- por número (assinatura, numeração acima do set) ficam de fora.
create or replace function public.liga_sync_targets(sync_token text, max_names int default 300)
returns table (name text, cards jsonb)
language plpgsql security definer set search_path = public as $$
begin
  perform public.check_price_sync_token(sync_token);
  return query
  with candidates as (
    select c.id, public.liga_base_name(c.name) as base, c.set_code, c.collector_no, c.is_alternate_art
    from public.cards c
    where c.game = 'riftbound' and c.set_code is not null and c.collector_no is not null
      and not c.is_signature and not c.is_overnumbered
      and (c.name !~ '\([^)]*\)$' or c.is_alternate_art)
  ),
  grouped as (
    select cd.base,
           jsonb_agg(jsonb_build_object('id', cd.id, 'setCode', cd.set_code, 'collectorNo', cd.collector_no, 'alternateArt', cd.is_alternate_art)) as cards,
           bool_or(exists (
             select 1 from public.market_listings ml
             where ml.card_id = cd.id and ml.kind = 'sell' and ml.status = 'available'
           )) as listed
    from candidates cd
    group by cd.base
  )
  select g.base, g.cards
  from grouped g
  left join public.liga_sync_log l on l.name = g.base
  order by (g.listed and (l.checked_at is null or l.checked_at < now() - interval '20 hours')) desc,
           l.checked_at nulls first, g.base
  limit least(greatest(coalesce(max_names, 300), 1), 2000);
end $$;

-- Grava o resultado de um lote: names são os nomes consultados; items, os preços achados
-- ([{card_id, finish, low_cents, avg_cents, high_cents, language, condition}]). Preço que sumiu da
-- Liga (sem oferta hoje) é apagado.
create or replace function public.upsert_liga_prices(sync_token text, names text[], items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  perform public.check_price_sync_token(sync_token);
  if coalesce(array_length(names, 1), 0) > 500 or jsonb_array_length(coalesce(items, '[]')) > 2000 then
    raise exception 'lote grande demais' using errcode = '22023';
  end if;

  with input as (
    select (i->>'card_id')::uuid as card_id, i->>'finish' as finish, (i->>'low_cents')::int as low_cents,
           (i->>'avg_cents')::int as avg_cents, (i->>'high_cents')::int as high_cents,
           nullif(i->>'language', '') as language, nullif(i->>'condition', '')::public.card_condition as condition
    from jsonb_array_elements(coalesce(items, '[]')) i
  ),
  valid as (
    select i.*, c.name as card_name from input i
    join public.cards c on c.id = i.card_id
    where public.liga_base_name(c.name) = any (names)
  ),
  upserted as (
    insert into public.liga_prices as lp (card_id, finish, low_cents, avg_cents, high_cents, language, condition, url, updated_at)
    select v.card_id, v.finish, v.low_cents, v.avg_cents, v.high_cents, v.language, v.condition,
           'https://www.ligariftbound.com.br/?view=cards/card&card=' || replace(replace(replace(public.liga_base_name(v.card_name), '%', '%25'), ' ', '%20'), '&', '%26'),
           now()
    from valid v
    on conflict (card_id, finish) do update set
      low_cents = excluded.low_cents, avg_cents = excluded.avg_cents, high_cents = excluded.high_cents,
      language = excluded.language, condition = excluded.condition, url = excluded.url, updated_at = now()
    returning 1
  )
  select count(*) into n from upserted;

  delete from public.liga_prices lp
  using public.cards c
  where c.id = lp.card_id and public.liga_base_name(c.name) = any (names)
    and not exists (
      select 1 from jsonb_array_elements(coalesce(items, '[]')) i
      where (i->>'card_id')::uuid = lp.card_id and i->>'finish' = lp.finish
    );

  insert into public.liga_sync_log (name, checked_at)
  select distinct unnest(names), now()
  on conflict (name) do update set checked_at = now();

  return n;
end $$;

revoke execute on function public.check_price_sync_token(text) from public, anon, authenticated;
revoke execute on function public.liga_sync_targets(text, int), public.upsert_liga_prices(text, text[], jsonb) from public;
grant execute on function public.liga_sync_targets(text, int), public.upsert_liga_prices(text, text[], jsonb) to anon, authenticated;
