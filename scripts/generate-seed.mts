// Gera supabase/seed.sql a partir de src/lib/demo/fixtures.ts (a mesma fonte do modo demonstração).
// Uso: npm run seed:sql
import { writeFileSync } from "node:fs";
import {
  COMMUNITY_ID, DEMO_PASSWORD, demoCards, demoDecks, demoEvents, demoListings, demoOffers, demoParticipants, demoPosts,
  demoRankingEntries, demoRankingRules, demoResults, demoUsers, USERS, type RelDate,
} from "../src/lib/demo/fixtures.ts";

const q = (v: string | number | boolean | null | undefined): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${v.replace(/'/g, "''")}'`;
};
const at = (r: RelDate) =>
  `((((now() at time zone 'America/Sao_Paulo')::date + ${r.days}) + time '${r.at}') at time zone 'America/Sao_Paulo')`;
const rows = (table: string, cols: string[], values: string[][]) =>
  values.length ? `insert into ${table} (${cols.join(", ")}) values\n  ${values.map((v) => `(${v.join(", ")})`).join(",\n  ")};\n` : "";

let sql = `-- GERADO por scripts/generate-seed.mts — não edite à mão (npm run seed:sql)
-- Dados fictícios de desenvolvimento. Senha de todos os usuários: ${DEMO_PASSWORD}
-- Rode só em ambiente de desenvolvimento/homologação.

begin;

-- A comunidade padrão (${COMMUNITY_ID}) já vem da migration 0001_init.sql.

-- Usuários (o trigger handle_new_user cria perfil e associação)
`;

for (const user of demoUsers) {
  sql += `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', ${q(user.id)}, 'authenticated', 'authenticated', ${q(user.email)}, crypt(${q(DEMO_PASSWORD)}, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', ${q(JSON.stringify({ username: user.username, display_name: user.displayName }))}, ${at(user.joined)}, now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), ${q(user.id)}, ${q(user.id)}, ${q(JSON.stringify({ sub: user.id, email: user.email }))}, 'email', now(), now(), now());
`;
}

sql += "\n-- Lendas (catálogo manual)\n";
sql += rows("public.cards", ["id", "name", "set_name", "set_code", "card_type"],
  demoCards.map((c) => [q(c.id), q(c.name), q(c.setName), q(c.setCode), q(c.type)]));

sql += "\n-- Perfis, contatos e papéis\n";
for (const user of demoUsers) {
  sql += `update public.profiles set bio = ${q(user.bio)}, favorite_legend_id = ${q(user.favoriteLegendId)}, instagram = ${q(user.instagram)}, city = ${q(user.city)}, state = ${q(user.state)}, avatar_path = ${q(user.avatarPath)}, created_at = ${at(user.joined)} where id = ${q(user.id)};\n`;
  if (user.role !== "user") sql += `update public.community_members set role = ${q(user.role)} where user_id = ${q(user.id)};\n`;
  if (user.whatsapp) sql += `insert into public.profile_contacts (user_id, whatsapp, share_whatsapp) values (${q(user.id)}, ${q(user.whatsapp)}, ${q(user.shareWhatsapp)});\n`;
}

sql += "\n-- Eventos\n";
sql += rows("public.events",
  ["id", "community_id", "name", "description", "format", "starts_at", "location", "max_players", "status", "image_path", "signup_url", "player_count", "results_image_path", "results_notes", "created_by"],
  demoEvents.map((e) => [q(e.id), q(COMMUNITY_ID), q(e.name), q(e.description), q(e.format), at(e.startsAt), q(e.location), q(e.maxPlayers), q(e.status), q(e.imagePath), q(e.signupUrl), q(e.playerCount), q(e.resultsImagePath), q(e.resultsNotes), q(USERS.kaue)]));

sql += rows("public.event_participants", ["event_id", "user_id", "status"],
  demoParticipants.map((p) => [q(p.eventId), q(p.userId), q(p.status)]));

sql += "\n-- Decks\n";
sql += rows("public.decks",
  ["id", "community_id", "author_id", "name", "legend_id", "description", "visibility", "event_id", "record", "placement", "created_at"],
  demoDecks.map((d) => [q(d.id), q(COMMUNITY_ID), q(d.authorId), q(d.name), q(d.legendId), q(d.description), q(d.visibility), q(d.eventId), q(d.record), q(d.placement), at(d.createdAt)]));
sql += rows("public.deck_cards", ["deck_id", "card_name", "quantity", "section", "position"],
  demoDecks.flatMap((d) => d.cards.map((c, i) => [q(d.id), q(c.name), q(c.quantity), q(c.section), q(i)])));

sql += "\n-- Resultados\n";
sql += rows("public.event_results",
  ["id", "event_id", "placement", "user_id", "guest_name", "legend_id", "deck_id", "record", "notes"],
  demoResults.map((r) => [q(r.id), q(r.eventId), q(r.placement), q(r.userId), q(r.guestName), q(r.legendId), q(r.deckId), q(r.record), q(r.notes)]));

sql += "\n-- Mercado\n";
sql += rows("public.market_listings",
  ["id", "community_id", "seller_id", "kind", "card_name", "set_name", "variant", "condition", "quantity", "price_cents", "accepts_trade", "description", "image_path", "status", "created_at",
    "price_base", "price_base_cents", "discount_pct", "liga_price_cents", "liga_language", "liga_condition", "accepts_offers", "min_offer_cents"],
  demoListings.map((l) => [q(l.id), q(COMMUNITY_ID), q(l.sellerId), q(l.kind), q(l.cardName), q(l.setName), q(l.variant), q(l.condition), q(l.quantity), q(l.priceCents), q(l.acceptsTrade), q(l.description), q(l.imagePath), q(l.status), at(l.createdAt),
    q(l.pricing?.base), q(l.pricing?.baseCents), q(l.pricing?.discountPct), q(l.pricing?.liga?.priceCents), q(l.pricing?.liga?.language), q(l.pricing?.liga?.condition),
    q(l.minOfferCents !== undefined), q(l.minOfferCents)]));

sql += rows("public.listing_offers",
  ["id", "listing_id", "buyer_id", "amount_cents", "counter_cents", "message", "status", "created_at"],
  demoOffers.map((o) => [q(o.id), q(o.listingId), q(o.buyerId), q(o.amountCents), q(o.counterCents), q(o.message), q(o.status), at(o.createdAt)]));

sql += "\n-- Mural\n";
sql += rows("public.posts",
  ["id", "community_id", "author_id", "kind", "body", "event_id", "deck_id", "is_featured", "created_at"],
  demoPosts.map((p) => [q(p.id), q(COMMUNITY_ID), q(p.authorId), q(p.kind), q(p.body), q(p.eventId), q(p.deckId), q(p.isFeatured), at(p.createdAt)]));
sql += rows("public.post_images", ["post_id", "path", "position"],
  demoPosts.flatMap((p) => p.images.map((path, i) => [q(p.id), q(path), q(i)])));

sql += "\n-- Ranking\n";
sql += `update public.ranking_rules set points_by_placement = '{${demoRankingRules.pointsByPlacement.join(",")}}', participation_points = ${demoRankingRules.participationPoints} where community_id = ${q(COMMUNITY_ID)};\n`;
sql += rows("public.ranking_entries", ["id", "community_id", "user_id", "points", "reason", "created_by", "created_at"],
  demoRankingEntries.map((r) => [q(r.id), q(COMMUNITY_ID), q(r.userId), q(r.points), q(r.reason), q(USERS.kaue), at(r.createdAt)]));

sql += "\ncommit;\n";

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("supabase/seed.sql gerado.");
