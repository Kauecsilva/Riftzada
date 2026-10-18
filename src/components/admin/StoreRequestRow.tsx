"use client";

import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { approveStore, rejectStore } from "@/server/actions/admin";
import type { ActionState } from "@/lib/validation/common";
import type { Store } from "@/types/domain";

export function StoreRequestRow({ store }: { store: Store }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const run = (action: (id: string) => Promise<ActionState>) =>
    start(async () => {
      const r = await action(store.id);
      if (r.message) toast(r.message, r.ok ? "ok" : "error");
    });

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3" aria-busy={pending}>
      <div className="min-w-48 flex-1">
        <p className="truncate font-semibold">{store.name}</p>
        <p className="truncate text-sm text-muted">
          por {store.owner.displayName} (@{store.owner.username})
          {store.instagram && <> · @{store.instagram}</>}
        </p>
        {store.address && <p className="flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} aria-hidden /> {store.address}</p>}
      </div>
      <button type="button" disabled={pending} onClick={() => run(approveStore)} className={buttonClass("primary", "sm")}>Aprovar</button>
      <button
        type="button"
        disabled={pending}
        onClick={() => window.confirm(`Recusar o pedido da ${store.name}? O cadastro é apagado.`) && run(rejectStore)}
        className="min-h-10 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-danger"
      >
        Recusar
      </button>
    </li>
  );
}
