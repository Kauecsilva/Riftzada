"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { cardLine } from "@/lib/cards";
import { cn } from "@/lib/cn";
import type { CardSummary } from "@/types/domain";
import { CardThumb } from "./CardThumb";

/**
 * Campo de carta com busca no catálogo (combobox).
 * Envia `cardId` (hidden) e `cardName`. Com `allowFreeText`, dá para digitar uma carta que
 * não está no catálogo (fica sem cardId); sem ele, só vale escolher da lista.
 */
export function CardPicker({
  initial, initialName, allowFreeText, error, onSelect,
}: {
  initial?: CardSummary | null; initialName?: string; allowFreeText?: boolean; error?: string;
  onSelect?: (card: CardSummary | null) => void;
}) {
  const [text, setText] = useState(initial?.name ?? initialName ?? "");
  const [selected, setSelected] = useState<CardSummary | null>(initial ?? null);
  const [results, setResults] = useState<CardSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const request = useRef<AbortController | null>(null);

  // Busca com um respiro de 250 ms entre as teclas
  useEffect(() => {
    const term = text.trim();
    if (term.length < 2 || selected?.name === text) return;
    const timer = setTimeout(async () => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/cartas?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const body = res.ok ? ((await res.json()) as { cards: CardSummary[] }) : { cards: [] };
        setResults(body.cards);
        setActive(-1);
        setOpen(true);
      } catch {
        // Requisição cancelada por outra mais nova
      } finally {
        if (request.current === controller) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [text, selected]);

  function choose(card: CardSummary) {
    setSelected(card);
    setText(card.name);
    setOpen(false);
    onSelect?.(card);
  }

  const describedBy = error ? "cardName-error" : "cardName-hint";

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          id="cardName"
          name="cardName"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (selected) {
              setSelected(null);
              onSelect?.(null);
            }
            if (e.target.value.trim().length < 2) setOpen(false);
          }}
          onFocus={() => results.length && !selected && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? results.length - 1 : i - 1)); }
            else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(results[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          required
          maxLength={120}
          className="input pr-11 pl-11"
          placeholder="Busca pelo nome: Jinx, Loose Cannon"
        />
        {loading && <Loader2 size={18} className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-faint" aria-hidden />}
        <input type="hidden" name="cardId" value={selected?.id ?? ""} />

        {open && (
          <ul id={listId} role="listbox" aria-label="Cartas encontradas" className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-line bg-surface p-1 shadow-xl">
            {results.length ? results.map((card, i) => (
              <li
                key={card.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(card)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl p-2", i === active ? "bg-surface-3" : "hover:bg-surface-2")}
              >
                <CardThumb card={card} width={40} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{card.name}</span>
                  <span className="block truncate text-xs text-muted">{cardLine(card)}</span>
                </span>
              </li>
            )) : (
              <li className="p-3 text-sm text-muted">
                {allowFreeText ? "Não achei no catálogo. Pode seguir com o nome digitado." : "Não achei essa carta no catálogo."}
              </li>
            )}
          </ul>
        )}
      </div>
      {!error && (
        <p id="cardName-hint" className="text-xs text-faint">
          {selected ? `Do catálogo: ${cardLine(selected)}` : allowFreeText ? "Escolhe da lista para puxar a imagem e a expansão." : "Escolhe uma carta da lista."}
        </p>
      )}
    </div>
  );
}
