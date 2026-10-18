# Riftzada — Planejamento técnico (v0.1)

> A comunidade local de Riftbound. Torneios, decks, trocas e resenha.

Este documento responde à "Primeira tarefa" do briefing: arquitetura, pastas, banco, relacionamentos, MVP vs. futuro, design system, telas, backlog e riscos. Ele vive em `docs/ARQUITETURA.md` no repositório e deve ser atualizado junto com o código.

---

## 1. Arquitetura técnica

**Um único app Next.js + Supabase.** Sem microserviços, sem backend separado, sem ORM.

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript estrito) | Server Components leem o banco direto no servidor; Server Actions fazem as escritas. Uma pessoa mantém tudo. |
| Estilo | Tailwind CSS v4 com tokens em CSS (`@theme`) | Tokens centralizam cores/cantos; utilitários evitam CSS gigante. |
| Ícones | lucide-react | Mesmo padrão do Pesqueiro.GG, leve e consistente. |
| Validação | Zod (compartilhado entre form e Server Action) | Uma regra, validada no servidor sempre. |
| Banco | Supabase Postgres + Row Level Security | Toda regra de permissão mora no banco; o front nunca é a última linha de defesa. |
| Auth | Supabase Auth (e-mail + senha), `@supabase/ssr` com cookies | Sessão persistente, recuperação de senha pronta. |
| Storage | Supabase Storage, bucket público `media` com limite de 5 MB e só imagens | Fotos fora do banco; o banco guarda só o caminho. |
| Deploy | Vercel (região GRU próxima do Supabase `sa-east-1`) | Mesmo fluxo do Pesqueiro. |
| PWA | `app/manifest.ts` + service worker mínimo | "Adicionar à tela inicial" sem loja de apps. |

### Fluxo de dados

```
Navegador ──(GET)──▶ Server Component ──▶ src/server/queries/* ──▶ Supabase (RLS como o usuário logado)
Navegador ──(form)──▶ Server Action ──▶ Zod ──▶ src/server/actions/* ──▶ Supabase (RLS) ──▶ revalidatePath
Navegador ──(upload)──▶ compressão no cliente ──▶ Supabase Storage (pasta do próprio usuário) ──▶ path vai no form
```

- **Leituras**: sempre no servidor, em funções pequenas por domínio (`queries/feed.ts`, `queries/arena.ts`…). Nenhuma página monta SQL na mão.
- **Escritas**: Server Actions validam com Zod, checam sessão, e o Supabase aplica RLS. O papel (ADMIN) é lido do banco (`community_members.role`), nunca do cliente.
- **Regras de negócio** (pontuação, estatísticas, parser de lista de deck, formatação) ficam em `src/lib/domain/*`, puras e testáveis.
- **Estatísticas derivadas** (títulos, top 4, torneios jogados, pontos do ranking) são **views SQL** calculadas a partir de `event_results` e `event_participants`. Registrar um resultado alimenta perfil, Hall da Fama, histórico e ranking sem duplicar nada.

### Autenticação

1. **Cadastro** (`/cadastro`): tipo de conta (Jogador ou Loja), apelido (`@username`, também usado como nome de exibição), e-mail e senha. Conta de loja cai em `/loja` para pedir o cadastro da loja. Com "Confirm email" desligado no Supabase, a pessoa já entra logada.
2. **Confirmação** (`/auth/confirm`): troca o token por sessão e leva para a Home.
3. Um **trigger** em `auth.users` cria o `profile` e a associação (`community_members`, papel `user`) na comunidade padrão.
4. **Login** (`/entrar`), **Logout** (`/auth/sair`, POST), **Esqueci a senha** (`/esqueci-senha`) → e-mail → `/redefinir-senha`.
5. **Persistência**: cookies HTTP-only renovados pelo `proxy.ts` (o antigo middleware do Next) em toda navegação.
6. **Rotas protegidas**: tudo exige login, exceto páginas de auth, manifest e service worker. A comunidade é pequena e fechada; isso também protege fotos e nomes de quem não quer aparecer no Google.

### Permissões

| Papel | Onde mora | Pode |
|---|---|---|
| `user` | `community_members.role` | Publicar no mural, anunciar, publicar deck, marcar "Vou jogar", editar o próprio perfil e o próprio conteúdo. |
| `moderator` (futuro) | idem | Ocultar posts e anúncios. Já previsto no enum e nas funções. |
| `admin` | idem | Tudo acima + eventos, resultados, ranking, destaque de posts, usuários. |

- Funções SQL `is_member(community)`, `is_moderator(community)` e `is_admin(community)` (security definer, `search_path` fixo) são usadas em todas as policies.
- O painel `/admin` checa o papel no servidor (layout do admin) **e** o banco recusa a escrita via RLS. Duas camadas.
- Um usuário não consegue mudar o próprio papel: só admin escreve em `community_members`.

### Modo demonstração

Enquanto o projeto Supabase não existe, o app roda com `NEXT_PUBLIC_SUPABASE_URL` vazio em **modo demonstração**: as telas leem os mesmos dados do seed (`src/lib/demo/`) e as ações respondem "modo demonstração". Isso permite ver e testar o visual antes de configurar credenciais. Com as variáveis preenchidas, o modo some sozinho.

---

## 2. Estrutura de pastas

```
riftzada/
├─ docs/ARQUITETURA.md          ← este documento
├─ supabase/
│  ├─ migrations/0001_init.sql  ← tabelas, enums, índices
│  ├─ migrations/0002_rls.sql   ← funções de permissão + policies
│  ├─ migrations/0003_views.sql ← estatísticas, ranking, hall
│  ├─ migrations/0004_storage.sql
│  └─ seed.sql                  ← dados fictícios de desenvolvimento
├─ public/                      ← ícones do PWA, sw.js
├─ src/
│  ├─ app/
│  │  ├─ (auth)/entrar | cadastro | esqueci-senha | redefinir-senha
│  │  ├─ auth/confirm | auth/sair         ← route handlers
│  │  ├─ (app)/                           ← layout com barra inferior
│  │  │  ├─ page.tsx                      ← Home / Mural
│  │  │  ├─ arena/ (próximos, resultados, ranking, hall, eventos/[id])
│  │  │  ├─ mercado/ (lista, [id], novo, [id]/editar)
│  │  │  ├─ decks/ ([id], novo)
│  │  │  ├─ publicar/                     ← novo post
│  │  │  ├─ jogador/[username]/           ← perfil público
│  │  │  └─ perfil/ (redireciona) | perfil/editar
│  │  ├─ admin/                           ← layout próprio, só admin
│  │  │  ├─ page.tsx | eventos/ | eventos/[id]/resultado | moderacao | usuarios | ranking
│  │  ├─ manifest.ts | layout.tsx | globals.css
│  ├─ components/
│  │  ├─ ui/        ← Button, Card, Avatar, Photo, EmptyState, Skeleton, Sheet, Toast, Field…
│  │  ├─ layout/    ← AppShell, BottomNav, SideNav, PublishSheet, PageHeader
│  │  ├─ feed/      ← PostCard, ChampionCard, NewPostForm
│  │  ├─ arena/     ← EventCard, RsvpButton, PodiumList, RankingList, HallCard
│  │  ├─ market/    ← ListingCard, ListingForm, InterestButton
│  │  ├─ decks/     ← DeckCard, DeckList, CopyListButton
│  │  ├─ profile/   ← ProfileHeader, StatsRow, ProfileForm
│  │  └─ admin/     ← EventForm, ResultForm, ModerationRow…
│  ├─ server/
│  │  ├─ queries/   ← leituras por domínio (feed, arena, market, decks, profiles, admin)
│  │  ├─ actions/   ← Server Actions por domínio
│  │  └─ session.ts ← usuário atual + papel + comunidade
│  ├─ lib/
│  │  ├─ supabase/  ← client (browser), server, proxy (sessão)
│  │  ├─ domain/    ← regras puras: scoring, stats, decklist, labels
│  │  ├─ validation/← schemas Zod
│  │  ├─ demo/      ← dados do modo demonstração
│  │  ├─ images.ts  ← compressão, URL pública, fallback
│  │  └─ format.ts  ← datas, moeda, plural
│  ├─ types/        ← tipos do domínio e do banco
│  └─ proxy.ts      ← renovação de sessão e redirecionamento de login
└─ tests/           ← Vitest (domínio) + testes SQL (RLS e views)
```

Regra: **um arquivo por componente**, nenhum arquivo passando de ~200 linhas sem motivo.

---

## 3. Banco de dados

Todas as tabelas têm `id uuid` (exceto junções), `created_at`, RLS ligado, e as que pertencem a uma comunidade têm `community_id`. O jogo é uma coluna `game` (padrão `'riftbound'`) só onde faz sentido para o futuro multi-TCG: `communities` e `cards`.

### Enums

- `member_role`: `user`, `moderator`, `admin`
- `post_kind`: `general`, `pull`, `deck`, `champion`
- `event_status`: `scheduled`, `live`, `finished`, `cancelled`
- `participation_status`: `going`, `played`, `no_show`
- `listing_kind`: `sell` (VENDE), `trade` (TROCA), `want` (PROCURA)
- `listing_status`: `available`, `reserved`, `done`
- `card_condition`: `nm`, `lp`, `mp`, `hp`, `damaged`
- `deck_visibility`: `public`, `unlisted`, `private`
- `card_type`: `legend`, `champion`, `unit`, `spell`, `gear`, `rune`, `battlefield`, `other`

### Tabelas

| Tabela | Colunas principais | Observações |
|---|---|---|
| `communities` | id, slug, name, game, tagline, is_default | Começa com "Riftzada X1". |
| `profiles` | id (= auth.users.id), username (único, minúsculo), display_name, avatar_path, bio, favorite_legend_id → cards, instagram, account_kind (player/store), created_at | Nunca guarda e-mail. `account_kind` vem do cadastro e só o admin troca (migration 0012). "Users" é o `auth.users` do Supabase. |
| `profile_contacts` | user_id, whatsapp, share_whatsapp | Separado para RLS própria: só o dono lê o número; outros membros só leem se `share_whatsapp = true`. |
| `community_members` | community_id, user_id, role, joined_at, is_banned | Papel por comunidade (multi-loja futura sem refazer nada). |
| `cards` | id, game, name, set_code, set_name, collector_no, rarity, card_type, domain, image_path, external_id, source (`manual`/`api`) | Catálogo modular. `external_id` + `source` deixam a API futura entrar sem mexer no resto. |
| `posts` | id, community_id, author_id, kind, body, event_id?, deck_id?, listing_id?, is_featured, is_hidden, created_at | Mural. O post "campeão" aponta para o evento e lê o pódio de `event_results`. |
| `post_images` | id, post_id, path, position, width, height | Até 4 fotos por post. |
| `post_likes` | post_id, user_id | Fase 2 (tabela já criada). |
| `post_comments` | id, post_id, author_id, body, is_hidden | Fase 2. |
| `stores` | id, community_id, owner_id → profiles, name (único por comunidade), address?, instagram?, description?, approved_at?, approved_by? | Conta de loja (`profiles.account_kind = store`, 0012) pede o cadastro da própria loja; ela nasce pendente e só um admin aprova (0011). Só o dono de loja aprovada cria/edita/apaga os eventos da loja (semanais, campeonatos…); admin pode tudo. Loja pendente só aparece para o dono e o admin. |
| `events` | id, community_id, store_id? → stores, series_id?, name, description, starts_at, location, max_players?, status, image_path?, signup_url?, format?, player_count?, results_image_path?, results_notes?, created_by | `player_count` é preenchido no resultado (pode haver quem jogou sem conta). |
| `event_participants` | event_id, user_id, status, created_at | "Vou jogar" = `going`; ao registrar resultado o admin confirma quem `played`. |
| `event_results` | id, event_id, placement (1..), user_id?, guest_name?, legend_id → cards?, deck_id?, record ("4-1"), notes | `user_id` **ou** `guest_name` (jogador sem conta). Único por (evento, jogador). |
| `decks` | id, community_id, author_id, name, legend_id → cards, description, visibility, event_id?, record?, placement?, created_at | Fase 2 na UI completa; MVP já mostra e cria. |
| `deck_cards` | deck_id, card_id?, card_name, quantity, section (`main`, `runes`, `battlefields`, `side`) | `card_name` garante a lista mesmo sem a carta no catálogo; `card_id` liga quando existir. |
| `market_listings` | id, community_id, seller_id, kind, card_id?, card_name, set_name?, variant?, condition, quantity, price_cents?, accepts_trade, description?, image_path?, status, is_hidden, created_at | Sem pagamento. `card_id` opcional, `card_name` obrigatório. |
| `achievements` | id, code (único), name, description, icon, tier | Catálogo de badges. |
| `user_achievements` | user_id, achievement_id, community_id, awarded_at, event_id? | Fase 2 concede automaticamente. |
| `ranking_rules` | community_id (PK), points_by_placement int[], participation_points, updated_at | Pontuação configurável: ex. `{100,70,50,50}` + 10 por presença. |
| `ranking_entries` | id, community_id, user_id, points (±), reason, event_id?, created_by, created_at | Ajustes manuais do admin, como um extrato. |

### Views (calculadas, nunca digitadas à mão)

- `player_stats`: por (comunidade, jogador) → torneios disputados, títulos, 2º lugares, top 4, último título.
- `ranking`: pontos de resultado (regra atual × colocação) + presença + ajustes manuais → posição.
- `hall_of_fame`: `player_stats` com pelo menos um top 4, ordenado por títulos.
- `legend_usage` (preparada para o Meta local da fase 3): contagem de lendas por comunidade a partir de `event_results` e `decks`.

Todas com `security_invoker = true`, então respeitam a RLS de quem consulta.

### Storage

Bucket `media` (público para leitura, 5 MB, `image/jpeg|png|webp`). Cada usuário só grava em `media/{seu-user-id}/...`. O cliente comprime para no máximo 1600 px em JPEG 82% antes de enviar. URLs públicas são montadas a partir do caminho; se a imagem faltar, o componente `Photo` mostra um fallback com a cor do tema.

---

## 4. Relacionamentos principais

```
communities 1─N community_members N─1 profiles 1─1 auth.users
communities 1─N events 1─N event_participants N─1 profiles
                 events 1─N event_results N─1 profiles (ou guest_name)
                                event_results N─1 cards (lenda) · N─1 decks
communities 1─N posts 1─N post_images · post_likes · post_comments
                 posts N─1 events (post de campeão) · decks · market_listings
communities 1─N decks 1─N deck_cards N─1 cards
communities 1─N market_listings N─1 cards (opcional) · N─1 profiles
communities 1─1 ranking_rules ; communities 1─N ranking_entries N─1 profiles
achievements 1─N user_achievements N─1 profiles
```

- **Resultado é a fonte da verdade da competição.** Perfil, Hall, histórico do evento e ranking leem `event_results` + `event_participants`. Nada é copiado.
- **Carta é opcional mas prevista.** Anúncio e deck guardam o nome (texto) e, quando possível, `card_id`. Quando a API de cartas chegar, um script liga os nomes aos ids.
- **Comunidade em tudo.** Mesmo com uma só, toda consulta filtra por `community_id`, que o servidor resolve a partir de `NEXT_PUBLIC_COMMUNITY_SLUG`.

---

## 5. MVP 0.1 vs. preparado para o futuro

| Entra no MVP 0.1 | Preparado (tabela/campo existe), UI depois | Fica para depois |
|---|---|---|
| Cadastro, login, logout, recuperar senha | Papel `moderator` | Chat, mensagens privadas |
| Perfil com estatísticas automáticas | Curtidas e comentários (`post_likes`, `post_comments`) | Pagamento, checkout, frete |
| Mural (post comum, pull, campeão, deck) com fotos | Conquistas (`achievements`) | Notificações push |
| Arena: próximos, anteriores, "Vou jogar" | Meta local (`legend_usage`) | IA, recomendação de decks |
| Resultados (top 4 + quem jogou) | Temporadas (filtro por data no ranking) | Multi-TCG na interface |
| Hall da Fama | Integração com API de cartas (`cards.external_id`) | Multi-loja na interface |
| Ranking básico configurável + ajuste manual | TV Mode `/tv` (dados prontos) | |
| Mercado (VENDE/TROCA/PROCURA, status, "Tenho interesse") | Destaque de posts no mural (campo `is_featured` já usado) | |
| Decks: ver, criar por lista colada, copiar lista, compartilhar | Estatísticas de deck | |
| Painel admin: eventos, resultados, moderação, usuários, ranking | | |
| Upload com compressão e limite | | |
| Mobile-first + layout de desktop + PWA instalável | | |

Decks aparecem no MVP numa versão simples porque o "+" e o seed já pedem; curtidas/comentários ficam para a fase 2 para não atrasar o essencial.

---

## 6. Design system inicial

**Conceito:** "noite no Rift". Azul-noite de Runeterra no fundo, laranja do logo de Riftbound para ação, teal hextech para o que está vivo e ouro hextech reservado a prestígio (campeões, Hall, 1º lugar). Molduras com filete dourado e cantos chanfrados lembram o cliente do League of Legends. As seções principais (Home, Arena, Mercado, login) abrem com arte oficial de Riftbound, e o logo oficial aparece na barra lateral, no fim da Home (celular) e no login, sempre com o crédito à Riot: é um site de fãs, sem afiliação. URLs das artes e o texto do crédito ficam em `src/lib/art.ts`.

### Cores (tokens em `globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#050B14` | Fundo do app |
| `--color-surface` | `#0B1626` | Cartões |
| `--color-surface-2` | `#112038` | Cartão sobre cartão, inputs |
| `--color-line` | `#22344F` | Bordas e divisórias |
| `--color-ink` | `#F0E6D2` | Texto principal (creme do LoL) |
| `--color-muted` | `#A3ADBF` | Texto secundário (contraste ≥ 4.5:1 no fundo) |
| `--color-rift` / `--color-on-rift` | `#F28A1F` / `#1F1000` | Ação principal, botão "+", links; texto sobre ela |
| `--color-energy` | `#0AC8B9` | Destaques vivos, "ao vivo", sucesso |
| `--color-gold` / `--color-gold-strong` / `--color-gold-line` | `#D9B76C` / `#F0D9A0` / `#785A28` | Campeão, 1º lugar, Hall, títulos de seção, molduras |
| `--color-silver` / `--color-bronze` | `#C9CEE6` / `#D58A54` | 2º e 3º lugares |
| `--color-sell` / `--color-trade` / `--color-want` | `#FF6B7F` / `#0AC8B9` / `#D9B76C` | Etiquetas VENDE / TROCA / PROCURA |
| `--color-danger` | `#FF5470` | Erros e exclusões |

### Tipografia

- **Display:** Barlow Condensed 600/700/800, em caixa alta nos títulos (condensada como o logotipo de Riftbound).
- **Texto:** Barlow 400/500/600/700.
- Escala: 12 · 14 · 16 (base) · 18 · 22 · 34 · 40–60 (hero).

### Forma e movimento

- Cantos: 8 (inputs e botões), 10 (cartões), 28 (bottom sheet), chanfrados com moldura dourada (`.frame-hex`) nos destaques, pílula nos chips.
- Áreas clicáveis ≥ 44 px. Foco visível com anel `--color-rift`.
- Microinterações: botão afunda em 0.97 ao tocar; cartões sobem 2 px no hover (desktop); sheets entram de baixo em 200 ms. Tudo desligado com `prefers-reduced-motion`.
- Skeletons com brilho suave em todo `loading.tsx`.

### Componentes base

`Button` (primary, secondary, ghost, danger; tamanhos sm/md), `Card`, `Avatar` (com iniciais de fallback), `Photo` (com fallback e `alt` obrigatório), `Badge` / `KindTag`, `PlacementBadge` (1º ouro, 2º prata, 3º/4º bronze), `EmptyState` (ícone, frase leve, ação), `Skeleton`, `Sheet` (bottom sheet no celular, modal no desktop), `Toast`, `Field` / `Input` / `Textarea` / `Select` com label e erro, `SegmentedTabs`, `PageHeader`, `SubmitButton` (com estado "Salvando…").

### Layout

- **Celular (360–430 px):** coluna única, barra inferior fixa com 5 itens; o "+" central é um losango elevado em `--color-rift`.
- **Tablet (768 px):** mesma barra, conteúdo em até 640 px, grades de 2 colunas no mercado.
- **Desktop (≥1024 px):** barra lateral à esquerda com logo e navegação, conteúdo central, e na Home uma coluna lateral fixa com próximo evento e ranking. Mercado em 3 colunas.

---

## 7. Telas do MVP

| Rota | Tela | Conteúdo |
|---|---|---|
| `/entrar` | Entrar na Riftzada | Logo, frase "Onde a galera do Rift se encontra", e-mail, senha, links para cadastro e "esqueci a senha". |
| `/cadastro` | Criar conta | Jogador ou Loja, apelido, e-mail, senha. Entra direto (ou aviso de confirmação, se ela estiver ligada). |
| `/esqueci-senha`, `/redefinir-senha` | Recuperar acesso | Um campo por vez. |
| `/` | Home / Mural | "Olá, Kauê." · Campeão da semana (foto grande, lenda, evento) · Próximo evento com "Vou jogar" · Feed "Na Riftzada" (posts, pulls, decks, anúncios, campeões) · Top 3 do ranking. No desktop, evento e ranking numa coluna lateral. |
| `+` (sheet) | Publicar | Publicar no mural · Anunciar carta · Publicar deck · Registrar resultado (só admin). |
| `/publicar` | Novo post | Tipo (Resenha ou Pull), texto, até 4 fotos. |
| `/arena` | Na Arena | Abas: Próximos · Resultados · Ranking · Hall. Próximos lista eventos com vagas e "Vou jogar". |
| `/arena/eventos/[id]` | Evento | Capa, data, horário, local, vagas, quem vai, link de inscrição; depois do torneio, pódio com lendas, decks e record. |
| `/arena/resultados` | Quem levou essa? | Eventos finalizados com campeão e top 4. |
| `/arena/ranking` | Ranking | Lista com posição, foto, pontos, títulos; destaque para o usuário logado. Explica a regra de pontos. |
| `/arena/hall` | Hall da Riftzada | Cartões grandes com foto: títulos, top 4, torneios, último título. |
| `/mercado` | Mercado | Filtros VENDE / TROCA / PROCURA, busca por nome, cards com foto, preço e status. |
| `/mercado/[id]` | Anúncio | Foto, carta, set, variante, condição, quantidade, preço, aceita troca, vendedor, "Tenho interesse" (WhatsApp se o vendedor liberou, senão perfil). Dono: editar, mudar status, apagar. |
| `/mercado/novo`, `/mercado/[id]/editar` | Anunciar carta | Tipo, carta, set, condição, quantidade, preço, troca, foto, descrição. |
| `/decks/[id]`, `/decks/novo` | Deck | Lenda, autor, resultado, lista por seção, copiar lista, compartilhar. Novo deck por lista colada. |
| `/jogador/[username]` | Perfil | Foto, nome, @, bio, deck favorito, Instagram · torneios, títulos, 2º, top 4 · histórico de resultados · decks · anúncios ativos · posts recentes. |
| `/perfil/editar` | Editar perfil | Foto, nome, bio, lenda favorita, Instagram, WhatsApp e se quer mostrá-lo. |
| `/arena/lojas` | Lojas | Cada loja com endereço, Instagram e agenda (semanal numa linha só: "Toda quarta · 19:30"). |
| `/loja`, `/loja/[id]/eventos/novo` | Minha loja | Pedido de cadastro da loja (fica "Aguardando aprovação" até o admin aprovar em `/admin/lojas`) e os eventos dela. "Repetir toda semana" cria uma data por semana (4, 8 ou 12) com o mesmo `series_id`; "Mais semanas" estende. Resultado continua só com o admin. |
| `/admin` | Painel | Atalhos: novo evento, registrar resultado, moderação, usuários, ranking. |
| `/admin/eventos`, `/admin/eventos/novo`, `/admin/eventos/[id]` | Eventos | Criar, editar, excluir, mudar status. |
| `/admin/eventos/[id]/resultado` | Registrar resultado | Quem jogou (checklist dos "Vou jogar"), nº de jogadores, top 4 (jogador ou convidado, lenda, record), foto, observações, "publicar campeão no mural". |
| `/admin/lojas` | Pedidos de loja | Lojas pendentes: aprovar (libera os eventos) ou recusar (apaga o pedido). |
| `/admin/moderacao` | Moderação | Posts e anúncios recentes: ocultar, mostrar, destacar. |
| `/admin/usuarios` | Usuários | Lista de membros, mudar papel, banir. |
| `/admin/ranking` | Ranking | Pontos por colocação e presença; ajustes manuais com motivo. |

Toda tela tem `loading.tsx` com skeleton, estado vazio com texto leve e erros com mensagem clara.

---

## 8. Backlog por etapas

**Etapa 0 — Setup** ✔ Next.js 16, TS, Tailwind 4, ESLint, Vitest, estrutura de pastas, `.env.example`, modo demonstração.

**Etapa 1 — Banco** Migrations, enums, RLS, views, storage, seed.

**Etapa 2 — Auth** Cadastro, login, logout, recuperação, `proxy.ts`, trigger de perfil.

**Etapa 3 — Layout** AppShell, BottomNav, SideNav, PublishSheet, tokens, componentes base, PWA.

**Etapa 4 — Perfil** Página pública, estatísticas, edição, avatar.

**Etapa 5 — Mural** Feed, cartões por tipo, novo post com fotos, campeão da semana.

**Etapa 6 — Eventos** Lista, detalhe, "Vou jogar".

**Etapa 7 — Resultados** Formulário admin, pódio no evento, post automático do campeão.

**Etapa 8 — Hall da Fama** View + tela.

**Etapa 9 — Ranking** Regra configurável + ajustes + tela.

**Etapa 10 — Mercado** Lista, filtros, detalhe, criar/editar, status, "Tenho interesse".

**Etapa 11 — Admin** Layout separado, eventos, moderação, usuários, ranking.

**Etapa 12 — Decks (simples)** Ver, criar por lista colada, copiar, compartilhar.

**Etapa 13–15 — Refinamento, responsividade, testes** Revisar 360/390/430/768/1440, acessibilidade, testes de domínio e de RLS.

**Etapa 16 — Deploy** Criar projeto Supabase, aplicar migrations, configurar Auth (URLs de redirect, SMTP), variáveis na Vercel, primeiro admin.

**Lojas (out/2026)** Lojas cadastram eventos avulsos e semanais. A aba de decks saiu da navegação (`/decks` redireciona para a Home); tabelas e telas continuam no código para voltar quando fizer sentido.

**Conta de loja (out/2026)** O cadastro da loja vira um pedido que o admin aprova em `/admin/lojas` (migration 0011). Só loja aprovada cria eventos; as lojas que já existiam foram aprovadas na migration. Na 0012 o cadastro ganhou o tipo de conta (Jogador ou Loja): só conta de loja pede loja e cria eventos (avulsos e semanais); jogador não vê "Cadastrar evento da loja".

**Fase 2** Curtidas, comentários, conquistas automáticas, TV Mode, deck completo com catálogo, histórico avançado, mercado melhorado.

**Fase 3** Meta local, winrate, temporadas, estatísticas de cartas, badges especiais.

---

## 9. Riscos técnicos e decisões a evitar

| Risco | Mitigação |
|---|---|
| **Permissão só no front.** Esconder botão não protege nada. | RLS em todas as tabelas + checagem de papel no servidor. Papel nunca vem do cliente. |
| **Dados duplicados** (títulos digitados no perfil, ranking em planilha). | Views calculam tudo a partir dos resultados. Ajuste manual é um lançamento, não uma edição de total. |
| **Jogadores sem conta** no torneio. | `event_results.guest_name`. Quando a pessoa criar conta, o admin pode ligar o resultado ao perfil. |
| **Exposição de contato.** | WhatsApp em tabela própria, opcional, visível só com consentimento. E-mail nunca sai do `auth.users`. |
| **Fotos pesadas** no 4G e na cota do Storage. | Compressão no cliente, limite de 5 MB no bucket, só imagens, otimização do `next/image` com poucas larguras. |
| **Free tier do Supabase pausa** após 7 dias sem uso. | Tráfego da comunidade normalmente evita; se não, um cron leve na Vercel. |
| **Catálogo de cartas sem fonte oficial estável.** | Cadastro manual primeiro; `external_id` + `source` para a integração futura sem migração dolorosa. |
| **Overengineering para multi-TCG/multi-loja.** | Só `community_id` e `game` nas tabelas. Nenhuma tela genérica. |
| **Regra de ranking mudar no meio da temporada.** | Pontos calculados pela regra vigente; temporadas (fase 3) filtram por data. Ajustes manuais ficam registrados com motivo. |
| **Nome/identidade da loja.** | Nada de logo, cores ou textos institucionais da X1. O app diz "comunidade", nunca "oficial". |
| **Arquivos gigantes / abstração precoce.** | Um componente por arquivo, queries e actions por domínio, sem camada de repositório genérica. |

Decisões que **não** vamos tomar agora: ORM, estado global no cliente, GraphQL, microserviços, Redux, realtime, notificações push, pagamento.
