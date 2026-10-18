-- Riftzada — tipo de conta: jogador ou loja
-- Escolhido no cadastro (metadado account_kind do Supabase Auth). Só conta de loja pede o
-- cadastro de uma loja; depois da aprovação do admin (0011) ela cria os eventos, inclusive os semanais.
-- O próprio usuário não troca o tipo depois; só um admin.

create type public.account_kind as enum ('player', 'store');

alter table public.profiles add column account_kind public.account_kind not null default 'player';

-- Donos das lojas que já existem viram conta de loja
update public.profiles p set account_kind = 'store' where exists (select 1 from public.stores s where s.owner_id = p.id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  n int := 0;
  default_community uuid;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then base_username := 'jogador'; end if;
  base_username := left(base_username, 16);
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    n := n + 1;
    final_username := base_username || n::text;
  end loop;

  insert into public.profiles (id, username, display_name, account_kind)
  values (
    new.id, final_username,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), final_username), 40),
    case when new.raw_user_meta_data ->> 'account_kind' = 'store' then 'store' else 'player' end::public.account_kind
  );

  select id into default_community from public.communities where is_default limit 1;
  if default_community is not null then
    insert into public.community_members (community_id, user_id) values (default_community, new.id);
  end if;
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Quem não é admin não troca o próprio tipo de conta
create or replace function public.guard_account_kind() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_any_admin() then
    new.account_kind := old.account_kind;
  end if;
  return new;
end $$;

create trigger profiles_guard_account_kind before update on public.profiles
  for each row execute function public.guard_account_kind();

create or replace function public.is_store_account() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and account_kind = 'store')
$$;
revoke execute on function public.is_store_account() from public, anon;
grant execute on function public.is_store_account() to authenticated;

drop policy "stores: membro cadastra a sua" on public.stores;
create policy "stores: conta de loja cadastra a sua" on public.stores for insert to authenticated
  with check (owner_id = auth.uid() and public.is_member(community_id) and public.is_store_account());

-- Dono de loja aprovada, com conta de loja e ainda membro (banido perde o acesso)
create or replace function public.is_store_owner(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stores st
    join public.profiles p on p.id = st.owner_id
    where st.id = s and st.owner_id = auth.uid() and st.approved_at is not null
      and p.account_kind = 'store' and public.is_member(st.community_id)
  )
$$;
