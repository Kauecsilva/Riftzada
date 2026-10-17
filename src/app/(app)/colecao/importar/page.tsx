import type { Metadata } from "next";
import { CollectionImportForm } from "@/components/collection/CollectionImportForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Importar coleção" };

export default async function ImportCollectionPage() {
  await requireSession();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Importar coleção" subtitle="Traz tua coleção de outro site num arquivo CSV." back="/colecao" />
      <div className="card mb-5 space-y-2 p-4 text-sm text-muted">
        <p><span className="font-semibold text-ink">LigaRiftbound:</span> na tua coleção, use a opção de exportar e envie o arquivo aqui do jeito que veio.</p>
        <p><span className="font-semibold text-ink">Outros sites:</span> serve qualquer CSV com o nome da carta e a quantidade. Com a sigla da edição e o número da carta, o casamento fica certeiro.</p>
        <p>Cada carta do arquivo fica com a quantidade do arquivo. O que já está na coleção e não veio no arquivo continua igual.</p>
      </div>
      <CollectionImportForm />
    </div>
  );
}
