import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, MapPin, Pencil, Plus } from "lucide-react";
import { StoreForm } from "@/components/stores/StoreForm";
import { StoreSchedule } from "@/components/stores/StoreSchedule";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { getMyStores, getStoreEvents } from "@/server/queries/stores";

export const metadata: Metadata = { title: "Minha loja" };

const FLASH: Record<string, string> = {
  "loja-criada": "Loja cadastrada! Agora é só criar os eventos.",
  "loja-salva": "Loja salva!",
  "evento-salvo": "Evento salvo!",
  "evento-apagado": "Evento apagado.",
};

export default async function MyStorePage({ searchParams }: PageProps<"/loja">) {
  const [stores, params] = await Promise.all([getMyStores(), searchParams]);
  const created = Number(params["evento-criado"]);
  const flashKey = Object.keys(FLASH).find((k) => params[k]);
  const flash = created ? (created > 1 ? `${created} datas na agenda!` : "Evento criado!") : flashKey && FLASH[flashKey];

  if (!stores.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Cadastre sua loja" subtitle="Lojas divulgam aqui o semanal, o skirmish de sábado, o pré-release… e a galera marca “Vou jogar”." back="/arena/lojas" />
        <StoreForm />
      </div>
    );
  }

  const schedules = await Promise.all(stores.map((s) => getStoreEvents(s.id)));
  return (
    <div className="mx-auto max-w-3xl">
      {flash && <FlashToast text={flash} />}
      <PageHeader title={stores.length > 1 ? "Minhas lojas" : "Minha loja"} subtitle="Os eventos aparecem na Arena para toda a comunidade." />
      <div className="space-y-6">
        {stores.map((store, i) => (
          <section key={store.id} aria-labelledby={`loja-${store.id}`} className="card p-5">
            <div className="mb-4 flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 id={`loja-${store.id}`} className="font-display text-2xl font-bold">{store.name}</h2>
                <ul className="mt-1 space-y-1 text-sm text-muted">
                  {store.address && <li className="flex items-center gap-2"><MapPin size={15} aria-hidden /> {store.address}</li>}
                  {store.instagram && <li className="flex items-center gap-2"><AtSign size={15} aria-hidden /> {store.instagram}</li>}
                </ul>
              </div>
              <Link href={`/loja/${store.id}/editar`} className={buttonClass("ghost", "sm")}><Pencil size={14} aria-hidden /> Editar loja</Link>
            </div>
            <Link href={`/loja/${store.id}/eventos/novo`} className={buttonClass("primary", "md", "mb-2")}><Plus size={18} aria-hidden /> Novo evento</Link>
            <StoreSchedule events={schedules[i]} manage storeId={store.id} />
          </section>
        ))}
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/loja/nova" className="font-semibold text-rift-strong hover:underline">Cadastrar outra loja</Link>
      </p>
    </div>
  );
}
