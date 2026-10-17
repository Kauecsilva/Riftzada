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

-- ---------- Catálogo (Riftcodex) ----------
begin;
select pg_temp.check(public.upsert_riftcodex_cards($j$[
  {"id": "rc-1", "name": "Vi - Piltover Enforcer (Signature)", "collector_number": 229,
   "attributes": {"energy": null, "might": null, "power": null},
   "classification": {"type": "Legend", "supertype": null, "rarity": "Rare", "domain": ["Fury", "Order"]},
   "text": {"plain": "When you conquer, ready a unit."}, "set": {"set_id": "UNL", "label": "Unleashed"},
   "media": {"image_url": "https://cmsassets.rgpub.io/vi.png", "artist": "Jonathan Santoro"},
   "metadata": {"alternate_art": false, "overnumbered": false, "signature": true}},
  {"id": "rc-2", "name": "Jinx - Rebel", "collector_number": 7,
   "attributes": {"energy": 4, "might": 4, "power": 1},
   "classification": {"type": "Unit", "supertype": "Champion", "rarity": "Epic", "domain": ["Chaos"]},
   "set": {"set_id": "ogn", "label": "Origins"}, "media": {"image_url": "http://inseguro.dev/x.png"}, "metadata": {}},
  {"id": "rc-3", "name": "Sem tipo conhecido", "collector_number": 1, "classification": {"type": "Token"}, "set": {"set_id": "OGN"}},
  {"name": "sem id"}
]$j$) = 3, 'Importa 3 cartas e ignora a sem id');
select pg_temp.check((select card_type from cards where external_id = 'rc-1') = 'legend', 'Legend vira lenda');
select pg_temp.check((select card_type from cards where external_id = 'rc-2') = 'champion', 'Unidade campeã vira champion');
select pg_temp.check((select card_type from cards where external_id = 'rc-3') = 'other', 'Tipo desconhecido vira other');
select pg_temp.check((select public_code from cards where external_id = 'rc-2') = 'OGN-007', 'Código montado do set + número');
select pg_temp.check((select domains from cards where external_id = 'rc-1') = '{Fury,Order}', 'Domínios em array');
select pg_temp.check((select image_url from cards where external_id = 'rc-2') is null, 'Imagem sem https é descartada');
select pg_temp.check((select is_signature from cards where external_id = 'rc-1'), 'Assinatura marcada');
-- Rodar de novo atualiza em vez de duplicar
select public.upsert_riftcodex_cards('[{"id": "rc-2", "name": "Jinx - Rebel", "collector_number": 7, "classification": {"rarity": "Showcase"}, "set": {"set_id": "OGN"}}]');
select pg_temp.check((select count(*) from cards where external_id = 'rc-2') = 1, 'Upsert não duplica');
select pg_temp.check((select rarity from cards where external_id = 'rc-2') = 'Showcase', 'Upsert atualiza');
rollback;

begin;
select pg_temp.login('00000000-0000-4000-8000-100000000001'); -- Kauê (admin)
do $$ begin
  perform public.upsert_riftcodex_cards('[]');
  raise exception 'FALHOU: usuário rodou a importação';
exception when insufficient_privilege then null;
end $$;
rollback;

-- ---------- Coleção ----------
begin;
select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João
insert into public.collection_items (id, user_id, card_id, quantity)
values ('00000000-0000-4000-8000-a00000000001', '00000000-0000-4000-8000-100000000002', '00000000-0000-4000-8000-200000000001', 2);
-- Anuncia a partir da coleção
insert into public.market_listings (community_id, seller_id, kind, card_id, card_name, collection_item_id)
values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000002', 'sell', '00000000-0000-4000-8000-200000000001', 'Jinx, Loose Cannon', '00000000-0000-4000-8000-a00000000001');
-- Mesma carta/condição/variante não duplica
do $$ begin
  insert into public.collection_items (user_id, card_id) values ('00000000-0000-4000-8000-100000000002', '00000000-0000-4000-8000-200000000001');
  raise exception 'FALHOU: item duplicado na coleção';
exception when unique_violation then null;
end $$;
-- Não cadastra na coleção de outra pessoa
do $$ begin
  insert into public.collection_items (user_id, card_id) values ('00000000-0000-4000-8000-100000000003', '00000000-0000-4000-8000-200000000002');
  raise exception 'FALHOU: cadastrou na coleção de outro';
exception when insufficient_privilege then null;
end $$;

select pg_temp.login('00000000-0000-4000-8000-100000000003'); -- Rafael
select pg_temp.check((select count(*) from collection_items) = 0, 'Coleção alheia é invisível');
do $$ begin
  insert into public.market_listings (community_id, seller_id, kind, card_name, collection_item_id)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'sell', 'Jinx', '00000000-0000-4000-8000-a00000000001');
  raise exception 'FALHOU: anunciou item da coleção de outro';
exception when insufficient_privilege then null;
end $$;
rollback;

-- ---------- Preços de referência (TCGplayer) ----------
begin;
-- Mesma carta com pontuação diferente no nome; caixa lacrada (sem Number) e subtipo estranho ficam de fora
select pg_temp.check(public.upsert_tcgplayer_prices('ogn',
  '[{"productId": 653045, "name": "Kai''Sa, Daughter of the Void", "url": "https://www.tcgplayer.com/product/653045", "extendedData": [{"name": "Number", "value": "247/298"}]},
    {"productId": 1, "name": "Origins Booster Box", "extendedData": []}]',
  '[{"productId": 653045, "lowPrice": 48.0, "marketPrice": 53.21, "subTypeName": "Foil"},
    {"productId": 653045, "lowPrice": 1.0, "marketPrice": 1.0, "subTypeName": "Weird"},
    {"productId": 1, "lowPrice": 100.0, "marketPrice": 120.0, "subTypeName": "Normal"}]') = 1, 'Grava 1 preço do TCGplayer');
select pg_temp.check((select low_cents from card_prices where card_id = '00000000-0000-4000-8000-200000000002' and finish = 'foil') = 4800, 'Menor preço em centavos de dólar');
select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João
select pg_temp.check((select count(*) from card_prices) = 1, 'Logado lê os preços');
do $$ begin
  perform public.sync_card_prices();
  raise exception 'FALHOU: usuário rodou a sincronização de preços';
exception when insufficient_privilege then null;
end $$;
rollback;

-- ---------- Ofertas ----------
begin;
-- Rafael vende a Kai'Sa por R$ 90 e aceita ofertas a partir de R$ 50
select pg_temp.login('00000000-0000-4000-8000-100000000003');
update public.market_listings set accepts_offers = true, min_offer_cents = 5000 where id = '00000000-0000-4000-8000-500000000001';

select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João
do $$ begin
  perform public.make_listing_offer('00000000-0000-4000-8000-500000000001', 9000);
  raise exception 'FALHOU: oferta igual ao preço';
exception when invalid_parameter_value then null;
end $$;
do $$ begin
  perform public.make_listing_offer('00000000-0000-4000-8000-500000000001', 4000);
  raise exception 'FALHOU: oferta abaixo do mínimo';
exception when invalid_parameter_value then null;
end $$;
do $$ begin
  insert into public.listing_offers (listing_id, buyer_id, amount_cents) values ('00000000-0000-4000-8000-500000000001', '00000000-0000-4000-8000-100000000002', 6000);
  raise exception 'FALHOU: inseriu oferta sem passar pela função';
exception when insufficient_privilege then null;
end $$;
select public.make_listing_offer('00000000-0000-4000-8000-500000000001', 6000, 'Fecha por 60?');
-- Refazer a oferta atualiza a mesma linha
select set_config('test.offer', public.make_listing_offer('00000000-0000-4000-8000-500000000001', 7000)::text, true);
select pg_temp.check((select count(*) from listing_offers) = 1 and (select amount_cents from listing_offers) = 7000, 'Uma oferta em aberto por comprador');

select pg_temp.login('00000000-0000-4000-8000-100000000004'); -- Pedro
select pg_temp.check((select count(*) from listing_offers) = 0, 'Terceiro não vê a oferta');
do $$ begin
  perform public.respond_listing_offer(current_setting('test.offer')::uuid, 'accept');
  raise exception 'FALHOU: terceiro respondeu oferta';
exception when insufficient_privilege then null;
end $$;

select pg_temp.login('00000000-0000-4000-8000-100000000003'); -- Rafael (vendedor)
do $$ begin
  perform public.make_listing_offer('00000000-0000-4000-8000-500000000001', 6000);
  raise exception 'FALHOU: vendedor ofertou no próprio anúncio';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.respond_listing_offer((select id from public.listing_offers limit 1), 'counter', 9500);
  raise exception 'FALHOU: contraproposta acima do preço';
exception when invalid_parameter_value then null;
end $$;
select pg_temp.check(public.respond_listing_offer((select id from listing_offers limit 1), 'counter', 8000) = 'countered', 'Vendedor faz contraproposta');

select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João aceita a contraproposta
select pg_temp.check(public.respond_listing_offer((select id from listing_offers limit 1), 'accept') = 'accepted', 'Comprador aceita a contraproposta');
select pg_temp.check((select amount_cents from listing_offers) = 8000, 'Oferta fecha no valor da contraproposta');
select pg_temp.check((select status from market_listings where id = '00000000-0000-4000-8000-500000000001') = 'reserved', 'Anúncio de 1 unidade fica reservado');
rollback;
