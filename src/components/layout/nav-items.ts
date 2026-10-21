import { Home, Store, Swords, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/arena", label: "Arena", icon: Swords },
  { href: "/mercado", label: "Mercado", icon: Store },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

/** Número do contador de não lidos ("9+" a partir de 10). */
export function unreadLabel(unread: number): string | null {
  return unread > 0 ? (unread > 9 ? "9+" : String(unread)) : null;
}

export function isActive(path: string, href: string, exact?: boolean): boolean {
  if (exact) return path === href;
  if (href === "/perfil") return path.startsWith("/perfil") || path.startsWith("/jogador");
  if (href === "/mercado" && path.startsWith("/mensagens")) return true;
  return path === href || path.startsWith(`${href}/`);
}

/** Tela de entrar que volta para onde a pessoa estava. */
export function signInHref(path: string): string {
  return path === "/" ? "/entrar" : `/entrar?next=${encodeURIComponent(path)}`;
}
