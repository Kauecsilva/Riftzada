# Riftzada

> A comunidade local de Riftbound. Torneios, decks, trocas e resenha.

App web mobile-first (PWA) para a galera que joga Riftbound junto: mural, torneios, resultados, ranking, Hall da Fama, mercado de cartas e decks. Projeto da comunidade, **não é um app oficial de nenhuma loja**.

O planejamento completo (arquitetura, banco, telas, backlog e riscos) está em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + RLS, Auth, Storage) · Zod · Vercel.

## Rodar local

```bash
npm install
npm run dev
```

Sem variáveis de ambiente o app abre em **modo demonstração**: dados fictícios (os mesmos do seed), logado como admin, nada é salvo. Bom para mexer no visual.

## Ligar o Supabase

1. Crie um projeto no Supabase (região `sa-east-1`).
2. No SQL Editor, rode em ordem os arquivos de `supabase/migrations/` (ou `supabase db push` com a CLI).
3. Opcional, só em desenvolvimento: rode `supabase/seed.sql` (usuários fictícios, senha `riftzada123`).
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Em **Authentication → URL Configuration**: Site URL = URL do site; Redirect URLs = `https://SEU-SITE/auth/confirm` (e `http://localhost:3000/auth/confirm`).
6. Crie sua conta pelo app e vire admin:

```sql
update community_members set role = 'admin'
where user_id = (select id from profiles where username = 'seu_apelido');
```

## Catálogo de cartas

As cartas vêm do [Riftcodex](https://riftcodex.com), uma API pública e gratuita com todas as cartas de Riftbound (a mesma base do piltoverarchive.com). A migration `0006_card_catalog.sql` cria a importação dentro do próprio banco:

- No Supabase, o `pg_cron` roda `public.sync_cards_from_riftcodex()` toda segunda às 06:00 (Brasília). Para importar na hora, rode `select public.sync_cards_from_riftcodex();` no SQL Editor.
- As imagens são servidas pelo CDN da Riot (`cmsassets.rgpub.io`), liberado no `next.config.ts`.
- Anúncios e coleção apontam para `cards`. No anúncio, a carta fora do catálogo ainda pode ser digitada à mão.
- Em `/colecao/importar` dá para subir a coleção por CSV: exportação da LigaRiftbound ou qualquer CSV com nome e quantidade. O casamento com o catálogo é por sigla da edição + número (regras em `src/lib/domain/collection-import.ts`).

## Deploy (Vercel)

Importe o repositório, configure as mesmas variáveis do `.env.example` (com `NEXT_PUBLIC_SITE_URL` = domínio de produção) e publique. Região sugerida: `gru1`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (precisa passar antes de qualquer PR) |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript |
| `npm test` | Testes de domínio (ranking, decklist, validações) |
| `npm run test:sql` | Aplica migrations + seed num Postgres local e testa RLS e views |
| `npm run seed:sql` | Regera `supabase/seed.sql` a partir de `src/lib/demo/fixtures.ts` |

## Organização

```
supabase/migrations   banco: tabelas, RLS, views (ranking, hall), storage
src/app/(auth)        entrar, cadastro, recuperar senha
src/app/(app)         app logado: Home/Mural, Arena, Mercado, Coleção, Decks, Perfil
src/app/admin         painel administrativo (só admin)
src/server/queries    leituras por domínio
src/server/actions    Server Actions (validação Zod + sessão + RLS)
src/lib/domain        regras puras: pontuação, estatísticas, decklist, conquistas
src/lib/demo          dados fictícios (modo demonstração e seed)
src/components        ui/ (design system) + um diretório por módulo
```

## Regras da casa

- Toda permissão mora no banco (RLS). O papel (`admin`) vem de `community_members`, nunca do cliente.
- Estatísticas (títulos, top 4, pontos) são views calculadas a partir dos resultados. Nada é digitado duas vezes.
- Mudança de banco = nova migration numerada + teste em `tests/sql/assertions.sql`.
- Simples antes de sofisticado: um componente por arquivo, sem camadas genéricas.
