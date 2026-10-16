-- Asserções sobre o seed: views calculam certo e a RLS barra o que deve barrar.
-- Cada bloco roda como um usuário logado (role authenticated + sub no JWT).

create or replace function pg_temp.login(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(user_id::text, ''), true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.check(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FALHOU: %', msg; end if;
end $$;

-- ---------- Views ----------
begin;
select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João
select pg_temp.check((select points from ranking where username = 'kaue') = 270, 'Kauê tem 270 pts');
select pg_temp.check((select points from ranking where username = 'joao') = 230, 'João tem 230 pts');
select pg_temp.check((select points from ranking where username = 'thiago') = 30, 'Thiago: 10 de presença + 20 de ajuste manual');
select pg_temp.check((select position from ranking where username = 'kaue') = 1, 'Kauê lidera');
select pg_temp.check((select position from ranking where username = 'bia') = (select position from ranking where username = 'pedro'), 'Bia e Pedro empatados');
select pg_temp.check((select titles from player_stats where username = 'joao') = 2, 'João tem 2 títulos');
select pg_temp.check((select top4 from player_stats where username = 'rafael') = 3, 'Rafael tem 3 top 4');
select pg_temp.check((select events_played from player_stats where username = 'thiago') = 1, 'Thiago jogou 1 torneio');
select pg_temp.check((select last_title_event_name from player_stats where username = 'joao') = 'Riftbound Weekly #21', 'Último título do João');
select pg_temp.check((select count(*) from hall_of_fame) = 6, 'Hall tem 6 jogadores com top 4');
select pg_temp.check((select appearances from legend_usage where legend_name like 'Jinx%') = 3, 'Jinx apareceu 3 vezes');
rollback;

-- ---------- Privacidade ----------
begin;
select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João
select pg_temp.check((select count(*) from profile_contacts where user_id = '00000000-0000-4000-8000-100000000001') = 1, 'WhatsApp compartilhado do Kauê aparece');
select pg_temp.check((select count(*) from profile_contacts where share_whatsapp = false) = 0, 'Contato não compartilhado fica escondido');
rollback;

begin;
select pg_temp.login(null); -- sem usuário
select pg_temp.check((select count(*) from posts) = 0, 'Sem login não lê posts');
rollback;

begin;
set local role anon;
do $$ begin
  perform 1 from public.profiles;
  raise exception 'FALHOU: anon leu profiles';
exception when insufficient_privilege then null;
end $$;
rollback;

-- ---------- Permissões de escrita ----------
begin;
select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João (user)
do $$ begin
  insert into public.events (community_id, name, starts_at, location)
  values ('00000000-0000-4000-8000-000000000001', 'Evento pirata', now(), 'Casa');
  raise exception 'FALHOU: usuário comum criou evento';
exception when insufficient_privilege then null;
end $$;
-- Não consegue virar admin
update public.community_members set role = 'admin' where user_id = '00000000-0000-4000-8000-100000000002';
select pg_temp.check((select role from community_members where user_id = '00000000-0000-4000-8000-100000000002') = 'user', 'Usuário não se promove');
-- Não consegue destacar o próprio post
insert into public.posts (id, community_id, author_id, body, is_featured)
values ('00000000-0000-4000-8000-900000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000002', 'olha eu', true);
select pg_temp.check((select is_featured from posts where id = '00000000-0000-4000-8000-900000000001') = false, 'Usuário não destaca o próprio post');
-- Não publica como outra pessoa
do $$ begin
  insert into public.posts (community_id, author_id, body)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'sou o Rafael');
  raise exception 'FALHOU: publicou como outra pessoa';
exception when insufficient_privilege then null;
end $$;
-- Não edita o anúncio dos outros (update simplesmente não encontra a linha)
update public.market_listings set price_cents = 1 where seller_id = '00000000-0000-4000-8000-100000000003';
select pg_temp.check((select price_cents from market_listings where id = '00000000-0000-4000-8000-500000000001') = 9000, 'Anúncio alheio intacto');
-- "Vou jogar" em evento finalizado é recusado
do $$ begin
  insert into public.event_participants (event_id, user_id) values ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000008');
  raise exception 'FALHOU: entrou em evento como outra pessoa';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into public.event_participants (event_id, user_id) values ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000002');
  raise exception 'FALHOU: marcou presença em evento finalizado';
exception when insufficient_privilege then null;
end $$;
-- Em evento marcado, pode desistir e voltar
delete from public.event_participants where event_id = '00000000-0000-4000-8000-300000000004' and user_id = '00000000-0000-4000-8000-100000000002';
insert into public.event_participants (event_id, user_id) values ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000002');
-- Upload só na própria pasta
do $$ begin
  insert into storage.objects (bucket_id, name) values ('media', '00000000-0000-4000-8000-100000000003/x.jpg');
  raise exception 'FALHOU: enviou foto na pasta de outro';
exception when insufficient_privilege then null;
end $$;
insert into storage.objects (bucket_id, name) values ('media', '00000000-0000-4000-8000-100000000002/posts/x.jpg');
rollback;

begin;
select pg_temp.login('00000000-0000-4000-8000-100000000001'); -- Kauê (admin)
insert into public.events (community_id, name, starts_at, location)
values ('00000000-0000-4000-8000-000000000001', 'Weekly #23', now() + interval '9 days', 'X1 Arena Cards');
update public.posts set is_featured = true where id = '00000000-0000-4000-8000-600000000002';
select pg_temp.check((select is_featured from posts where id = '00000000-0000-4000-8000-600000000002'), 'Admin destaca post');
update public.ranking_rules set points_by_placement = '{200,100,50,50}' where community_id = '00000000-0000-4000-8000-000000000001';
select pg_temp.check((select points from ranking where username = 'joao') = 430, 'Mudar a regra recalcula o ranking');
rollback;
