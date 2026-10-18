-- Riftzada — cartas de coleções novas direto da galeria oficial da Riot
-- O Riftcodex demora para incluir uma coleção nova (Radiance saiu na pré-venda e ainda não estava lá).
-- A galeria oficial (riftbound.leagueoflegends.com/en-us/card-gallery) já traz as cartas, com imagem no
-- mesmo CDN da Riot. Importamos dela só as coleções que o Riftcodex ainda não tem.
--
-- Como funciona:
--   upsert_riot_gallery_cards(jsonb)  grava as cartas da galeria (testável sem rede)
--   sync_cards_from_riot_gallery()    baixa a galeria e chama a de cima
-- Quando o Riftcodex passa a ter a coleção, upsert_riftcodex_cards assume as cartas da Riot
-- (mesmo set e nome), mantendo o id: coleção, anúncios e decks continuam apontando para elas.
-- Para rodar na mão:  select public.sync_cards_from_riot_gallery();

alter table public.cards drop constraint cards_source_check;
alter table public.cards add constraint cards_source_check check (source in ('manual', 'api', 'riftcodex', 'riot'));

-- Recebe o array de cartas da galeria. Os nomes seguem o padrão do Riftcodex
-- ("Jinx - Rebel", "Kai'Sa - Daughter of the Void (Signature)") para a troca de fonte casar depois.
create or replace function public.upsert_riot_gallery_cards(items jsonb) returns int
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
    'riftbound', 'riot', g.id, left(g.base_name || g.variant, 120), g.set_code, left(g.set_name, 60),
    left(coalesce(nullif(regexp_replace(g.code, '^0+(?=[0-9])|[a-z*]+$', '', 'g'), ''), g.collector_no::text), 12),
    left(g.set_code || '-' || coalesce(nullif(regexp_replace(g.code, '[a-z*]+$', ''), ''), lpad(g.collector_no::text, 3, '0')), 24),
    left(initcap(g.i #>> '{rarity,value,id}'), 30),
    case
      when g.type_id = 'legend' then 'legend'
      when g.supertype = 'champion' then 'champion'
      when g.type_id in ('unit', 'spell', 'gear', 'rune', 'battlefield') then g.type_id
      else 'other'
    end::public.card_type,
    left(initcap(g.supertype), 30),
    left(array_to_string(g.domains, ' / '), 30), g.domains,
    (g.i #>> '{energy,value,id}')::int, (g.i #>> '{might,value,id}')::int, (g.i #>> '{power,value,id}')::int,
    left(nullif(trim(regexp_replace(regexp_replace(g.i #>> '{text,richText,body}', '<br\s*/?>', E'\n', 'g'), '<[^>]+>', '', 'g')), ''), 2000),
    left(g.i #>> '{illustrator,values,0,label}', 80),
    case when g.i #>> '{cardImage,url}' ~ '^https://' then g.i #>> '{cardImage,url}' end,
    g.alt, g.over, g.sig, now()
  from (
    select v.*,
      case when v.alt then ' (Alternate Art)' when v.sig then ' (Signature)' when v.over then ' (Overnumbered)' else '' end as variant
    from (
      select i, i ->> 'id' as id,
        left(upper(i #>> '{set,value,id}'), 12) as set_code,
        i #>> '{set,value,label}' as set_name,
        (i ->> 'collectorNumber')::int as collector_no,
        -- Número do código oficial sem set nem total: "OGN-007a/298" -> "007a", "RAD-R04a" -> "R04a", "RAD-SP1/005" -> "SP1"
        substring(i ->> 'publicCode' from '^[A-Za-z]+-([^/]+)') as code,
        lower(i #>> '{cardType,type,0,id}') as type_id,
        lower(i #>> '{cardType,superType,0,id}') as supertype,
        array(select jsonb_array_elements(coalesce(i #> '{domain,values}', '[]')) ->> 'label') as domains,
        case
          -- Lenda: a galeria traz só o título ("Daughter of the Void"); o campeão vem nas tags, junto
          -- com regiões ("Yordle", "Ziggs"), então fica a primeira tag que não é região
          when lower(i #>> '{cardType,type,0,id}') = 'legend' and v_champ.tag is not null
            then v_champ.tag || ' - ' || (i ->> 'name')
          when coalesce(i ->> 'subtitle', '') <> '' then (i ->> 'name') || ' - ' || (i ->> 'subtitle')
          else i ->> 'name'
        end as base_name,
        -- Letra depois do número ("007a", "R04a") ou impressão especial ("SP1") = arte alternativa;
        -- "*" = assinatura; número acima do total do set = overnumbered
        coalesce(substring(i ->> 'publicCode' from '^[A-Za-z]+-([^/]+)') ~ '([0-9][a-z]$)|(^SP)', false) as alt,
        coalesce(substring(i ->> 'publicCode' from '^[A-Za-z]+-([^/]+)') ~ '[*]$', false) as sig,
        coalesce(substring(i ->> 'publicCode' from '^[A-Za-z]+-([^/]+)') !~ '^SP'
          and (i ->> 'collectorNumber')::int > substring(i ->> 'publicCode' from '/([0-9]+)$')::int, false) as over
      from jsonb_array_elements(items) as i
      left join lateral (
        select t as tag from jsonb_array_elements_text(coalesce(i #> '{tags,tags}', '[]')) with ordinality as x(t, pos)
        where t not in ('Bandle City', 'Bilgewater', 'Demacia', 'Freljord', 'Ionia', 'Ixtal', 'Noxus', 'Piltover',
                        'Shadow Isles', 'Shurima', 'Targon', 'The Void', 'Void', 'Yordle', 'Zaun')
        order by pos limit 1
      ) v_champ on true
      where i ->> 'id' is not null and coalesce(i ->> 'name', '') <> ''
        and i ->> 'collectorNumber' ~ '^[0-9]+$' and coalesce(i #>> '{set,value,id}', '') <> ''
    ) v
  ) g
  -- Coleção que o Riftcodex já tem fica com ele
  where not exists (select 1 from public.cards r where r.source = 'riftcodex' and r.set_code = g.set_code)
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

-- Baixa a página da galeria e lê as cartas do JSON que o Next.js embute nela (__NEXT_DATA__).
create or replace function public.sync_cards_from_riot_gallery() returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  res record;
  marker text := '<script id="__NEXT_DATA__"';
  html text;
  start int;
  data jsonb;
  items jsonb;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '60000');
  select status, content into res from extensions.http_get('https://riftbound.leagueoflegends.com/en-us/card-gallery/');
  if res.status <> 200 then
    raise exception 'Galeria da Riot respondeu %', res.status;
  end if;
  start := strpos(res.content, marker);
  if start = 0 then
    raise exception 'Galeria da Riot sem __NEXT_DATA__';
  end if;
  html := substr(res.content, start);
  html := substr(html, strpos(html, '>') + 1);
  data := left(html, strpos(html, '</script>') - 1)::jsonb;
  select b -> 'cards' -> 'items' into items
  from jsonb_array_elements(data #> '{props,pageProps,page,blades}') b
  where b ->> 'type' = 'riftboundCardGallery'
  limit 1;
  if items is null then
    raise exception 'Galeria da Riot sem cartas';
  end if;
  return public.upsert_riot_gallery_cards(items);
end $$;

-- Quando o Riftcodex passa a ter a coleção, ele assume as cartas importadas da galeria (mesmo set e nome)
-- antes do upsert de sempre, para não duplicar e não quebrar coleção/anúncios que já usam a carta.
create or replace function public.upsert_riftcodex_cards(items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  -- Só assume quando o par é único dos dois lados (um item do Riftcodex para uma carta da galeria)
  with m as (
    select r.id, i ->> 'id' as rc_id
    from jsonb_array_elements(items) as i
    join public.cards r on r.source = 'riot'
      and r.set_code = left(upper(i #>> '{set,set_id}'), 12)
      and lower(r.name) = lower(left(i ->> 'name', 120))
    where i ->> 'id' is not null
      and not exists (select 1 from public.cards x where x.source = 'riftcodex' and x.external_id = i ->> 'id')
  )
  update public.cards c set source = 'riftcodex', external_id = m.rc_id
  from m
  where c.id = m.id
    and m.id in (select id from m group by id having count(*) = 1)
    and m.rc_id in (select rc_id from m group by rc_id having count(*) = 1);

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

-- Só o banco (pg_cron, SQL Editor) roda a importação
revoke execute on function public.upsert_riot_gallery_cards(jsonb), public.sync_cards_from_riot_gallery() from public, anon, authenticated;
revoke execute on function public.upsert_riftcodex_cards(jsonb) from public, anon, authenticated;

-- No Supabase: as duas fontes rodam todo dia (Riftcodex às 06:00, galeria às 06:30 de Brasília), para uma
-- coleção nova aparecer no dia seguinte à publicação. A importação semanal antiga é substituída.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    perform cron.schedule('sync-riftcodex-cards', '0 9 * * *', 'select public.sync_cards_from_riftcodex()');
    perform cron.schedule('sync-riot-gallery-cards', '30 9 * * *', 'select public.sync_cards_from_riot_gallery()');
  end if;
end $$;
