-- Riftzada — permissões (Row Level Security)
-- Regra geral: só membros logados (e não banidos) leem; cada um escreve o que é seu;
-- admin cuida de eventos, resultados, ranking e usuários; moderador (futuro) e admin moderam.
-- O papel vem sempre de community_members, nunca do cliente.

-- ---------- Funções de permissão ----------
create or replace function public.member_role_in(c uuid) returns public.member_role
language sql stable security definer set search_path = public as $$
  select role from public.community_members
  where community_id = c and user_id = auth.uid() and not is_banned
$$;

create or replace function public.is_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.member_role_in(c) is not null
$$;

create or replace function public.is_moderator(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.member_role_in(c) in ('moderator', 'admin'), false)
$$;

create or replace function public.is_admin(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.member_role_in(c) = 'admin', false)
$$;

-- Admin de alguma comunidade (para o catálogo de cartas, que é global por jogo)
create or replace function public.is_any_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_members where user_id = auth.uid() and role = 'admin' and not is_banned)
$$;

create or replace function public.event_community(e uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select community_id from public.events where id = e
$$;

create or replace function public.post_community(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select community_id from public.posts where id = p
$$;

-- ---------- Colunas de moderação ----------
-- Quem não é moderador não consegue mudar is_hidden / is_featured, nem mesmo no próprio conteúdo.
-- Sem usuário (auth.uid() nulo) é o próprio servidor/seed com a chave de serviço: passa direto.
create or replace function public.guard_moderation_columns() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_moderator(new.community_id) then
    if tg_op = 'INSERT' then
      new.is_hidden := false;
      if tg_table_name = 'posts' then new.is_featured := false; end if;
    else
      new.is_hidden := old.is_hidden;
      if tg_table_name = 'posts' then new.is_featured := old.is_featured; end if;
    end if;
  end if;
  return new;
end $$;

create trigger posts_guard before insert or update on public.posts
  for each row execute function public.guard_moderation_columns();
create trigger listings_guard before insert or update on public.market_listings
  for each row execute function public.guard_moderation_columns();

-- ---------- Liga a RLS em tudo ----------
alter table public.communities enable row level security;
alter table public.cards enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.community_members enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_results enable row level security;
alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;
alter table public.market_listings enable row level security;
alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.ranking_rules enable row level security;
alter table public.ranking_entries enable row level security;

-- Visitantes sem login não leem nada
revoke all on all tables in schema public from anon;

-- ---------- communities ----------
create policy "communities: logado lê" on public.communities for select to authenticated using (true);

-- ---------- cards ----------
create policy "cards: logado lê" on public.cards for select to authenticated using (true);
create policy "cards: admin cadastra" on public.cards for insert to authenticated with check (public.is_any_admin());
create policy "cards: admin edita" on public.cards for update to authenticated using (public.is_any_admin()) with check (public.is_any_admin());
create policy "cards: admin apaga" on public.cards for delete to authenticated using (public.is_any_admin());

-- ---------- profiles ----------
-- Perfis só têm dados públicos (o e-mail fica em auth.users)
create policy "profiles: logado lê" on public.profiles for select to authenticated using (true);
create policy "profiles: dono edita" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- profile_contacts ----------
create policy "contacts: dono lê, outros só se compartilhado" on public.profile_contacts for select to authenticated
  using (user_id = auth.uid() or (share_whatsapp and whatsapp is not null));
create policy "contacts: dono cria" on public.profile_contacts for insert to authenticated with check (user_id = auth.uid());
create policy "contacts: dono edita" on public.profile_contacts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- community_members ----------
create policy "members: membros leem" on public.community_members for select to authenticated
  using (user_id = auth.uid() or public.is_member(community_id));
create policy "members: admin adiciona" on public.community_members for insert to authenticated with check (public.is_admin(community_id));
create policy "members: admin edita" on public.community_members for update to authenticated
  using (public.is_admin(community_id)) with check (public.is_admin(community_id));
create policy "members: admin remove" on public.community_members for delete to authenticated using (public.is_admin(community_id));

-- ---------- events ----------
create policy "events: membros leem" on public.events for select to authenticated using (public.is_member(community_id));
create policy "events: admin cria" on public.events for insert to authenticated with check (public.is_admin(community_id));
create policy "events: admin edita" on public.events for update to authenticated
  using (public.is_admin(community_id)) with check (public.is_admin(community_id));
create policy "events: admin apaga" on public.events for delete to authenticated using (public.is_admin(community_id));

-- ---------- event_participants ----------
create policy "participants: membros leem" on public.event_participants for select to authenticated
  using (public.is_member(public.event_community(event_id)));
-- "Vou jogar": só em evento marcado, só para si mesmo e só como 'going'
create policy "participants: eu vou" on public.event_participants for insert to authenticated
  with check (
    (user_id = auth.uid() and status = 'going'
      and public.is_member(public.event_community(event_id))
      and exists (select 1 from public.events e where e.id = event_id and e.status = 'scheduled'))
    or public.is_admin(public.event_community(event_id))
  );
create policy "participants: eu desisto" on public.event_participants for delete to authenticated
  using ((user_id = auth.uid() and status = 'going') or public.is_admin(public.event_community(event_id)));
create policy "participants: admin confirma presença" on public.event_participants for update to authenticated
  using (public.is_admin(public.event_community(event_id))) with check (public.is_admin(public.event_community(event_id)));

-- ---------- event_results ----------
create policy "results: membros leem" on public.event_results for select to authenticated
  using (public.is_member(public.event_community(event_id)));
create policy "results: admin cria" on public.event_results for insert to authenticated
  with check (public.is_admin(public.event_community(event_id)));
create policy "results: admin edita" on public.event_results for update to authenticated
  using (public.is_admin(public.event_community(event_id))) with check (public.is_admin(public.event_community(event_id)));
create policy "results: admin apaga" on public.event_results for delete to authenticated
  using (public.is_admin(public.event_community(event_id)));

-- ---------- decks ----------
create policy "decks: membros leem os visíveis" on public.decks for select to authenticated
  using (author_id = auth.uid() or (visibility <> 'private' and public.is_member(community_id)));
create policy "decks: membro publica" on public.decks for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(community_id));
create policy "decks: autor edita" on public.decks for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "decks: autor ou moderação apaga" on public.decks for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator(community_id));

create policy "deck_cards: segue o deck" on public.deck_cards for select to authenticated
  using (exists (select 1 from public.decks d where d.id = deck_id));
create policy "deck_cards: autor escreve" on public.deck_cards for all to authenticated
  using (exists (select 1 from public.decks d where d.id = deck_id and d.author_id = auth.uid()))
  with check (exists (select 1 from public.decks d where d.id = deck_id and d.author_id = auth.uid()));

-- ---------- market_listings ----------
create policy "listings: membros leem" on public.market_listings for select to authenticated
  using (public.is_member(community_id) and (not is_hidden or seller_id = auth.uid() or public.is_moderator(community_id)));
create policy "listings: membro anuncia" on public.market_listings for insert to authenticated
  with check (seller_id = auth.uid() and public.is_member(community_id));
create policy "listings: dono ou moderação edita" on public.market_listings for update to authenticated
  using (seller_id = auth.uid() or public.is_moderator(community_id))
  with check (seller_id = auth.uid() or public.is_moderator(community_id));
create policy "listings: dono ou moderação apaga" on public.market_listings for delete to authenticated
  using (seller_id = auth.uid() or public.is_moderator(community_id));

-- ---------- posts ----------
create policy "posts: membros leem" on public.posts for select to authenticated
  using (public.is_member(community_id) and (not is_hidden or author_id = auth.uid() or public.is_moderator(community_id)));
-- Post de campeão só o admin publica
create policy "posts: membro publica" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(community_id) and (kind <> 'champion' or public.is_admin(community_id)));
create policy "posts: autor ou moderação edita" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_moderator(community_id))
  with check (author_id = auth.uid() or public.is_moderator(community_id));
create policy "posts: autor ou moderação apaga" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator(community_id));

create policy "post_images: segue o post" on public.post_images for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_images: autor adiciona" on public.post_images for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "post_images: autor remove" on public.post_images for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- ---------- curtidas e comentários (fase 2) ----------
create policy "likes: membros leem" on public.post_likes for select to authenticated
  using (public.is_member(public.post_community(post_id)));
create policy "likes: eu curto" on public.post_likes for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(public.post_community(post_id)));
create policy "likes: eu descurto" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create policy "comments: membros leem" on public.post_comments for select to authenticated
  using (public.is_member(public.post_community(post_id)) and (not is_hidden or author_id = auth.uid()));
create policy "comments: membro comenta" on public.post_comments for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(public.post_community(post_id)));
create policy "comments: autor ou moderação apaga" on public.post_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator(public.post_community(post_id)));

-- ---------- conquistas ----------
create policy "achievements: logado lê" on public.achievements for select to authenticated using (true);
create policy "achievements: admin escreve" on public.achievements for all to authenticated
  using (public.is_any_admin()) with check (public.is_any_admin());
create policy "user_achievements: membros leem" on public.user_achievements for select to authenticated
  using (public.is_member(community_id));
create policy "user_achievements: admin concede" on public.user_achievements for all to authenticated
  using (public.is_admin(community_id)) with check (public.is_admin(community_id));

-- ---------- ranking ----------
create policy "rules: membros leem" on public.ranking_rules for select to authenticated using (public.is_member(community_id));
create policy "rules: admin edita" on public.ranking_rules for update to authenticated
  using (public.is_admin(community_id)) with check (public.is_admin(community_id));
create policy "entries: membros leem" on public.ranking_entries for select to authenticated using (public.is_member(community_id));
create policy "entries: admin lança" on public.ranking_entries for insert to authenticated
  with check (public.is_admin(community_id) and created_by = auth.uid());
create policy "entries: admin apaga" on public.ranking_entries for delete to authenticated using (public.is_admin(community_id));

-- ---------- Cadastro ----------
-- Visitante não lê profiles; esta função só responde se um apelido está livre.
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(name))
$$;
grant execute on function public.username_available(text) to anon, authenticated;
