/**
 * Artes e logo oficiais de Riftbound, servidas pelo CDN da Riot (o mesmo host liberado no
 * next.config para as cartas). Uso de fã-site: sempre com o crédito de RIOT_CREDIT por perto.
 * shortcut: URLs fixas do site oficial; se a Riot trocar alguma, a imagem some e o
 * componente cai no fundo escuro. Upgrade: guardar cópias no bucket "media".
 */
const CDN = "https://cmsassets.rgpub.io/sanity/images/dsfx7636";

export const RIFTBOUND_LOGO = {
  src: `${CDN}/news/23d41c7809a48a013f3d8a7204b81fb4d8bdb164-10000x4389.png?accountingTag=RB&fm=png&w=1200`,
  width: 1200,
  height: 527,
};

export const ART = {
  /** Ahri, Yasuo e Jinx (arte de lançamento, com o logo embaixo). */
  launch: `${CDN}/news_live/6cf5ae382207a6569b542e215d49d0e4266fc617-1200x630.png?accountingTag=RB&fm=jpg&w=1200`,
  /** Fiora no pódio, com pétalas: campeão e Arena. */
  podium: `${CDN}/news_live/ed61dca80c612ac0ae561f3a71a582f2842002cc-1920x1080.jpg?accountingTag=RB&w=1600`,
  /** Bazar de Shurima: mercado. */
  bazaar: `${CDN}/news_live/f398ed1a226a75696974cfffbd4632858c181d7a-1920x1080.jpg?accountingTag=RB&w=1600`,
  /** Seraphine no palco: eventos sem foto. */
  stage: `${CDN}/news_live/06f598de7c6f88948da3d5144d40c966f2609931-3166x1781.jpg?accountingTag=RB&w=1600`,
} as const;

export const RIOT_CREDIT =
  "Riftbound e League of Legends são marcas da Riot Games. Artes e logo oficiais usados por um site de fãs, sem afiliação com a Riot.";
