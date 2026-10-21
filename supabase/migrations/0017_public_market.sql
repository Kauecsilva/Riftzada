-- Mercado aberto para visitantes: quem não está logado (papel anon) lê os anúncios (lista e detalhe).
-- Só leitura, e só o necessário para a vitrine: anúncios não ocultos, catálogo de cartas, preços de
-- referência, a comunidade e, dos perfis, nome, @, avatar e região de quem tem anúncio visível.
-- Escrita, ofertas, conversas, contatos (WhatsApp), bio e o resto do app seguem só para logados.

grant select on public.communities, public.cards, public.card_prices, public.liga_prices, public.exchange_rates to anon;
create policy "communities: visitante lê" on public.communities for select to anon using (true);
create policy "cards: visitante lê" on public.cards for select to anon using (true);
create policy "card_prices: visitante lê" on public.card_prices for select to anon using (true);
create policy "liga_prices: visitante lê" on public.liga_prices for select to anon using (true);
create policy "exchange_rates: visitante lê" on public.exchange_rates for select to anon using (true);

grant select on public.market_listings to anon;
create policy "listings: visitante lê" on public.market_listings for select to anon using (not is_hidden);

-- Perfil: só as colunas da linha do vendedor e só de quem tem anúncio visível
grant select (id, username, display_name, avatar_path, city, state) on public.profiles to anon;
create policy "profiles: visitante lê vendedor" on public.profiles for select to anon
  using (exists (select 1 from public.market_listings l where l.seller_id = profiles.id and not l.is_hidden));
