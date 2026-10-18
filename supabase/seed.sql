-- GERADO por scripts/generate-seed.mts — não edite à mão (npm run seed:sql)
-- Dados fictícios de desenvolvimento. Senha de todos os usuários: riftzada123
-- Rode só em ambiente de desenvolvimento/homologação.

begin;

-- A comunidade padrão (00000000-0000-4000-8000-000000000001) já vem da migration 0001_init.sql.

-- Usuários (o trigger handle_new_user cria perfil e associação)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000001', 'authenticated', 'authenticated', 'kaue@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"kaue","display_name":"Kauê"}', ((((now() at time zone 'America/Sao_Paulo')::date + -120) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-100000000001', '{"sub":"00000000-0000-4000-8000-100000000001","email":"kaue@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000002', 'authenticated', 'authenticated', 'joao@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"joao","display_name":"João"}', ((((now() at time zone 'America/Sao_Paulo')::date + -118) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000002', '00000000-0000-4000-8000-100000000002', '{"sub":"00000000-0000-4000-8000-100000000002","email":"joao@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000003', 'authenticated', 'authenticated', 'rafael@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"rafael","display_name":"Rafael"}', ((((now() at time zone 'America/Sao_Paulo')::date + -110) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000003', '00000000-0000-4000-8000-100000000003', '{"sub":"00000000-0000-4000-8000-100000000003","email":"rafael@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000004', 'authenticated', 'authenticated', 'pedro@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"pedro","display_name":"Pedro"}', ((((now() at time zone 'America/Sao_Paulo')::date + -95) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000004', '00000000-0000-4000-8000-100000000004', '{"sub":"00000000-0000-4000-8000-100000000004","email":"pedro@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000005', 'authenticated', 'authenticated', 'bia@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"bia","display_name":"Bia"}', ((((now() at time zone 'America/Sao_Paulo')::date + -80) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000005', '00000000-0000-4000-8000-100000000005', '{"sub":"00000000-0000-4000-8000-100000000005","email":"bia@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000006', 'authenticated', 'authenticated', 'lucas@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"lucas","display_name":"Lucas"}', ((((now() at time zone 'America/Sao_Paulo')::date + -60) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000006', '00000000-0000-4000-8000-100000000006', '{"sub":"00000000-0000-4000-8000-100000000006","email":"lucas@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000007', 'authenticated', 'authenticated', 'marina@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"marina","display_name":"Marina"}', ((((now() at time zone 'America/Sao_Paulo')::date + -45) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000007', '00000000-0000-4000-8000-100000000007', '{"sub":"00000000-0000-4000-8000-100000000007","email":"marina@riftzada.dev"}', 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-100000000008', 'authenticated', 'authenticated', 'thiago@riftzada.dev', crypt('riftzada123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"thiago","display_name":"Thiago"}', ((((now() at time zone 'America/Sao_Paulo')::date + -12) + time '10:00') at time zone 'America/Sao_Paulo'), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-4000-8000-100000000008', '00000000-0000-4000-8000-100000000008', '{"sub":"00000000-0000-4000-8000-100000000008","email":"thiago@riftzada.dev"}', 'email', now(), now(), now());

-- Lendas (catálogo manual)
insert into public.cards (id, name, set_name, set_code, card_type) values
  ('00000000-0000-4000-8000-200000000001', 'Jinx, Loose Cannon', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000002', 'Kai''Sa, Daughter of the Void', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000003', 'Ahri, Nine-Tailed Fox', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000004', 'Yasuo, Unforgiven', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000005', 'Viktor, Herald of the Arcane', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000006', 'Lee Sin, Blind Monk', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000007', 'Volibear, Relentless Storm', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000008', 'Darius, Hand of Noxus', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000009', 'Miss Fortune, Bounty Hunter', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000010', 'Garen, Might of Demacia', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000011', 'Annie, Dark Child', 'Origins', 'OGN', 'legend'),
  ('00000000-0000-4000-8000-200000000012', 'Master Yi, Wuju Bladesman', 'Origins', 'OGN', 'legend');

-- Perfis, contatos e papéis
update public.profiles set bio = 'Jinx até o fim. Organizo a resenha de sexta.', favorite_legend_id = '00000000-0000-4000-8000-200000000001', instagram = 'kaue.rift', city = 'São Paulo', state = 'SP', avatar_path = 'demo/avatar-kaue.svg', created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -120) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000001';
update public.community_members set role = 'admin' where user_id = '00000000-0000-4000-8000-100000000001';
insert into public.profile_contacts (user_id, whatsapp, share_whatsapp) values ('00000000-0000-4000-8000-100000000001', '11987654321', true);
update public.profiles set bio = 'Kai''Sa main. Atual bicampeão consecutivo.', favorite_legend_id = '00000000-0000-4000-8000-200000000002', instagram = null, city = 'São Paulo', state = 'SP', avatar_path = 'demo/avatar-joao.svg', created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -118) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000002';
update public.profiles set bio = 'Ahri control, café e paciência.', favorite_legend_id = '00000000-0000-4000-8000-200000000003', instagram = 'rafa.tcg', city = 'Campinas', state = 'SP', avatar_path = 'demo/avatar-rafael.svg', created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -110) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000003';
insert into public.profile_contacts (user_id, whatsapp, share_whatsapp) values ('00000000-0000-4000-8000-100000000003', '11912345678', true);
update public.profiles set bio = 'Abro booster demais. Às vezes sai coisa boa.', favorite_legend_id = '00000000-0000-4000-8000-200000000004', instagram = null, city = 'Santo André', state = 'SP', avatar_path = null, created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -95) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000004';
update public.profiles set bio = 'Viktor e matemática.', favorite_legend_id = '00000000-0000-4000-8000-200000000005', instagram = 'bia.plays', city = null, state = 'RJ', avatar_path = 'demo/avatar-bia.svg', created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -80) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000005';
update public.profiles set bio = null, favorite_legend_id = '00000000-0000-4000-8000-200000000008', instagram = null, city = 'Curitiba', state = 'PR', avatar_path = null, created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -60) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000006';
update public.profiles set bio = 'Volibear na cara do gol.', favorite_legend_id = '00000000-0000-4000-8000-200000000007', instagram = null, city = null, state = null, avatar_path = null, created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -45) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000007';
update public.profiles set bio = 'Novo na Rift, aprendendo com a galera.', favorite_legend_id = null, instagram = null, city = null, state = null, avatar_path = null, created_at = ((((now() at time zone 'America/Sao_Paulo')::date + -12) + time '10:00') at time zone 'America/Sao_Paulo') where id = '00000000-0000-4000-8000-100000000008';

-- Eventos
insert into public.events (id, community_id, name, description, format, starts_at, location, max_players, status, image_path, signup_url, player_count, results_image_path, results_notes, created_by) values
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-000000000001', 'Riftbound Weekly #19', 'Suíço de 4 rodadas, melhor de 1.', 'Constructed Bo1', ((((now() at time zone 'America/Sao_Paulo')::date + -21) + time '19:30') at time zone 'America/Sao_Paulo'), 'X1 Arena Cards', 16, 'finished', 'demo/event-weekly.svg', null, 10, 'demo/champion-19.svg', 'Mesa cheia e muita Jinx no top 8.', '00000000-0000-4000-8000-100000000001'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-000000000001', 'Riftbound Weekly #20', 'Suíço de 4 rodadas, melhor de 1.', 'Constructed Bo1', ((((now() at time zone 'America/Sao_Paulo')::date + -14) + time '19:30') at time zone 'America/Sao_Paulo'), 'X1 Arena Cards', 16, 'finished', 'demo/event-weekly.svg', null, 12, 'demo/champion-20.svg', null, '00000000-0000-4000-8000-100000000001'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-000000000001', 'Riftbound Weekly #21', 'Suíço de 4 rodadas + top 4.', 'Constructed Bo1', ((((now() at time zone 'America/Sao_Paulo')::date + -7) + time '19:30') at time zone 'America/Sao_Paulo'), 'X1 Arena Cards', 16, 'finished', 'demo/event-weekly.svg', null, 14, null, 'Final Kai''Sa x Jinx decidida no último ponto.', '00000000-0000-4000-8000-100000000001'),
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-000000000001', 'Riftbound Weekly #22', 'Suíço de 4 rodadas + top 4. Chega 15 minutos antes para o check-in.', 'Constructed Bo1', ((((now() at time zone 'America/Sao_Paulo')::date + 2) + time '19:30') at time zone 'America/Sao_Paulo'), 'X1 Arena Cards', 16, 'scheduled', null, null, null, null, null, '00000000-0000-4000-8000-100000000001'),
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-000000000001', 'Liga da Riftzada — Etapa 1', 'Melhor de 3, 5 rodadas. Premiação em boosters para o top 4.', 'Constructed Bo3', ((((now() at time zone 'America/Sao_Paulo')::date + 16) + time '14:00') at time zone 'America/Sao_Paulo'), 'X1 Arena Cards', 24, 'scheduled', null, 'https://forms.gle/exemplo', null, null, null, '00000000-0000-4000-8000-100000000001');
insert into public.event_participants (event_id, user_id, status) values
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000001', 'played'),
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000002', 'played'),
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000003', 'played'),
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000004', 'played'),
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000005', 'played'),
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000006', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000001', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000002', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000003', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000004', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000005', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000006', 'played'),
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000007', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000001', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000002', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000003', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000004', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000005', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000006', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000007', 'played'),
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000008', 'played'),
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000002', 'going'),
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000003', 'going'),
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000004', 'going'),
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000005', 'going'),
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000007', 'going'),
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-100000000001', 'going'),
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-100000000002', 'going');

-- Decks
insert into public.decks (id, community_id, author_id, name, legend_id, description, visibility, event_id, record, placement, created_at) values
  ('00000000-0000-4000-8000-400000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000001', 'Jinx Aggro', '00000000-0000-4000-8000-200000000001', 'Curva baixa, pressão desde o turno 1. Se o oponente respirar, já era. Mulligan agressivo atrás de 2-drops.', 'public', '00000000-0000-4000-8000-300000000003', '4-2', 2, ((((now() at time zone 'America/Sao_Paulo')::date + -6) + time '11:20') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-400000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000002', 'Kai''Sa Tempo', '00000000-0000-4000-8000-200000000002', 'A lista que levou o bi. Segura o early e vira no meio do jogo.', 'public', '00000000-0000-4000-8000-300000000003', '5-1', 1, ((((now() at time zone 'America/Sao_Paulo')::date + -5) + time '21:05') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-400000000003', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'Ahri Control', '00000000-0000-4000-8000-200000000003', null, 'public', '00000000-0000-4000-8000-300000000001', '3-1', 2, ((((now() at time zone 'America/Sao_Paulo')::date + -18) + time '09:40') at time zone 'America/Sao_Paulo'));
insert into public.deck_cards (deck_id, card_name, quantity, section, position) values
  ('00000000-0000-4000-8000-400000000001', 'Jinx, Rebel', 1, 'main', 0),
  ('00000000-0000-4000-8000-400000000001', 'Get Excited!', 3, 'main', 1),
  ('00000000-0000-4000-8000-400000000001', 'Flame Chompers', 3, 'main', 2),
  ('00000000-0000-4000-8000-400000000001', 'Noxus Hopeful', 3, 'main', 3),
  ('00000000-0000-4000-8000-400000000001', 'Brazen Buccaneer', 3, 'main', 4),
  ('00000000-0000-4000-8000-400000000001', 'Fury Rune', 6, 'runes', 5),
  ('00000000-0000-4000-8000-400000000001', 'Chaos Rune', 6, 'runes', 6),
  ('00000000-0000-4000-8000-400000000001', 'Zaun Warrens', 1, 'battlefields', 7),
  ('00000000-0000-4000-8000-400000000002', 'Kai''Sa, Survivor', 1, 'main', 0),
  ('00000000-0000-4000-8000-400000000002', 'Void Seeker', 3, 'main', 1),
  ('00000000-0000-4000-8000-400000000002', 'Hextech Ray', 3, 'main', 2),
  ('00000000-0000-4000-8000-400000000002', 'Mind Rune', 6, 'runes', 3),
  ('00000000-0000-4000-8000-400000000002', 'Fury Rune', 6, 'runes', 4),
  ('00000000-0000-4000-8000-400000000003', 'Ahri, Alluring', 1, 'main', 0),
  ('00000000-0000-4000-8000-400000000003', 'Charm', 3, 'main', 1),
  ('00000000-0000-4000-8000-400000000003', 'Calm Rune', 6, 'runes', 2),
  ('00000000-0000-4000-8000-400000000003', 'Mind Rune', 6, 'runes', 3);

-- Resultados
insert into public.event_results (id, event_id, placement, user_id, guest_name, legend_id, deck_id, record, notes) values
  ('00000000-0000-4000-8000-700000000001', '00000000-0000-4000-8000-300000000001', 1, '00000000-0000-4000-8000-100000000001', null, '00000000-0000-4000-8000-200000000001', '00000000-0000-4000-8000-400000000001', '4-0', null),
  ('00000000-0000-4000-8000-700000000002', '00000000-0000-4000-8000-300000000001', 2, '00000000-0000-4000-8000-100000000003', null, '00000000-0000-4000-8000-200000000003', '00000000-0000-4000-8000-400000000003', '3-1', null),
  ('00000000-0000-4000-8000-700000000003', '00000000-0000-4000-8000-300000000001', 3, '00000000-0000-4000-8000-100000000005', null, '00000000-0000-4000-8000-200000000005', null, '3-1', null),
  ('00000000-0000-4000-8000-700000000004', '00000000-0000-4000-8000-300000000001', 4, null, 'Gustavo (convidado)', '00000000-0000-4000-8000-200000000008', null, '2-2', null),
  ('00000000-0000-4000-8000-700000000005', '00000000-0000-4000-8000-300000000002', 1, '00000000-0000-4000-8000-100000000002', null, '00000000-0000-4000-8000-200000000002', '00000000-0000-4000-8000-400000000002', '4-0', null),
  ('00000000-0000-4000-8000-700000000006', '00000000-0000-4000-8000-300000000002', 2, '00000000-0000-4000-8000-100000000001', null, '00000000-0000-4000-8000-200000000001', '00000000-0000-4000-8000-400000000001', '3-1', null),
  ('00000000-0000-4000-8000-700000000007', '00000000-0000-4000-8000-300000000002', 3, '00000000-0000-4000-8000-100000000007', null, '00000000-0000-4000-8000-200000000007', null, '3-1', null),
  ('00000000-0000-4000-8000-700000000008', '00000000-0000-4000-8000-300000000002', 4, '00000000-0000-4000-8000-100000000003', null, '00000000-0000-4000-8000-200000000003', null, '2-2', null),
  ('00000000-0000-4000-8000-700000000009', '00000000-0000-4000-8000-300000000003', 1, '00000000-0000-4000-8000-100000000002', null, '00000000-0000-4000-8000-200000000002', '00000000-0000-4000-8000-400000000002', '5-1', 'Bicampeão!'),
  ('00000000-0000-4000-8000-700000000010', '00000000-0000-4000-8000-300000000003', 2, '00000000-0000-4000-8000-100000000001', null, '00000000-0000-4000-8000-200000000001', '00000000-0000-4000-8000-400000000001', '4-2', null),
  ('00000000-0000-4000-8000-700000000011', '00000000-0000-4000-8000-300000000003', 3, '00000000-0000-4000-8000-100000000003', null, '00000000-0000-4000-8000-200000000003', null, '4-1', null),
  ('00000000-0000-4000-8000-700000000012', '00000000-0000-4000-8000-300000000003', 4, '00000000-0000-4000-8000-100000000004', null, '00000000-0000-4000-8000-200000000004', null, '3-2', null);

-- Mercado
insert into public.market_listings (id, community_id, seller_id, kind, card_name, set_name, variant, condition, quantity, price_cents, accepts_trade, description, image_path, status, created_at, price_base, price_base_cents, discount_pct, liga_price_cents, liga_language, liga_condition, accepts_offers, min_offer_cents) values
  ('00000000-0000-4000-8000-500000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'sell', 'Kai''Sa, Survivor', 'Origins', 'Foil', 'nm', 1, 9000, true, 'Saiu no booster de ontem, direto pro sleeve.', 'demo/card-kaisa.svg', 'available', ((((now() at time zone 'America/Sao_Paulo')::date + -1) + time '18:10') at time zone 'America/Sao_Paulo'), 'liga', 10000, 10, 10000, 'en', 'nm', true, 6000),
  ('00000000-0000-4000-8000-500000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000004', 'sell', 'Jinx, Loose Cannon', 'Origins', 'Showcase', 'nm', 1, 12000, false, 'A famosa. Só venda, desculpa galera.', 'demo/card-jinx.svg', 'reserved', ((((now() at time zone 'America/Sao_Paulo')::date + -3) + time '20:30') at time zone 'America/Sao_Paulo'), null, null, null, null, null, null, false, null),
  ('00000000-0000-4000-8000-500000000003', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000005', 'trade', 'Viktor, Innovator', 'Origins', null, 'lp', 2, null, true, 'Troco por Runas de Mind ou cartas da Ahri.', null, 'available', ((((now() at time zone 'America/Sao_Paulo')::date + -2) + time '12:00') at time zone 'America/Sao_Paulo'), null, null, null, null, null, null, false, null),
  ('00000000-0000-4000-8000-500000000004', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000008', 'want', 'Fury Rune', 'Origins', null, 'nm', 6, 1500, true, 'Montando meu primeiro deck, alguém tem sobrando?', null, 'available', ((((now() at time zone 'America/Sao_Paulo')::date + 0) + time '09:15') at time zone 'America/Sao_Paulo'), null, null, null, null, null, null, false, null),
  ('00000000-0000-4000-8000-500000000005', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000001', 'sell', 'Brazen Buccaneer', 'Origins', null, 'nm', 3, 1000, true, null, 'demo/card-generic.svg', 'done', ((((now() at time zone 'America/Sao_Paulo')::date + -9) + time '15:00') at time zone 'America/Sao_Paulo'), null, null, null, null, null, null, false, null),
  ('00000000-0000-4000-8000-500000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000004', 'sell', 'Fury Rune', 'Origins', null, 'nm', 4, 300, true, 'Sobrou do pré-release.', null, 'available', ((((now() at time zone 'America/Sao_Paulo')::date + -1) + time '21:40') at time zone 'America/Sao_Paulo'), null, null, null, null, null, null, false, null);
insert into public.listing_offers (id, listing_id, buyer_id, amount_cents, counter_cents, message, status, created_at) values
  ('00000000-0000-4000-8000-b00000000001', '00000000-0000-4000-8000-500000000001', '00000000-0000-4000-8000-100000000002', 7500, null, 'Fecha por 75 e te encontro no sábado?', 'pending', ((((now() at time zone 'America/Sao_Paulo')::date + 0) + time '10:30') at time zone 'America/Sao_Paulo'));

-- Mural
insert into public.posts (id, community_id, author_id, kind, body, event_id, deck_id, is_featured, created_at) values
  ('00000000-0000-4000-8000-600000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000001', 'champion', 'Bicampeão na casa! Parabéns João, Kai''Sa tá voando.', '00000000-0000-4000-8000-300000000003', null, true, ((((now() at time zone 'America/Sao_Paulo')::date + -7) + time '23:40') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-600000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000004', 'pull', 'Abri só um booster pra ver qual era... e veio a Jinx Showcase. Sem palavras.', null, null, false, ((((now() at time zone 'America/Sao_Paulo')::date + -3) + time '20:12') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-600000000003', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000001', 'deck', 'Lista da Jinx que fez 2º no Weekly #21. Pode copiar e me xingar depois.', null, '00000000-0000-4000-8000-400000000001', false, ((((now() at time zone 'America/Sao_Paulo')::date + -6) + time '11:25') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-600000000004', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'general', 'Rolou testing hoje antes do torneio. Mesa 3 virou laboratório de Ahri.', null, null, false, ((((now() at time zone 'America/Sao_Paulo')::date + -1) + time '17:30') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-600000000005', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000005', 'general', 'Alguém topa um testing quinta à noite? Quero testar Viktor contra aggro.', null, null, false, ((((now() at time zone 'America/Sao_Paulo')::date + 0) + time '08:50') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-600000000006', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000001', 'champion', 'Kai''Sa chegou chegando. Parabéns João!', '00000000-0000-4000-8000-300000000002', null, false, ((((now() at time zone 'America/Sao_Paulo')::date + -14) + time '23:30') at time zone 'America/Sao_Paulo')),
  ('00000000-0000-4000-8000-600000000007', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000002', 'deck', 'A lista do bi. Perguntas nos comentários (quando tiver comentários).', null, '00000000-0000-4000-8000-400000000002', false, ((((now() at time zone 'America/Sao_Paulo')::date + -5) + time '21:10') at time zone 'America/Sao_Paulo'));
insert into public.post_images (post_id, path, position) values
  ('00000000-0000-4000-8000-600000000001', 'demo/champion-21.svg', 0),
  ('00000000-0000-4000-8000-600000000002', 'demo/card-jinx.svg', 0),
  ('00000000-0000-4000-8000-600000000004', 'demo/testing.svg', 0),
  ('00000000-0000-4000-8000-600000000006', 'demo/champion-20.svg', 0);

-- Ranking
update public.ranking_rules set points_by_placement = '{100,70,50,50}', participation_points = 10 where community_id = '00000000-0000-4000-8000-000000000001';
insert into public.ranking_entries (id, community_id, user_id, points, reason, created_by, created_at) values
  ('00000000-0000-4000-8000-800000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000008', 20, 'Bônus de boas-vindas da Liga', '00000000-0000-4000-8000-100000000001', ((((now() at time zone 'America/Sao_Paulo')::date + -10) + time '12:00') at time zone 'America/Sao_Paulo'));

commit;
