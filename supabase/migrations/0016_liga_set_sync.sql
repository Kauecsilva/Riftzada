-- Coleta da Liga pela página de cada coleção (src/server/liga-sync.ts, cron da Vercel).
-- A página da coleção traz também as cartas assinadas e overnumbered, então a lista de cartas
-- passa a incluir todas, com o nome completo para desempatar números repetidos.
create or replace function public.liga_sync_targets(sync_token text, max_names int default 300)
returns table (name text, cards jsonb)
language plpgsql security definer set search_path = public as $$
begin
  perform public.check_price_sync_token(sync_token);
  return query
  with candidates as (
    select c.id, c.name, public.liga_base_name(c.name) as base, c.set_code, c.collector_no
    from public.cards c
    where c.game = 'riftbound' and c.set_code is not null and c.collector_no is not null
  ),
  grouped as (
    select cd.base,
           jsonb_agg(jsonb_build_object('id', cd.id, 'name', cd.name, 'setCode', cd.set_code, 'collectorNo', cd.collector_no)) as cards
    from candidates cd
    group by cd.base
  )
  select g.base, g.cards
  from grouped g
  left join public.liga_sync_log l on l.name = g.base
  order by l.checked_at nulls first, g.base
  limit least(greatest(coalesce(max_names, 300), 1), 2000);
end $$;
