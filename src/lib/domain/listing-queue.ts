import type { PriceBase } from "@/types/domain";

/** Preço escolhido uma vez para a fila inteira: base e desconto (ex.: Liga −15%). */
export type QueuePrice = { base: PriceBase; discountPct: number };

/**
 * Formulário de anúncio do primeiro item da fila de cadastro rápido; o resto segue em `fila` (vazia na última
 * carta). Com `price`, todas as cartas da fila abrem com essa base e esse desconto.
 */
export function listingQueueHref(collectionItemIds: string[], price?: QueuePrice | null): string {
  const [first, ...rest] = collectionItemIds;
  if (!first) return "/colecao";
  const preset = price ? `&base=${price.base}&desconto=${price.discountPct}` : "";
  return `/mercado/novo?colecao=${first}&fila=${rest.join(",")}${preset}`;
}
