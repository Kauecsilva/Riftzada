# Riftzada

> A comunidade local de Riftbound. Torneios, decks, trocas e resenha.

App web mobile-first (PWA) para a galera que joga Riftbound junto: mural, torneios, resultados, ranking, Hall da Fama, mercado de cartas e decks. Projeto da comunidade, **não é um app oficial de nenhuma loja**.

O planejamento completo (arquitetura, banco, telas, backlog e riscos) está em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md). Instruções para agentes de IA em [`AGENTS.md`](AGENTS.md); checks em [`docs/quality.md`](docs/quality.md).

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

- Coleção recém-lançada costuma demorar para chegar no Riftcodex. Para não ficar sem ela, a migration `0010_riot_gallery.sql` importa também da [galeria oficial da Riot](https://riftbound.leagueoflegends.com/en-us/card-gallery/) as coleções que o Riftcodex ainda não tem (foi assim que a Radiance entrou). Quando o Riftcodex passa a ter a coleção, ele assume essas cartas sem mudar o id, então coleção e anúncios continuam valendo.
- No Supabase, o `pg_cron` roda as duas importações todo dia: `public.sync_cards_from_riftcodex()` às 06:00 e `public.sync_cards_from_riot_gallery()` às 06:30 (Brasília). Para importar na hora, rode as duas no SQL Editor.
- As imagens são servidas pelo CDN da Riot (`cmsassets.rgpub.io`), liberado no `next.config.ts`.
- Anúncios e coleção apontam para `cards`. No anúncio, a carta fora do catálogo ainda pode ser digitada à mão.
- Em `/colecao/importar` dá para subir a coleção por CSV: exportação da LigaRiftbound ou qualquer CSV com nome e quantidade. O casamento com o catálogo é por sigla da edição + número (regras em `src/lib/domain/collection-import.ts`).
- Em `/colecao`, "Selecionar várias" abre a seleção múltipla (com "Selecionar tudo", que respeita a busca). As cartas marcadas podem ser removidas depois de uma confirmação (anúncios ligados a elas continuam no Mercado) ou postas à venda: "Vender" monta uma fila de cadastro rápido (`/mercado/novo?colecao=<id>&fila=<ids>`) que abre o formulário de anúncio uma carta por vez, já com o preço da Liga; ao anunciar, abre a próxima. Cartas já anunciadas ficam fora da fila.
- O topo de `/colecao` mostra o valor da coleção: preço da Liga de cada carta (no acabamento da variante) vezes as cópias, com o TCGplayer em reais quando a Liga não tem preço. Cópias sem preço nenhum ficam de fora e aparecem contadas.

## Preço sugerido e ofertas

- A migration `0008_prices_offers.sql` importa todo dia (pg_cron, 19:30 de Brasília) os preços do TCGplayer pelo [tcgcsv.com](https://tcgcsv.com) e a cotação do dólar ([open.er-api.com](https://open.er-api.com)). Para rodar na hora: `select public.sync_card_prices();`.
- O menor preço da LigaRiftbound vem de uma coleta diária na nuvem (veja abaixo). O formulário já abre com o preço coletado, que o vendedor pode corrigir, usa a Liga como base padrão (o TCGplayer entra quando a Liga não tem preço ou o vendedor escolhe) e aplica o desconto escolhido.
- Ofertas: o comprador oferece abaixo do preço; o vendedor aceita, recusa ou faz contraproposta. As regras ficam nas funções `make_listing_offer` e `respond_listing_offer`.
- Troca: em anúncio de troca, ou venda que aceita troca, a oferta leva cartas e, se quiser, dinheiro junto (`0014_trade_offers_chat.sql`).
- Conversa: cada anúncio tem uma conversa por interessado (`listing_messages`), em `/mensagens`. A migration 0014 adiciona a tabela à publicação `supabase_realtime` para as mensagens chegarem na hora.

### Coleta da Liga

- Todo dia às 18:00 (Brasília) o cron da Vercel (`vercel.json`) chama `/api/cron/liga`. A rota lê a página de cada coleção na Liga (`?view=cards/search&card=ed=OGN`), que traz menor, médio e maior preço de todas as cartas, e grava em `liga_prices` (migrations `0013_liga_prices.sql` e `0016_liga_set_sync.sql`).
- A Liga bloqueia acesso vindo de servidor (Cloudflare), então a página passa pelo [Firecrawl](https://firecrawl.dev): um crédito por coleção, uns 10 por dia, dentro dos 1.000 grátis por mês.
- O resumo da coleção junta normal e foil e não diz idioma nem condição; o vendedor ajusta no formulário. Preço com mais de 7 dias não aparece.
- Variáveis na Vercel: `FIRECRAWL_API_KEY` (painel do Firecrawl), `LIGA_SYNC_TOKEN` (criado no banco, ver o topo de `0013_liga_prices.sql`) e `CRON_SECRET` (qualquer texto longo aleatório; a Vercel manda no cabeçalho do cron).
- Rodar na hora: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domínio>/api/cron/liga`. A resposta lista cada coleção com quantas cartas gravou ou o erro.

## Sugestões

- No "+" da barra, "Sugerir melhoria" abre `/sugestao`. Membro logado manda título, tipo (melhoria ou ideia) e detalhes, e o servidor cria uma issue em `GITHUB_REPO` (padrão `Kauecsilva/Riftzada`) com o título `[Melhoria] …` ou `[Ideia] …` e o nome de quem enviou. Menções com `@` são quebradas para não marcar ninguém.
- Variável na Vercel: `GITHUB_TOKEN`, um token *fine-grained* do GitHub só com acesso ao repositório e permissão **Issues: Read and write**. Sem ela o formulário avisa que as sugestões não estão ligadas.

## Deploy (Vercel)

Importe o repositório, configure as mesmas variáveis do `.env.example` (com `NEXT_PUBLIC_SITE_URL` = domínio de produção) e publique. Região sugerida: `gru1`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (precisa passar antes de qualquer PR) |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript |
| `npm run lint:rules` / `npm run lint:typed` | Autoteste das regras locais de lint e gate de async com tipos |
| `npm run check` | Lint, regras, tipos, testes e build de uma vez |
| `npm test` | Testes de domínio (ranking, decklist, validações) |
| `npm run test:sql` | Aplica migrations + seed num Postgres local e testa RLS e views |
| `npm run seed:sql` | Regera `supabase/seed.sql` a partir de `src/lib/demo/fixtures.ts` |

## Organização

```
supabase/migrations   banco: tabelas, RLS, views (ranking, hall), storage
src/app/(auth)        entrar, cadastro, recuperar senha
src/app/(app)         app logado: Home/Mural, Arena, Mercado, Coleção, Decks, Perfil (a vitrine do Mercado abre sem login)
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
