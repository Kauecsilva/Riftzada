import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { discountLabel, driftPct, PRICE_DRIFT } from "@/lib/domain/pricing";
import { formatPrice } from "@/lib/format";
import { reviewListingPrices } from "@/server/actions/prices";
import { getPriceDrift } from "@/server/queries/market";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Revisar preços" };

export default async function PriceReviewPage() {
  const session = await requireSession();
  const items = await getPriceDrift(session.userId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Revisar preços"
        back="/notificacoes"
        subtitle={`Anúncios feitos pela Liga ou pelo TCGplayer cujo preço ficou ${PRICE_DRIFT.pct}% ou mais longe do que a mesma regra dá hoje.`}
        action={items.length > 1 && (
          <ActionButton action={reviewListingPrices.bind(null, "update", undefined)} variant="primary" size="md" className="w-full sm:w-auto"
            confirm={`Atualizar os ${items.length} anúncios pela regra de cada um?`}>
            <RefreshCw size={18} aria-hidden /> Atualizar todos
          </ActionButton>
        )}
      />
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((d) => {
            const pct = driftPct(d.priceCents, d.expectedCents);
            return (
              <li key={d.listingId} className="card p-3.5">
                <Link href={`/mercado/${d.listingId}`} className="font-semibold hover:text-rift-strong">
                  {d.cardName}{d.variant ? <span className="font-normal text-muted"> · {d.variant}</span> : null}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Anunciado por <strong className="text-ink">{formatPrice(d.priceCents)}</strong> ({discountLabel(d.base, d.discountPct).toLowerCase()},
                  base {formatPrice(d.baseCents)}). Hoje a base está em {formatPrice(d.baseNowCents)}, o que dá{" "}
                  <strong className="text-ink">{formatPrice(d.expectedCents)}</strong>{" "}
                  <span className={pct > 0 ? "text-rift-strong" : "text-danger"}>({pct > 0 ? "+" : "−"}{Math.abs(pct)}%)</span>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton action={reviewListingPrices.bind(null, "update", [d.listingId])} variant="primary">
                    <RefreshCw size={16} aria-hidden /> Atualizar para {formatPrice(d.expectedCents)}
                  </ActionButton>
                  <ActionButton action={reviewListingPrices.bind(null, "keep", [d.listingId])}>
                    Manter {formatPrice(d.priceCents)}
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={BadgeCheck} title="Preços em dia." text="Quando a Liga ou o TCGplayer mudarem muito, um aviso chega nas notificações." action={{ href: "/mercado", label: "Ir ao mercado" }} />
      )}
    </div>
  );
}
