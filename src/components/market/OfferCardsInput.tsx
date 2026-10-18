"use client";

import { useEffect, useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import type { CardSummary, OfferCard } from "@/types/domain";

const MAX_CARDS = 10;

/**
 * Cartas que entram na troca. A busca do catálogo aparece como sugestão (datalist);
 * carta fora do catálogo também vale, pelo nome. Envia tudo como JSON no campo `cards`.
 */
export function OfferCardsInput({ id, initial = [], error }: { id: string; initial?: OfferCard[]; error?: string }) {
  const [cards, setCards] = useState<OfferCard[]>(initial);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [results, setResults] = useState<CardSummary[]>([]);
  const listId = useId();

  useEffect(() => {
    const term = name.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cartas?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (res.ok) setResults(((await res.json()) as { cards: CardSummary[] }).cards);
      } catch {
        // Cancelada por uma busca mais nova
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name]);

  function add() {
    const clean = name.trim();
    if (!clean || cards.length >= MAX_CARDS) return;
    const match = results.find((c) => c.name.toLowerCase() === clean.toLowerCase());
    setCards([...cards, { name: match?.name ?? clean, qty, cardId: match?.id ?? null }]);
    setName("");
    setQty(1);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="cards" value={JSON.stringify(cards)} />
      {cards.length > 0 && (
        <ul className="space-y-1">
          {cards.map((card, i) => (
            <li key={`${card.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate"><strong>{card.qty}x</strong> {card.name}</span>
              <button type="button" onClick={() => setCards(cards.filter((_, j) => j !== i))} aria-label={`Tirar ${card.name}`} className="text-faint hover:text-ink">
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {cards.length < MAX_CARDS && (
        <div className="flex gap-2">
          <input
            id={id}
            list={listId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            maxLength={120}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            className="input min-w-0 flex-1"
            placeholder="Busca a carta: Ahri, Calm Rune"
          />
          <datalist id={listId}>
            {results.map((c) => <option key={c.id} value={c.name}>{c.setName ?? undefined}</option>)}
          </datalist>
          <label htmlFor={`${id}-qty`} className="sr-only">Quantidade</label>
          <input id={`${id}-qty`} type="number" inputMode="numeric" min={1} max={99} value={qty}
            onChange={(e) => setQty(Math.min(99, Math.max(1, Number(e.target.value) || 1)))} className="input w-16 shrink-0 text-center" />
          <button type="button" onClick={add} disabled={!name.trim()} className={buttonClass("secondary", "md", "shrink-0")} aria-label="Adicionar carta">
            <Plus size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
