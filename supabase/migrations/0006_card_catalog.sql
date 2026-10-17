-- Riftzada — catálogo de cartas importado do Riftcodex (https://riftcodex.com)
-- O Riftcodex é uma API pública e gratuita com todas as cartas de Riftbound (as mesmas do
-- piltoverarchive.com). Importamos para a tabela cards, que anúncios, coleção e decks referenciam.
--
-- Como funciona:
--   upsert_riftcodex_cards(jsonb)  grava uma página de cartas (testável sem rede)
--   sync_cards_from_riftcodex()    busca todas as páginas na API e chama a de cima
-- No Supabase a sincronização roda toda segunda às 06:00 de Brasília (pg_cron). Para rodar na mão:
--   select public.sync_cards_from_riftcodex();

-- ---------- Colunas novas no catálogo ----------
alter table public.cards drop constraint cards_source_check;
alter table public.cards add constraint cards_source_check check (source in ('manual', 'api', 'riftcodex'));

alter table public.cards
  add column public_code text check (char_length(public_code) <= 24),
  add column supertype text check (char_length(supertype) <= 30),
  add column domains text[] not null default '{}',
  add column energy int,
  add column might int,
  add column power int,
  add column rules_text text check (char_length(rules_text) <= 2000),
  add column artist text check (char_length(artist) <= 80),
  add column image_url text check (image_url ~ '^https://'),
  -- Variações de impressão (arte alternativa, numeração acima do set, assinatura)
  add column is_alternate_art boolean not null default false,
  add column is_overnumbered boolean not null default false,
  add column is_signature boolean not null default false,
  add column synced_at timestamptz;

-- ---------- Importação ----------
-- Recebe o array "items" da API do Riftcodex e faz upsert por (game, source, external_id).
create or replace function public.upsert_riftcodex_cards(items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  insert into public.cards as c (
    game, source, external_id, name, set_code, set_name, collector_no, public_code, rarity, card_type, supertype,
    domain, domains, energy, might, power, rules_text, artist, image_url,
    is_alternate_art, is_overnumbered, is_signature, synced_at
  )
  select
    'riftbound', 'riftcodex', i ->> 'id',
    left(i ->> 'name', 120),
    left(upper(i #>> '{set,set_id}'), 12),
    left(i #>> '{set,label}', 60),
    left(i ->> 'collector_number', 12),
    left(coalesce(i ->> 'public_code', upper(i #>> '{set,set_id}') || '-' || lpad(i ->> 'collector_number', 3, '0')), 24),
    left(i #>> '{classification,rarity}', 30),
    case
      when lower(i #>> '{classification,type}') = 'legend' then 'legend'
      when lower(i #>> '{classification,supertype}') = 'champion' then 'champion'
      when lower(i #>> '{classification,type}') in ('unit', 'spell', 'gear', 'rune', 'battlefield')
        then lower(i #>> '{classification,type}')
      else 'other'
    end::public.card_type,
    left(i #>> '{classification,supertype}', 30),
    left(array_to_string(array(select jsonb_array_elements_text(coalesce(i #> '{classification,domain}', '[]'))), ' / '), 30),
    array(select jsonb_array_elements_text(coalesce(i #> '{classification,domain}', '[]'))),
    (i #>> '{attributes,energy}')::int,
    (i #>> '{attributes,might}')::int,
    (i #>> '{attributes,power}')::int,
    left(i #>> '{text,plain}', 2000),
    left(i #>> '{media,artist}', 80),
    case when i #>> '{media,image_url}' ~ '^https://' then i #>> '{media,image_url}' end,
    coalesce((i #>> '{metadata,alternate_art}')::boolean, false),
    coalesce((i #>> '{metadata,overnumbered}')::boolean, false),
    coalesce((i #>> '{metadata,signature}')::boolean, false),
    now()
  from jsonb_array_elements(items) as i
  where i ->> 'id' is not null and coalesce(i ->> 'name', '') <> ''
  on conflict (game, source, external_id) do update set
    name = excluded.name, set_code = excluded.set_code, set_name = excluded.set_name,
    collector_no = excluded.collector_no, public_code = excluded.public_code, rarity = excluded.rarity,
    card_type = excluded.card_type, supertype = excluded.supertype, domain = excluded.domain, domains = excluded.domains,
    energy = excluded.energy, might = excluded.might, power = excluded.power, rules_text = excluded.rules_text,
    artist = excluded.artist, image_url = excluded.image_url, is_alternate_art = excluded.is_alternate_art,
    is_overnumbered = excluded.is_overnumbered, is_signature = excluded.is_signature, synced_at = excluded.synced_at;
  get diagnostics n = row_count;
  return n;
end $$;

-- Busca todas as páginas da API (extensão http, só existe no Supabase) e devolve quantas cartas gravou.
create or replace function public.sync_cards_from_riftcodex() returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  page int := 1;
  pages int := 1;
  total int := 0;
  res record;
  body jsonb;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '30000');
  while page <= pages loop
    select status, content into res from extensions.http_get(format('https://api.riftcodex.com/cards?size=100&page=%s', page));
    if res.status <> 200 then
      raise exception 'Riftcodex respondeu % na página %', res.status, page;
    end if;
    body := res.content::jsonb;
    pages := coalesce((body ->> 'pages')::int, page);
    total := total + public.upsert_riftcodex_cards(coalesce(body -> 'items', '[]'));
    page := page + 1;
  end loop;
  return total;
end $$;

-- Só o banco (pg_cron, SQL Editor) roda a importação
revoke execute on function public.upsert_riftcodex_cards(jsonb), public.sync_cards_from_riftcodex() from public, anon, authenticated;

-- No Supabase: liga a extensão http e agenda a sincronização semanal.
-- Num Postgres comum (CI) as extensões não existem e esta parte é pulada.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'http') then
    create extension if not exists http with schema extensions;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('sync-riftcodex-cards', '0 9 * * 1', 'select public.sync_cards_from_riftcodex()');
  end if;
end $$;
