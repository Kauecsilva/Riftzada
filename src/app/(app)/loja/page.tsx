import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Clock, MapPin, Pencil, Plus } from "lucide-react";
import { StoreForm } from "@/components/stores/StoreForm";
import { StoreSchedule } from "@/components/stores/StoreSchedule";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashToast } from "@/components/ui/Toast";
import { canCreateStore, getMyStores, getStoreEvents } from "@/server/queries/stores";

export const metadata: Metadata = { title: "Minha loja" };

const FLASH: Record<string, string> = {
  "loja-criada": "Pedido enviado! Assim que a organização aprovar a loja, você já cria os eventos.",
  "loja-salva": "Loja salva!",
  "evento-salvo": "Evento salvo!",
  "evento-apagado": "Evento apagado.",
};

export default async function MyStorePage({ searchParams }: PageProps<"/loja">) {
  const [stores, params, allowed] = await Promise.all([getMyStores(), searchParams, canCreateStore()]);
  const created = Number(params["evento-criado"]);
  const flashKey = Object.keys(FLASH).find((k) => params[k]);
  const flash = created ? (created > 1 ? `${created} datas na agenda!` : "Evento criado!") : flashKey && FLASH[flashKey];

  if (!stores.length && !allowed) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Eventos de loja" back="/arena/lojas" />
        <p className="card p-5 text-sm text-muted">
          Só contas de loja cadastram eventos na Riftzada. Se você tem uma loja, crie uma conta escolhendo <strong className="text-ink">Loja</strong> no cadastro.
        </p>
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Cadastre sua loja" subtitle="Lojas divulgam aqui o semanal, o skirmish de sábado, os campeonatos… e a galera marca “Vou jogar”. A organização confere e aprova a conta da loja antes dos eventos." back="/arena/lojas" />
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
            {store.approved ? (
              <>
                <Link href={`/loja/${store.id}/eventos/novo`} className={buttonClass("primary", "md", "mb-2")}><Plus size={18} aria-hidden /> Novo evento</Link>
                <StoreSchedule events={schedules[i]} manage storeId={store.id} />
              </>
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
                <Clock size={16} aria-hidden /> Aguardando a aprovação da organização. Depois dela você já cria os eventos da loja.
              </p>
            )}
          </section>
        ))}
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/loja/nova" className="font-semibold text-rift-strong hover:underline">Cadastrar outra loja</Link>
      </p>
    </div>
  );
}
