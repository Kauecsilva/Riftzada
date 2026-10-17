import { Home, Store, Swords, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/arena", label: "Arena", icon: Swords },
  { href: "/mercado", label: "Mercado", icon: Store },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

export function isActive(path: string, href: string, exact?: boolean): boolean {
  if (exact) return path === href;
  if (href === "/perfil") return path.startsWith("/perfil") || path.startsWith("/jogador");
  return path === href || path.startsWith(`${href}/`);
}
