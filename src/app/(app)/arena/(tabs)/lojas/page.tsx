import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, MapPin, Store as StoreIcon } from "lucide-react";
import { StoreSchedule } from "@/components/stores/StoreSchedule";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStoreEvents, getStores } from "@/server/queries/stores";

export const metadata: Metadata = { title: "Lojas" };

export default async function StoresPage() {
  const stores = await getStores();
  const schedules = await Promise.all(stores.map((s) => getStoreEvents(s.id)));
  return (
    <div className="space-y-4">
      {stores.length ? (
        stores.map((store, i) => (
          <section key={store.id} aria-labelledby={`loja-${store.id}`} className="card p-5">
            <h2 id={`loja-${store.id}`} className="font-display text-xl font-bold">{store.name}</h2>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {store.address && <li className="flex items-center gap-1.5"><MapPin size={15} aria-hidden /> {store.address}</li>}
              {store.instagram && (
                <li>
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-ink hover:underline">
                    <AtSign size={15} aria-hidden /> {store.instagram}
                  </a>
                </li>
              )}
            </ul>
            {store.description && <p className="mt-3 text-sm whitespace-pre-line">{store.description}</p>}
            <div className="mt-3">
              <StoreSchedule events={schedules[i]} />
            </div>
          </section>
        ))
      ) : (
        <EmptyState icon={StoreIcon} title="Nenhuma loja por aqui ainda." text="Tem uma loja? Cadastre e divulgue o semanal e os torneios." action={{ href: "/loja", label: "Cadastrar minha loja" }} />
      )}
      {stores.length > 0 && (
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <p className="min-w-0 flex-1 text-sm text-muted">Tem uma loja? Divulgue o semanal, o skirmish e os pré-releases aqui.</p>
          <Link href="/loja" className={buttonClass("secondary", "sm")}><StoreIcon size={15} aria-hidden /> Minha loja</Link>
        </div>
      )}
    </div>
  );
}
