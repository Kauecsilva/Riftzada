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

-- ---------- Catálogo (galeria da Riot, coleções que o Riftcodex ainda não tem) ----------
begin;
select public.upsert_riftcodex_cards('[{"id": "rc-ogn", "name": "Blazing Scorcher", "collector_number": 1, "set": {"set_id": "OGN", "label": "Origins"}}]');
select pg_temp.check(public.upsert_riot_gallery_cards($j$[
  {"id": "rad-038-167", "name": "Ahri", "subtitle": "Confident", "collectorNumber": 38, "publicCode": "RAD-038/167",
   "set": {"value": {"id": "RAD", "label": "Radiance"}},
   "cardType": {"type": [{"id": "unit"}], "superType": [{"id": "champion"}]},
   "rarity": {"value": {"id": "rare"}}, "domain": {"values": [{"label": "Calm"}]},
   "energy": {"value": {"id": 4}}, "might": {"value": {"id": 4}}, "power": {"value": {"id": 1}},
   "text": {"richText": {"body": "<p>[Disarm]<br />When you reduce Might, give me +1.</p>"}},
   "illustrator": {"values": [{"label": "Naifan Zhang"}]},
   "cardImage": {"url": "https://cmsassets.rgpub.io/ahri.png"}},
  {"id": "rad-038a-167", "name": "Ahri", "subtitle": "Confident", "collectorNumber": 38, "publicCode": "RAD-038a/167",
   "set": {"value": {"id": "RAD", "label": "Radiance"}}, "cardType": {"type": [{"id": "unit"}]}, "rarity": {"value": {"id": "showcase"}}},
  {"id": "rad-175-167", "name": "Agony's Embrace", "collectorNumber": 175, "publicCode": "RAD-175/167", "tags": {"tags": ["Evelynn"]},
   "set": {"value": {"id": "RAD", "label": "Radiance"}}, "cardType": {"type": [{"id": "legend"}]}, "rarity": {"value": {"id": "showcase"}}},
  {"id": "rad-176-star-167", "name": "Agony's Embrace", "collectorNumber": 176, "publicCode": "RAD-176*/167", "tags": {"tags": ["Evelynn"]},
   "set": {"value": {"id": "RAD", "label": "Radiance"}}, "cardType": {"type": [{"id": "legend"}]}, "rarity": {"value": {"id": "showcase"}}},
  {"id": "rad-180-167", "name": "Hexplosives Expert", "collectorNumber": 160, "publicCode": "RAD-160/167", "tags": {"tags": ["Yordle", "Ziggs"]},
   "set": {"value": {"id": "RAD", "label": "Radiance"}}, "cardType": {"type": [{"id": "legend"}]}, "rarity": {"value": {"id": "rare"}}},
  {"id": "rad-r04a", "name": "Body Rune", "collectorNumber": 4, "publicCode": "RAD-R04a",
   "set": {"value": {"id": "RAD", "label": "Radiance"}}, "cardType": {"type": [{"id": "rune"}]}, "rarity": {"value": {"id": "showcase"}}},
  {"id": "rad-sp1-005", "name": "Ahri", "subtitle": "Confident", "collectorNumber": 1, "publicCode": "RAD-SP1/005",
   "set": {"value": {"id": "RAD", "label": "Radiance"}}, "cardType": {"type": [{"id": "unit"}]}, "rarity": {"value": {"id": "showcase"}}},
  {"id": "ogn-001-298", "name": "Blazing Scorcher", "collectorNumber": 1, "publicCode": "OGN-001/298",
   "set": {"value": {"id": "OGN", "label": "Origins"}}, "cardType": {"type": [{"id": "unit"}]}}
]$j$) = 7, 'Galeria: importa as 7 da Radiance e pula a coleção que o Riftcodex já tem');
select pg_temp.check((select name from cards where external_id = 'rad-038-167') = 'Ahri - Confident', 'Galeria: nome no padrão do Riftcodex');
select pg_temp.check((select card_type from cards where external_id = 'rad-038-167') = 'champion', 'Galeria: campeã vira champion');
select pg_temp.check((select public_code from cards where external_id = 'rad-038-167') = 'RAD-038', 'Galeria: código sem o total do set');
select pg_temp.check((select rules_text from cards where external_id = 'rad-038-167') = E'[Disarm]\nWhen you reduce Might, give me +1.', 'Galeria: texto sem HTML');
select pg_temp.check((select rarity from cards where external_id = 'rad-038-167') = 'Rare', 'Galeria: raridade');
select pg_temp.check((select name from cards where external_id = 'rad-038a-167') = 'Ahri - Confident (Alternate Art)', 'Galeria: arte alternativa');
select pg_temp.check((select name from cards where external_id = 'rad-175-167') = 'Evelynn - Agony''s Embrace (Overnumbered)', 'Galeria: lenda leva o campeão e overnumbered');
select pg_temp.check((select is_signature from cards where external_id = 'rad-176-star-167'), 'Galeria: assinatura');
select pg_temp.check((select name from cards where external_id = 'rad-180-167') = 'Ziggs - Hexplosives Expert', 'Galeria: lenda pula a tag de região');
select pg_temp.check((select (public_code, collector_no, name) from cards where external_id = 'rad-r04a') = ('RAD-R04'::text, 'R04'::text, 'Body Rune (Alternate Art)'::text), 'Galeria: runa com código R04a');
select pg_temp.check((select (public_code, name, is_overnumbered) from cards where external_id = 'rad-sp1-005') = ('RAD-SP1'::text, 'Ahri - Confident (Alternate Art)'::text, false), 'Galeria: impressão especial SP');
select pg_temp.check((select collector_no from cards where external_id = 'rad-038a-167') = '38', 'Galeria: número sem zeros nem letra');
-- O Riftcodex passa a ter a Radiance: assume a carta da galeria em vez de duplicar
select public.upsert_riftcodex_cards('[{"id": "rc-ahri", "name": "Ahri - Confident", "collector_number": 38, "classification": {"type": "Unit", "rarity": "Rare"}, "set": {"set_id": "RAD", "label": "Radiance"}}]');
select pg_temp.check((select count(*) from cards where set_code = 'RAD' and name = 'Ahri - Confident') = 1, 'Riftcodex não duplica carta da galeria');
select pg_temp.check((select source from cards where external_id = 'rc-ahri') = 'riftcodex', 'Riftcodex assume a carta da galeria');
-- Depois disso a galeria não mexe mais na Radiance
select pg_temp.check(public.upsert_riot_gallery_cards('[{"id": "rad-038-167", "name": "Ahri", "collectorNumber": 38, "publicCode": "RAD-038/167", "set": {"value": {"id": "RAD"}}}]') = 0, 'Galeria pula coleção que o Riftcodex já tem');
rollback;

begin;
select pg_temp.login('00000000-0000-4000-8000-100000000001'); -- Kauê (admin)
do $$ begin
  perform public.upsert_riot_gallery_cards('[]');
  raise exception 'FALHOU: usuário rodou a importação da galeria';
exception when insufficient_privilege then null;
end $$;
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

-- ---------- Lojas ----------
begin;
-- Cadastro com account_kind = store vira conta de loja; sem ele, jogador
select set_config('request.jwt.claim.sub', '', true);
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-1000000000a1', 'loja@teste.dev', '{"username": "lojanova", "account_kind": "store"}'),
  ('00000000-0000-4000-8000-1000000000a2', 'jogador@teste.dev', '{"username": "jogadornovo"}');
select pg_temp.check((select account_kind from profiles where id = '00000000-0000-4000-8000-1000000000a1') = 'store', 'Cadastro como loja');
select pg_temp.check((select account_kind from profiles where id = '00000000-0000-4000-8000-1000000000a2') = 'player', 'Cadastro padrão é jogador');
update public.profiles set account_kind = 'store' where id = '00000000-0000-4000-8000-100000000002'; -- João vira conta de loja

select pg_temp.login('00000000-0000-4000-8000-100000000003'); -- Rafael (jogador) não cadastra loja
do $$ begin
  insert into public.stores (community_id, owner_id, name)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'Loja do Rafael');
  raise exception 'FALHOU: jogador cadastrou loja';
exception when insufficient_privilege then null;
end $$;
update public.profiles set account_kind = 'store' where id = '00000000-0000-4000-8000-100000000003';
select pg_temp.check((select account_kind from profiles where id = '00000000-0000-4000-8000-100000000003') = 'player', 'Jogador não vira loja sozinho');

select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João (conta de loja) cadastra a loja dele
insert into public.stores (id, community_id, owner_id, name, address, approved_at)
values ('00000000-0000-4000-8000-b00000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000002', 'Toca do Rift', 'Rua das Cartas, 123', now());
select pg_temp.check((select approved_at from stores where id = '00000000-0000-4000-8000-b00000000001') is null, 'Loja nasce pendente, mesmo mandando approved_at');
do $$ begin
  insert into public.events (community_id, store_id, name, starts_at, location, created_by)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-b00000000001', 'Antes da aprovação', now(), 'Toca', '00000000-0000-4000-8000-100000000002');
  raise exception 'FALHOU: loja pendente criou evento';
exception when insufficient_privilege then null;
end $$;
update public.stores set approved_at = now() where id = '00000000-0000-4000-8000-b00000000001';
select pg_temp.check((select approved_at from stores where id = '00000000-0000-4000-8000-b00000000001') is null, 'Dono não aprova a própria loja');

select pg_temp.login('00000000-0000-4000-8000-100000000003'); -- Rafael não vê loja pendente
select pg_temp.check((select count(*) from stores) = 0, 'Loja pendente fica escondida');
select pg_temp.login('00000000-0000-4000-8000-100000000001'); -- Kauê (admin) vê e aprova
select pg_temp.check((select count(*) from stores where approved_at is null) = 1, 'Admin vê a loja pendente');
update public.stores set approved_at = now(), approved_by = auth.uid() where id = '00000000-0000-4000-8000-b00000000001';
select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João, agora com loja aprovada
do $$ begin
  insert into public.stores (community_id, owner_id, name)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-100000000003', 'Loja do Rafael');
  raise exception 'FALHOU: cadastrou loja em nome de outro';
exception when insufficient_privilege then null;
end $$;
-- Semanal: duas datas da mesma série; campos de resultado são ignorados
insert into public.events (id, community_id, store_id, series_id, name, starts_at, location, created_by, player_count) values
  ('00000000-0000-4000-8000-b10000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-b00000000001', '00000000-0000-4000-8000-b90000000001', 'Semanal de Riftbound', now() + interval '3 days', 'Toca', '00000000-0000-4000-8000-100000000002', 99),
  ('00000000-0000-4000-8000-b10000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-b00000000001', '00000000-0000-4000-8000-b90000000001', 'Semanal de Riftbound', now() + interval '10 days', 'Toca', '00000000-0000-4000-8000-100000000002', null);
select pg_temp.check((select player_count from events where id = '00000000-0000-4000-8000-b10000000001') is null, 'Loja não preenche resultado');
update public.events set name = 'Semanal da Toca' where id = '00000000-0000-4000-8000-b10000000001';
select pg_temp.check((select name from events where id = '00000000-0000-4000-8000-b10000000001') = 'Semanal da Toca', 'Dono edita evento da loja');
do $$ begin
  update public.events set store_id = null where id = '00000000-0000-4000-8000-b10000000001';
  raise exception 'FALHOU: tirou o evento da loja';
exception when insufficient_privilege then null;
end $$;

select pg_temp.login('00000000-0000-4000-8000-100000000003'); -- Rafael (não é dono)
select pg_temp.check((select count(*) from stores) = 1, 'Membros veem as lojas');
do $$ begin
  insert into public.events (community_id, store_id, name, starts_at, location, created_by)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-b00000000001', 'Evento pirata', now(), 'Casa', '00000000-0000-4000-8000-100000000003');
  raise exception 'FALHOU: criou evento na loja de outro';
exception when insufficient_privilege then null;
end $$;
update public.events set name = 'Hackeado' where store_id = '00000000-0000-4000-8000-b00000000001';
delete from public.events where store_id = '00000000-0000-4000-8000-b00000000001';
update public.stores set name = 'Hackeada' where id = '00000000-0000-4000-8000-b00000000001';

select pg_temp.login('00000000-0000-4000-8000-100000000002'); -- João de novo
select pg_temp.check((select count(*) from events where store_id = '00000000-0000-4000-8000-b00000000001' and name <> 'Hackeado') = 2, 'Outro membro não mexe nos eventos da loja');
select pg_temp.check((select name from stores where id = '00000000-0000-4000-8000-b00000000001') = 'Toca do Rift', 'Outro membro não edita a loja');
delete from public.events where series_id = '00000000-0000-4000-8000-b90000000001';
select pg_temp.check((select count(*) from events where store_id is not null) = 0, 'Dono apaga o semanal');

-- ---------- Região no perfil ----------
select pg_temp.login('00000000-0000-4000-8000-100000000003'); -- Rafael
update public.profiles set city = 'Campinas', state = 'SP' where id = '00000000-0000-4000-8000-100000000003';
select pg_temp.check((select city || '/' || state from profiles where id = '00000000-0000-4000-8000-100000000003') = 'Campinas/SP', 'Dono edita a própria região');
do $$ begin
  update public.profiles set city = 'Niterói', state = null where id = '00000000-0000-4000-8000-100000000003';
  raise exception 'FALHOU: cidade sem UF';
exception when check_violation then null;
end $$;
do $$ begin
  update public.profiles set state = 'XX' where id = '00000000-0000-4000-8000-100000000003';
  raise exception 'FALHOU: UF inválida';
exception when check_violation then null;
end $$;
update public.profiles set city = 'Hackeada', state = 'AC' where id = '00000000-0000-4000-8000-100000000002';
select pg_temp.check((select coalesce(city, '') from profiles where id = '00000000-0000-4000-8000-100000000002') <> 'Hackeada', 'Não edita a região de outro');
rollback;
