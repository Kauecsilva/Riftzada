import { requireSession } from "@/server/session";

// A casca do app abre para visitante (vitrine do mercado); a área da loja continua só para logados
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return children;
}
