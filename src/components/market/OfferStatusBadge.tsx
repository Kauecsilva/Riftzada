import { Badge } from "@/components/ui/Badge";
import { OFFER_STATUS } from "@/lib/domain/pricing";
import type { OfferStatus } from "@/types/domain";

const TONE = { pending: "rift", countered: "gold", accepted: "energy", declined: "danger", withdrawn: "neutral" } as const;

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge tone={TONE[status]}>{OFFER_STATUS[status]}</Badge>;
}
