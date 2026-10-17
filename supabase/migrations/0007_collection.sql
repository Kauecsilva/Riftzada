-- Riftzada — coleção de cartas
-- Cada jogador registra as cartas que tem (do catálogo) e pode anunciar qualquer uma no mercado.
-- A coleção é pessoal: só o dono vê e mexe. O anúncio guarda de qual item da coleção veio.

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  quantity int not null default 1 check (quantity between 1 and 999),
  condition public.card_condition not null default 'nm',
  variant text check (char_length(variant) <= 40),
  notes text check (char_length(notes) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- A mesma carta, condição e variante vira uma linha só (soma a quantidade)
create unique index collection_items_unique on public.collection_items (user_id, card_id, condition, coalesce(variant, ''));
create index collection_items_card_idx on public.collection_items (card_id);

create trigger collection_touch before update on public.collection_items for each row execute function public.touch_updated_at();

alter table public.collection_items enable row level security;

create policy "collection: dono lê" on public.collection_items for select to authenticated
  using (user_id = auth.uid());
create policy "collection: dono cadastra" on public.collection_items for insert to authenticated
  with check (user_id = auth.uid());
create policy "collection: dono edita" on public.collection_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collection: dono apaga" on public.collection_items for delete to authenticated
  using (user_id = auth.uid());

-- ---------- Anúncio a partir da coleção ----------
alter table public.market_listings
  add column collection_item_id uuid references public.collection_items (id) on delete set null;
create index market_listings_collection_idx on public.market_listings (collection_item_id) where collection_item_id is not null;
create index market_listings_card_idx on public.market_listings (card_id) where card_id is not null;

-- Um anúncio só aponta para um item da coleção do próprio vendedor
create or replace function public.guard_listing_collection_item() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.collection_item_id is not null and not exists (
    select 1 from public.collection_items where id = new.collection_item_id and user_id = new.seller_id
  ) then
    raise exception 'collection item does not belong to the seller' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger listings_collection_guard before insert or update of collection_item_id, seller_id on public.market_listings
  for each row execute function public.guard_listing_collection_item();

revoke execute on function public.guard_listing_collection_item() from public, anon, authenticated;
