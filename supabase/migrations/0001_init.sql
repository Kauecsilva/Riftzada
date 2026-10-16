-- Riftzada — estrutura inicial
-- Tabelas, enums e índices. Permissões (RLS) em 0002, views em 0003, storage em 0004.

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type public.member_role as enum ('user', 'moderator', 'admin');
create type public.post_kind as enum ('general', 'pull', 'deck', 'champion');
create type public.event_status as enum ('scheduled', 'live', 'finished', 'cancelled');
create type public.participation_status as enum ('going', 'played', 'no_show');
create type public.listing_kind as enum ('sell', 'trade', 'want');
create type public.listing_status as enum ('available', 'reserved', 'done');
create type public.card_condition as enum ('nm', 'lp', 'mp', 'hp', 'damaged');
create type public.deck_visibility as enum ('public', 'unlisted', 'private');
create type public.card_type as enum ('legend', 'champion', 'unit', 'spell', 'gear', 'rune', 'battlefield', 'other');
create type public.deck_section as enum ('main', 'runes', 'battlefields', 'side');

-- ---------- Comunidades ----------
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 60),
  tagline text check (char_length(tagline) <= 120),
  game text not null default 'riftbound',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
-- Só uma comunidade pode ser a padrão (onde novos cadastros entram)
create unique index communities_one_default on public.communities (is_default) where is_default;

-- ---------- Catálogo de cartas ----------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  game text not null default 'riftbound',
  name text not null check (char_length(name) between 1 and 120),
  set_code text check (char_length(set_code) <= 12),
  set_name text check (char_length(set_name) <= 60),
  collector_no text check (char_length(collector_no) <= 12),
  rarity text check (char_length(rarity) <= 30),
  card_type public.card_type not null default 'other',
  domain text check (char_length(domain) <= 30),
  image_path text,
  -- Integração futura com uma fonte/API de cartas
  source text not null default 'manual' check (source in ('manual', 'api')),
  external_id text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (game, source, external_id)
);
create index cards_name_idx on public.cards (game, lower(name));
create index cards_type_idx on public.cards (game, card_type);

-- ---------- Perfis ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_path text,
  bio text check (char_length(bio) <= 160),
  favorite_legend_id uuid references public.cards (id) on delete set null,
  instagram text check (instagram ~ '^[A-Za-z0-9_.]{1,30}$'),
  created_at timestamptz not null default now()
);

-- Contato fica separado para ter RLS própria (privacidade)
create table public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  share_whatsapp boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'user',
  is_banned boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members (user_id);

-- ---------- Eventos ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  description text check (char_length(description) <= 1000),
  format text check (char_length(format) <= 40),
  starts_at timestamptz not null,
  location text not null check (char_length(location) between 2 and 80),
  max_players int check (max_players between 2 and 512),
  status public.event_status not null default 'scheduled',
  image_path text,
  signup_url text check (signup_url ~ '^https://'),
  -- Preenchidos ao registrar o resultado
  player_count int check (player_count between 0 and 512),
  results_image_path text,
  results_notes text check (char_length(results_notes) <= 1000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_community_start_idx on public.events (community_id, starts_at desc);

create table public.event_participants (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.participation_status not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_participants_user_idx on public.event_participants (user_id);

-- ---------- Decks ----------
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  legend_id uuid references public.cards (id) on delete set null,
  description text check (char_length(description) <= 2000),
  visibility public.deck_visibility not null default 'public',
  event_id uuid references public.events (id) on delete set null,
  record text check (record ~ '^[0-9]{1,2}-[0-9]{1,2}(-[0-9]{1,2})?$'),
  placement int check (placement between 1 and 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index decks_community_idx on public.decks (community_id, created_at desc);
create index decks_author_idx on public.decks (author_id);

create table public.deck_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  card_id uuid references public.cards (id) on delete set null,
  card_name text not null check (char_length(card_name) between 1 and 120),
  quantity int not null check (quantity between 1 and 60),
  section public.deck_section not null default 'main',
  position int not null default 0
);
create index deck_cards_deck_idx on public.deck_cards (deck_id, section, position);

-- ---------- Resultados ----------
create table public.event_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  placement int not null check (placement between 1 and 512),
  user_id uuid references public.profiles (id) on delete set null,
  guest_name text check (char_length(guest_name) between 1 and 40),
  legend_id uuid references public.cards (id) on delete set null,
  deck_id uuid references public.decks (id) on delete set null,
  record text check (record ~ '^[0-9]{1,2}-[0-9]{1,2}(-[0-9]{1,2})?$'),
  notes text check (char_length(notes) <= 280),
  created_at timestamptz not null default now(),
  -- Um jogador com conta OU um convidado, nunca os dois
  check ((user_id is null) <> (guest_name is null))
);
create unique index event_results_user_once on public.event_results (event_id, user_id) where user_id is not null;
create index event_results_event_idx on public.event_results (event_id, placement);
create index event_results_user_idx on public.event_results (user_id);

-- ---------- Mercado ----------
create table public.market_listings (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  kind public.listing_kind not null,
  card_id uuid references public.cards (id) on delete set null,
  card_name text not null check (char_length(card_name) between 2 and 120),
  set_name text check (char_length(set_name) <= 60),
  variant text check (char_length(variant) <= 40),
  condition public.card_condition not null default 'nm',
  quantity int not null default 1 check (quantity between 1 and 99),
  price_cents int check (price_cents between 0 and 100000000),
  accepts_trade boolean not null default false,
  description text check (char_length(description) <= 1000),
  image_path text,
  status public.listing_status not null default 'available',
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index market_listings_feed_idx on public.market_listings (community_id, status, created_at desc);
create index market_listings_seller_idx on public.market_listings (seller_id);

-- ---------- Mural ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind public.post_kind not null default 'general',
  body text check (char_length(body) <= 2000),
  event_id uuid references public.events (id) on delete cascade,
  deck_id uuid references public.decks (id) on delete cascade,
  listing_id uuid references public.market_listings (id) on delete cascade,
  is_featured boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  check (kind <> 'champion' or event_id is not null),
  check (kind <> 'deck' or deck_id is not null)
);
create index posts_feed_idx on public.posts (community_id, created_at desc);
create index posts_author_idx on public.posts (author_id);
-- Um post de campeão por evento
create unique index posts_one_champion_per_event on public.posts (event_id) where kind = 'champion';

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  path text not null,
  position int not null default 0,
  width int,
  height int
);
create index post_images_post_idx on public.post_images (post_id, position);

-- Fase 2 (tabelas prontas, sem tela ainda)
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

-- ---------- Conquistas (fase 2) ----------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]{3,40}$'),
  name text not null,
  description text not null,
  icon text not null default 'award',
  tier int not null default 1 check (tier between 1 and 3)
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id, community_id)
);

-- ---------- Ranking ----------
-- Regra de pontuação por comunidade. points_by_placement[1] = pontos do 1º lugar, e assim por diante.
create table public.ranking_rules (
  community_id uuid primary key references public.communities (id) on delete cascade,
  points_by_placement int[] not null default '{100,70,50,50}',
  participation_points int not null default 10 check (participation_points between 0 and 1000),
  updated_at timestamptz not null default now(),
  check (array_length(points_by_placement, 1) between 1 and 16)
);

-- Ajustes manuais (extrato): pontos positivos ou negativos com motivo
create table public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  points int not null check (points between -10000 and 10000 and points <> 0),
  reason text not null check (char_length(reason) between 3 and 120),
  event_id uuid references public.events (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index ranking_entries_user_idx on public.ranking_entries (community_id, user_id);

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();
create trigger decks_touch before update on public.decks for each row execute function public.touch_updated_at();
create trigger listings_touch before update on public.market_listings for each row execute function public.touch_updated_at();
create trigger contacts_touch before update on public.profile_contacts for each row execute function public.touch_updated_at();
create trigger rules_touch before update on public.ranking_rules for each row execute function public.touch_updated_at();

-- ---------- Novo cadastro ----------
-- Cria o perfil e a associação à comunidade padrão. O username vem do metadata do cadastro;
-- se já existir, ganha um sufixo numérico.
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

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), final_username), 40));

  select id into default_community from public.communities where is_default limit 1;
  if default_community is not null then
    insert into public.community_members (community_id, user_id) values (default_community, new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Comunidade inicial ----------
-- Id fixo: facilita seed, testes e o NEXT_PUBLIC_COMMUNITY_SLUG resolver sempre a mesma linha
insert into public.communities (id, slug, name, tagline, is_default)
values ('00000000-0000-4000-8000-000000000001', 'riftzada-x1', 'Riftzada', 'A comunidade local de Riftbound.', true);

insert into public.ranking_rules (community_id)
select id from public.communities where slug = 'riftzada-x1';
