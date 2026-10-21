import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Pin, PinOff, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, KindTag } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { POST_KIND } from "@/lib/domain/labels";
import { timeAgo } from "@/lib/format";
import { adminDeleteListing, moderateListing, moderatePost } from "@/server/actions/admin";
import { getPosts } from "@/server/queries/feed";
import { getListings } from "@/server/queries/market";

export const metadata: Metadata = { title: "Moderação" };

export default async function ModerationPage() {
  const [posts, listings] = await Promise.all([
    getPosts({ limit: 40, includeHidden: true }),
    getListings({ limit: 40, includeDone: true, includeHidden: true }),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader title="Moderação" subtitle="Ocultar esconde da comunidade sem apagar. Dá para desfazer." />
      <section aria-labelledby="mod-posts">
        <h2 id="mod-posts" className="mb-3 font-display text-lg font-bold">Mural</h2>
        <ul className="card divide-y divide-line">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={p.author.displayName} src={p.author.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm"><strong>{p.author.displayName}</strong> <span className="text-muted">· {POST_KIND[p.kind]} · {timeAgo(p.createdAt)}</span></p>
                <p className="truncate text-sm text-muted">{p.body ?? p.event?.name ?? p.deck?.name ?? "(só foto)"}</p>
              </div>
              {p.isHidden && <Badge tone="danger">Oculto</Badge>}
              {p.isFeatured && <Badge tone="rift">Destaque</Badge>}
              <div className="flex gap-2">
                <ActionButton action={moderatePost.bind(null, p.id, { featured: !p.isFeatured })} label={p.isFeatured ? "Tirar destaque" : "Destacar"}>
                  {p.isFeatured ? <PinOff size={15} aria-hidden /> : <Pin size={15} aria-hidden />}
                </ActionButton>
                <ActionButton action={moderatePost.bind(null, p.id, { hidden: !p.isHidden })} label={p.isHidden ? "Mostrar" : "Ocultar"} variant={p.isHidden ? "secondary" : "danger"}>
                  {p.isHidden ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="mod-listings">
        <h2 id="mod-listings" className="mb-3 font-display text-lg font-bold">Mercado</h2>
        <ul className="card divide-y divide-line">
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <KindTag kind={l.kind} />
              <Link href={`/mercado/${l.id}`} className="min-w-0 flex-1 hover:underline">
                <p className="truncate text-sm font-semibold">{l.cardName}</p>
                <p className="text-xs text-muted">{l.seller.displayName} · {timeAgo(l.createdAt)}</p>
              </Link>
              {l.isHidden && <Badge tone="danger">Oculto</Badge>}
              <div className="flex gap-2">
                <ActionButton action={moderateListing.bind(null, l.id, !l.isHidden)} label={l.isHidden ? "Mostrar" : "Ocultar"} variant={l.isHidden ? "secondary" : "danger"}>
                  {l.isHidden ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
                </ActionButton>
                <ActionButton action={adminDeleteListing.bind(null, l.id, false)} label="Apagar" confirm={`Apagar o anúncio de ${l.seller.displayName}? Não dá para desfazer.`} variant="danger">
                  <Trash2 size={15} aria-hidden />
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
