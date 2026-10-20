/** Formulário de anúncio do primeiro item da fila de cadastro rápido; o resto segue em `fila` (vazia na última carta). */
export function listingQueueHref(collectionItemIds: string[]): string {
  const [first, ...rest] = collectionItemIds;
  if (!first) return "/colecao";
  return `/mercado/novo?colecao=${first}&fila=${rest.join(",")}`;
}
