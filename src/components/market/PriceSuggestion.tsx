"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CONDITION } from "@/lib/domain/labels";
import {
  applyDiscount, centsToInput, cheapestBase, DISCOUNT_STEPS, discountLabel, LIGA_LANGUAGE, ligaCardUrl, parseBrl, pickTcgPrice,
  PRICE_BASE, tcgBrlCents,
} from "@/lib/domain/pricing";
import { formatPrice, shortDate } from "@/lib/format";
import type { CardCondition, LigaLanguage, Listing, PriceBase, PriceReference } from "@/types/domain";

export type AppliedPrice = { base: PriceBase; baseCents: number; discountPct: number; cents: number };

const usd = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "USD" });

/**
 * Preço sugerido no anúncio de venda: menor valor entre a LigaRiftbound (o vendedor informa, porque a Liga
 * não deixa consultar automático) e o TCGplayer (atualizado todo dia, convertido pelo dólar do dia),
 * com desconto opcional. "Usar esse preço" preenche o campo de preço.
 */
export function PriceSuggestion({
  cardId, cardName, variant, listing, onApply,
}: {
  cardId: string | null; cardName: string; variant: string; listing?: Listing; onApply: (applied: AppliedPrice) => void;
}) {
  const [reference, setReference] = useState<PriceReference | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [ligaText, setLigaText] = useState(centsToInput(listing?.liga?.priceCents));
  const [ligaLanguage, setLigaLanguage] = useState<LigaLanguage | "">(listing?.liga?.language ?? "en");
  const [ligaCondition, setLigaCondition] = useState<CardCondition | "">(listing?.liga?.condition ?? "nm");
  const [chosenBase, setChosenBase] = useState<PriceBase | null>(listing?.priceBase ?? null);
  const [pct, setPct] = useState(listing?.discountPct ?? 0);

  useEffect(() => {
    if (!cardId) return;
    const controller = new AbortController();
    fetch(`/api/precos?carta=${cardId}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<PriceReference>) : null))
      .then((body) => {
        setReference(body);
        setLoadedFor(cardId);
      })
      .catch(() => {
        // Requisição cancelada (trocou de carta)
      });
    return () => controller.abort();
  }, [cardId]);

  const loading = Boolean(cardId) && loadedFor !== cardId;
  const ref = cardId && loadedFor === cardId ? reference : null;
  const tcg = ref ? pickTcgPrice(ref.tcgplayer, variant) : null;
  const tcgCents = tcgBrlCents(tcg, ref?.usdBrl ?? null);
  const ligaParsed = parseBrl(ligaText);
  const ligaCents = ligaParsed != null && !Number.isNaN(ligaParsed) && ligaParsed > 0 ? ligaParsed : null;
  const bases: Record<PriceBase, number | null> = { liga: ligaCents, tcgplayer: tcgCents };
  const cheapest = cheapestBase(bases);
  const base = chosenBase && bases[chosenBase] != null ? chosenBase : cheapest;
  const baseCents = base ? bases[base] : null;
  const suggested = baseCents != null ? applyDiscount(baseCents, pct) : null;

  return (
    <section className="card space-y-4 p-4" aria-labelledby="price-suggestion-title">
      <h2 id="price-suggestion-title" className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} className="text-rift-strong" aria-hidden /> Preço sugerido
      </h2>

      {/* TCGplayer */}
      <div className="space-y-1 rounded-2xl border border-line bg-surface-2 p-3 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">TCGplayer</span>
          {tcg?.productUrl && (
            <a href={tcg.productUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
              ver <ExternalLink size={12} aria-hidden />
            </a>
          )}
        </div>
        {!cardId ? (
          <p className="text-muted">Escolhe a carta da lista para ver o preço do TCGplayer.</p>
        ) : loading ? (
          <p className="flex items-center gap-2 text-muted"><Loader2 size={14} className="animate-spin" aria-hidden /> Buscando preço…</p>
        ) : tcg && tcgCents != null ? (
          <>
            <p>
              <span className="font-display text-lg font-bold">{formatPrice(tcgCents)}</span>{" "}
              <span className="text-muted">
                ({usd(tcg.lowCents ?? tcg.marketCents!)} {tcg.lowCents != null ? "menor anúncio" : "preço de mercado"}, {tcg.finish === "foil" ? "Foil" : "Normal"})
              </span>
            </p>
            <p className="text-xs text-faint">
              Carta em inglês (americana), qualquer condição.
              {tcg.marketCents != null && tcg.lowCents != null && <> Preço de mercado {usd(tcg.marketCents)}.</>}
              {" "}Dólar a {ref!.usdBrl!.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · atualizado {shortDate(tcg.updatedAt)}.
            </p>
          </>
        ) : (
          <p className="text-muted">Ainda sem preço do TCGplayer para essa carta.</p>
        )}
      </div>

      {/* Liga */}
      <div className="space-y-2 rounded-2xl border border-line bg-surface-2 p-3 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">LigaRiftbound</span>
          {cardName.trim().length >= 2 && (
            <a href={ligaCardUrl(cardName)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
              abrir na Liga <ExternalLink size={12} aria-hidden />
            </a>
          )}
        </div>
        <p className="text-xs text-faint">A Liga não deixa consultar automático: abre a carta lá e copia o menor preço, dizendo se é americana ou chinesa e se está NM.</p>
        <div className="grid grid-cols-[1fr_1fr] gap-2 sm:grid-cols-[1fr_1.3fr_1fr]">
          <label className="col-span-2 space-y-1 sm:col-span-1">
            <span className="text-xs text-muted">Menor preço</span>
            <input name="ligaPrice" inputMode="decimal" value={ligaText} onChange={(e) => setLigaText(e.target.value)} className="input" placeholder="336,66"
              aria-invalid={Number.isNaN(ligaParsed) || undefined} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">Idioma</span>
            <select name="ligaLanguage" value={ligaLanguage} onChange={(e) => setLigaLanguage(e.target.value as LigaLanguage)} className="input">
              {(Object.keys(LIGA_LANGUAGE) as LigaLanguage[]).map((l) => <option key={l} value={l}>{LIGA_LANGUAGE[l]}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">Condição</span>
            <select name="ligaCondition" value={ligaCondition} onChange={(e) => setLigaCondition(e.target.value as CardCondition)} className="input">
              {(Object.keys(CONDITION) as CardCondition[]).map((c) => <option key={c} value={c}>{CONDITION[c].short}</option>)}
            </select>
          </label>
        </div>
        {ligaCents != null && ligaCondition && ligaCondition !== "nm" && (
          <p className="text-xs text-gold">Esse menor preço não é de carta NM. Vale conferir se tem NM mais cara.</p>
        )}
      </div>

      {/* Base + desconto */}
      {cheapest ? (
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-muted">Usar como base</legend>
            <div className="grid grid-cols-2 gap-1.5 rounded-full border border-line bg-surface-2 p-1">
              {(Object.keys(PRICE_BASE) as PriceBase[]).map((b) => (
                <button key={b} type="button" disabled={bases[b] == null} aria-pressed={base === b} onClick={() => setChosenBase(b)}
                  className={cn("min-h-10 rounded-full text-sm font-semibold transition-colors disabled:opacity-40", base === b ? "bg-rift text-white" : "text-muted hover:text-ink")}>
                  {PRICE_BASE[b]}{cheapest === b && bases.liga != null && bases.tcgplayer != null ? " · menor" : ""}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-muted">Desconto</legend>
            <div className="flex flex-wrap items-center gap-1.5">
              {DISCOUNT_STEPS.map((step) => (
                <button key={step} type="button" aria-pressed={pct === step} onClick={() => setPct(step)}
                  className={cn("min-h-9 rounded-full border px-3 text-sm font-semibold transition-colors", pct === step ? "border-rift bg-rift-soft text-ink" : "border-line text-muted hover:text-ink")}>
                  {step ? `${step}%` : "Sem"}
                </button>
              ))}
              <label className="flex items-center gap-1 text-sm text-muted">
                <input type="number" inputMode="numeric" min={0} max={90} value={pct} aria-label="Desconto em %"
                  onChange={(e) => setPct(Math.min(90, Math.max(0, Math.round(Number(e.target.value) || 0))))} className="input h-9 w-16 px-2 text-center" />
                %
              </label>
            </div>
          </fieldset>
          {base && baseCents != null && suggested != null && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rift-soft p-3">
              <p className="text-sm">
                <span className="font-display text-xl font-bold">{formatPrice(suggested)}</span>
                <span className="block text-xs text-muted">{discountLabel(base, pct)} ({formatPrice(baseCents)})</span>
              </p>
              <button type="button" className={buttonClass("primary", "sm")} onClick={() => onApply({ base, baseCents, discountPct: pct, cents: suggested })}>
                Usar esse preço
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-faint">Com o preço da Liga ou do TCGplayer, a gente sugere um valor e calcula o desconto.</p>
      )}
    </section>
  );
}
