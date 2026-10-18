// Região do jogador (cidade + UF), mostrada no perfil e nos anúncios do Mercado
// para quem quer trocar ou vender saber de onde a pessoa é.

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
export type Uf = (typeof UFS)[number];

/** "Campinas/SP", só "SP" ou null quando a pessoa não informou. */
export function formatRegion(city: string | null | undefined, state: string | null | undefined): string | null {
  if (!state) return null;
  return city ? `${city}/${state}` : state;
}
