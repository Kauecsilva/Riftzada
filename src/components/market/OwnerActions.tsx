"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { LISTING_STATUS } from "@/lib/domain/labels";
import { deleteListing, setListingStatus } from "@/server/actions/content";
import type { ListingStatus } from "@/types/domain";

/** Controles do dono do anúncio: status, editar, apagar. */
export function OwnerActions({ id, status: initial }: { id: string; status: ListingStatus }) {
  const [status, setStatus] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <div className="card space-y-4 p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Status do anúncio</legend>
        <div className="grid grid-cols-3 gap-1.5 rounded-full border border-line bg-surface-2 p-1">
          {(Object.keys(LISTING_STATUS) as ListingStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              aria-pressed={status === s}
              onClick={() => {
                const previous = status;
                setStatus(s);
                start(async () => {
                  const result = await setListingStatus(id, s);
                  if (!result.ok) setStatus(previous);
                  if (result.message) toast(result.message, result.ok ? "ok" : "error");
                });
              }}
              className={cn("min-h-10 rounded-full text-sm font-semibold transition-colors", status === s ? "bg-rift text-white" : "text-muted hover:text-ink")}
            >
              {LISTING_STATUS[s]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <Link href={`/mercado/${id}/editar`} className={buttonClass("secondary", "md", "flex-1")}><Pencil size={16} aria-hidden /> Editar</Link>
        <ActionButton action={() => deleteListing(id)} confirm="Apagar este anúncio?" variant="danger" size="md" className="flex-1">
          <Trash2 size={16} aria-hidden /> Apagar
        </ActionButton>
      </div>
    </div>
  );
}
