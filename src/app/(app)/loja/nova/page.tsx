import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StoreForm } from "@/components/stores/StoreForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { canCreateStore } from "@/server/queries/stores";

export const metadata: Metadata = { title: "Nova loja" };

export default async function NewStorePage() {
  if (!(await canCreateStore())) redirect("/loja");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nova loja" back="/loja" />
      <StoreForm />
    </div>
  );
}
