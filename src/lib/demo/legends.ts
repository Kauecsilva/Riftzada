import type { CardSummary, SetLegends } from "@/types/domain";

/** Sem banco, o carrossel usa as cartas oficiais guardadas em /public/art/cards. */
export function demoSetLegends(): SetLegends[] {
  const card = (code: string, name: string): CardSummary => ({ id: code, name, setName: null, code, rarity: null, imageUrl: `/art/cards/${code}.webp` });
  return [
    { code: "OGN", name: "Origins", legends: [card("OGN-251", "Jinx, Loose Cannon")] },
    {
      code: "RAD", name: "Radiance", legends: [
        card("RAD-139", "Ekko, Boy Who Shattered Time"),
        card("RAD-145", "Orianna, Lady of Clockwork"),
        card("RAD-149", "Riven, The Exile"),
        card("RAD-151", "Seraphine, Starry-Eyed Songstress"),
      ],
    },
  ];
}
