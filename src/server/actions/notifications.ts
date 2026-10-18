"use server";

// Avisos: abrir um (marca como lido e leva ao anúncio) e marcar todos como lidos.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { optionalUuid, uuid } from "@/lib/validation/common";
import { requireSession } from "../session";

export async function openNotification(form: FormData): Promise<void> {
  await requireSession();
  const id = uuid.safeParse(form.get("id"));
  const listing = optionalUuid.safeParse(form.get("listingId") ?? "");
  if (id.success && !isDemoMode) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("mark_notifications_read", { target: id.data });
    if (error) console.error("[db]", error.code, error.message);
    revalidatePath("/", "layout");
  }
  redirect(listing.success && listing.data ? `/mercado/${listing.data}` : "/notificacoes");
}

export async function markAllNotificationsRead(): Promise<void> {
  await requireSession();
  if (isDemoMode) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read");
  if (error) console.error("[db]", error.code, error.message);
  revalidatePath("/", "layout");
}
