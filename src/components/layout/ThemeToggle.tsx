"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "riftzada-theme";
const CHANGE_EVENT = "riftzada-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";
type Theme = "light" | "dark";

function currentTheme(): Theme {
  const selected = document.documentElement.dataset.theme;
  if (selected === "light" || selected === "dark") return selected;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    if (event.newValue === "light" || event.newValue === "dark") {
      document.documentElement.dataset.theme = event.newValue;
    } else {
      delete document.documentElement.dataset.theme;
    }
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onChange);
  };
}

function chooseTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* O controle continua válido nesta aba. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Switch compartilhado entre masthead e menu móvel. Sem preferência salva, segue o sistema. */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light");
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      role="switch"
      aria-label="Modo escuro"
      aria-checked={dark}
      title={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => chooseTheme(dark ? "light" : "dark")}
      className={variant === "icon"
        ? "inline-flex size-11 items-center justify-center rounded-lg text-[#d5c9da] transition-colors hover:bg-white/10 hover:text-white"
        : "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold hover:bg-surface-2"}
    >
      <Icon size={19} aria-hidden />
      {variant === "row" && (
        <>
          <span className="flex-1">Modo escuro</span>
          <span className={`relative h-6 w-11 rounded-full transition-colors ${dark ? "bg-rift" : "bg-surface-3"}`} aria-hidden>
            <span className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform ${dark ? "translate-x-5" : ""}`} />
          </span>
        </>
      )}
    </button>
  );
}
