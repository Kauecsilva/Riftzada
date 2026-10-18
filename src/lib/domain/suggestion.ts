// Sugestão do app → issue no GitHub. Função pura para dar para testar sem rede.

export type SuggestionKind = "improvement" | "idea";

const KIND_LABEL: Record<SuggestionKind, string> = { improvement: "Melhoria", idea: "Ideia" };

/** "@fulano" no texto não pode marcar ninguém no GitHub: um espaço invisível quebra a menção. */
const noMentions = (text: string) => text.replace(/@/g, "@​");

export function suggestionIssue(
  input: { kind: SuggestionKind; title: string; details: string | null },
  author: { username: string; displayName: string },
): { title: string; body: string } {
  const details = input.details ? noMentions(input.details) : "_Sem detalhes._";
  return {
    title: `[${KIND_LABEL[input.kind]}] ${noMentions(input.title)}`,
    body: `${details}\n\n---\nEnviada pelo app por ${noMentions(author.displayName)} (${noMentions(author.username)}).`,
  };
}
