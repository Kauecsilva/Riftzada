"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastContext = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex max-w-md animate-sheet-in items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-float backdrop-blur",
              t.tone === "ok" ? "border-energy/30 bg-surface/95 text-ink" : "border-danger/40 bg-surface/95 text-ink",
            )}
          >
            {t.tone === "ok" ? <CheckCircle2 size={18} className="shrink-0 text-energy" aria-hidden /> : <AlertCircle size={18} className="shrink-0 text-danger" aria-hidden />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Mostra um toast quando a página abre com ?param (ex.: depois de salvar e redirecionar). */
export function FlashToast({ text, tone = "ok" }: { text: string; tone?: Toast["tone"] }) {
  const toast = useToast();
  useEffect(() => {
    toast(text, tone);
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState(null, "", url);
  }, [toast, text, tone]);
  return null;
}
