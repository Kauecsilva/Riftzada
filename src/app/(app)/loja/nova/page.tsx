import type { Metadata } from "next";
import { StoreForm } from "@/components/stores/StoreForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Nova loja" };

export default function NewStorePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nova loja" back="/loja" />
      <StoreForm />
    </div>
  );
}
