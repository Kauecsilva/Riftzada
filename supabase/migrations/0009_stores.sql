-- Riftzada — lojas e eventos das lojas
-- Qualquer membro cadastra a própria loja e vira o dono dela. O dono cria, edita e apaga
-- os eventos da loja (semanal, skirmish, pré-release…); o admin continua podendo tudo.
-- Evento semanal = várias datas ligadas pelo mesmo series_id (cada data tem o seu "Vou jogar").
-- Resultados e ranking continuam só com o admin.

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  address text check (char_length(address) <= 120),
  instagram text check (instagram ~ '^[A-Za-z0-9_.]{1,30}$'),
  description text check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index stores_community_name_idx on public.stores (community_id, lower(name));
create index stores_owner_idx on public.stores (owner_id);

create trigger stores_touch before update on public.stores for each row execute function public.touch_updated_at();

alter table public.events
  add column store_id uuid references public.stores (id) on delete set null,
  add column series_id uuid;
create index events_store_idx on public.events (store_id, starts_at) where store_id is not null;
create index events_series_idx on public.events (series_id) where series_id is not null;

-- ---------- Permissões ----------
create or replace function public.store_community(s uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select community_id from public.stores where id = s
$$;

-- Dono da loja e ainda membro (banido perde o acesso)
create or replace function public.is_store_owner(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stores st
    where st.id = s and st.owner_id = auth.uid() and public.is_member(st.community_id)
  )
$$;

revoke execute on function public.store_community(uuid), public.is_store_owner(uuid) from public, anon;
grant execute on function public.store_community(uuid), public.is_store_owner(uuid) to authenticated;

alter table public.stores enable row level security;

create policy "stores: membros leem" on public.stores for select to authenticated using (public.is_member(community_id));
create policy "stores: membro cadastra a sua" on public.stores for insert to authenticated
  with check (owner_id = auth.uid() and public.is_member(community_id));
create policy "stores: dono ou admin edita" on public.stores for update to authenticated
  using (owner_id = auth.uid() or public.is_admin(community_id))
  with check ((owner_id = auth.uid() and public.is_member(community_id)) or public.is_admin(community_id));
create policy "stores: dono ou admin apaga" on public.stores for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin(community_id));

create policy "events: loja cria" on public.events for insert to authenticated
  with check (
    store_id is not null and public.is_store_owner(store_id)
    and community_id = public.store_community(store_id) and created_by = auth.uid()
  );
create policy "events: loja edita" on public.events for update to authenticated
  using (public.is_store_owner(store_id))
  with check (public.is_store_owner(store_id) and community_id = public.store_community(store_id));
create policy "events: loja apaga" on public.events for delete to authenticated
  using (public.is_store_owner(store_id));

-- Quem não é admin não mexe nos campos do resultado (eles alimentam ranking e perfil)
create or replace function public.guard_event_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin(new.community_id) then
    if tg_op = 'INSERT' then
      new.player_count := null;
      new.results_image_path := null;
      new.results_notes := null;
    else
      new.player_count := old.player_count;
      new.results_image_path := old.results_image_path;
      new.results_notes := old.results_notes;
      new.created_by := old.created_by;
    end if;
  end if;
  return new;
end $$;

create trigger events_guard before insert or update on public.events
  for each row execute function public.guard_event_columns();
