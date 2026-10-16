-- Riftzada — estatísticas derivadas
-- Tudo aqui é calculado a partir de event_results + event_participants. Ninguém digita título ou ponto
-- à mão: registrar um resultado já atualiza perfil, Hall da Fama e ranking.
-- security_invoker = true: as views respeitam a RLS de quem consulta.

-- Quem jogou cada evento finalizado (presença confirmada OU aparece no resultado)
create view public.event_players with (security_invoker = true) as
select e.community_id, ep.event_id, ep.user_id
from public.event_participants ep
join public.events e on e.id = ep.event_id
where ep.status = 'played' and e.status = 'finished'
union
select e.community_id, r.event_id, r.user_id
from public.event_results r
join public.events e on e.id = r.event_id
where r.user_id is not null and e.status = 'finished';

create view public.player_stats with (security_invoker = true) as
select
  m.community_id,
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_path,
  coalesce(pl.events_played, 0)::int as events_played,
  coalesce(rs.titles, 0)::int as titles,
  coalesce(rs.seconds, 0)::int as seconds,
  coalesce(rs.top4, 0)::int as top4,
  lt.event_id as last_title_event_id,
  lt.event_name as last_title_event_name,
  lt.starts_at as last_title_at
from public.community_members m
join public.profiles p on p.id = m.user_id
left join lateral (
  select count(*) as events_played from public.event_players x
  where x.community_id = m.community_id and x.user_id = m.user_id
) pl on true
left join lateral (
  select
    count(*) filter (where r.placement = 1) as titles,
    count(*) filter (where r.placement = 2) as seconds,
    count(*) filter (where r.placement <= 4) as top4
  from public.event_results r
  join public.events e on e.id = r.event_id
  where e.community_id = m.community_id and e.status = 'finished' and r.user_id = m.user_id
) rs on true
left join lateral (
  select e.id as event_id, e.name as event_name, e.starts_at
  from public.event_results r
  join public.events e on e.id = r.event_id
  where e.community_id = m.community_id and e.status = 'finished' and r.user_id = m.user_id and r.placement = 1
  order by e.starts_at desc
  limit 1
) lt on true
where not m.is_banned;

-- Ranking: pontos pela regra atual da comunidade (colocação + presença) + ajustes manuais
create view public.ranking with (security_invoker = true) as
with result_points as (
  select e.community_id, r.user_id, sum(coalesce(rr.points_by_placement[r.placement], 0)) as pts
  from public.event_results r
  join public.events e on e.id = r.event_id
  join public.ranking_rules rr on rr.community_id = e.community_id
  where e.status = 'finished' and r.user_id is not null
  group by e.community_id, r.user_id
),
presence_points as (
  select x.community_id, x.user_id, count(*) * max(rr.participation_points) as pts
  from public.event_players x
  join public.ranking_rules rr on rr.community_id = x.community_id
  group by x.community_id, x.user_id
),
manual_points as (
  select community_id, user_id, sum(points) as pts
  from public.ranking_entries
  group by community_id, user_id
),
totals as (
  select s.*,
    (coalesce(rp.pts, 0) + coalesce(pp.pts, 0) + coalesce(mp.pts, 0))::int as points,
    coalesce(mp.pts, 0)::int as manual_points
  from public.player_stats s
  left join result_points rp on rp.community_id = s.community_id and rp.user_id = s.user_id
  left join presence_points pp on pp.community_id = s.community_id and pp.user_id = s.user_id
  left join manual_points mp on mp.community_id = s.community_id and mp.user_id = s.user_id
)
select
  t.*,
  rank() over (partition by t.community_id order by t.points desc, t.titles desc, t.top4 desc)::int as position
from totals t
where t.points <> 0 or t.events_played > 0;

-- Hall da Fama: quem já beliscou um top 4
create view public.hall_of_fame with (security_invoker = true) as
select * from public.player_stats
where top4 > 0;

-- Preparado para o "Meta da Riftzada" (fase 3): lendas mais usadas nos resultados
create view public.legend_usage with (security_invoker = true) as
select e.community_id, c.id as legend_id, c.name as legend_name, count(*)::int as appearances
from public.event_results r
join public.events e on e.id = r.event_id
join public.cards c on c.id = r.legend_id
where e.status = 'finished'
group by e.community_id, c.id, c.name;

grant select on public.event_players, public.player_stats, public.ranking, public.hall_of_fame, public.legend_usage to authenticated;
revoke all on public.event_players, public.player_stats, public.ranking, public.hall_of_fame, public.legend_usage from anon;
