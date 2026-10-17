-- Riftzada — ajustes dos avisos de segurança do Supabase
-- 1. Funções de trigger com search_path fixo.
-- 2. Visitante sem login só executa username_available (usada no cadastro).
--    As funções de permissão continuam liberadas para quem está logado, porque a RLS as chama.
--    handle_new_user só roda como trigger, ninguém chama direto.

alter function public.touch_updated_at() set search_path = public;
alter function public.guard_moderation_columns() set search_path = public;

revoke execute on function
  public.member_role_in(uuid), public.is_member(uuid), public.is_moderator(uuid), public.is_admin(uuid),
  public.is_any_admin(), public.event_community(uuid), public.post_community(uuid), public.handle_new_user()
from public, anon;

revoke execute on function public.handle_new_user() from authenticated;

grant execute on function
  public.member_role_in(uuid), public.is_member(uuid), public.is_moderator(uuid), public.is_admin(uuid),
  public.is_any_admin(), public.event_community(uuid), public.post_community(uuid)
to authenticated;
