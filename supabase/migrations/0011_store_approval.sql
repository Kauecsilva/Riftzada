-- Riftzada — conta de loja aprovada pelo admin
-- Qualquer membro pede o cadastro da loja, mas ela só vale depois que um admin aprova.
-- Só loja aprovada (pelo dono) e admin criam eventos: semanais, skirmish, campeonatos…
-- Loja pendente fica visível só para o dono e para o admin.

alter table public.stores
  add column approved_at timestamptz,
  add column approved_by uuid references public.profiles (id) on delete set null;

-- Lojas cadastradas antes desta migration continuam valendo
update public.stores set approved_at = created_at where approved_at is null;

create index stores_pending_idx on public.stores (community_id) where approved_at is null;

-- Dono de loja aprovada e ainda membro (banido perde o acesso)
create or replace function public.is_store_owner(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stores st
    where st.id = s and st.owner_id = auth.uid() and st.approved_at is not null and public.is_member(st.community_id)
  )
$$;

drop policy "stores: membros leem" on public.stores;
create policy "stores: membros leem as aprovadas" on public.stores for select to authenticated
  using (public.is_member(community_id) and (approved_at is not null or owner_id = auth.uid() or public.is_admin(community_id)));

-- Só o admin aprova: quem não é admin não mexe nos campos da aprovação
create or replace function public.guard_store_approval() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin(new.community_id) then
    if tg_op = 'INSERT' then
      new.approved_at := null;
      new.approved_by := null;
    else
      new.approved_at := old.approved_at;
      new.approved_by := old.approved_by;
    end if;
  end if;
  return new;
end $$;

create trigger stores_guard before insert or update on public.stores
  for each row execute function public.guard_store_approval();
