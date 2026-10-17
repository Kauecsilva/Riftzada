import Link from "next/link";
import { Crown, Layers, Pin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { Podium } from "@/components/arena/Podium";
import { DeckMiniCard } from "@/components/decks/DeckCard";
import { cn } from "@/lib/cn";
import type { Post } from "@/types/domain";
import { AuthorLine } from "./AuthorLine";
import { PostMenu } from "./PostMenu";

const KIND_LINE: Record<Post["kind"], string | null> = {
  general: null,
  pull: "abriu uma carta especial",
  deck: "publicou um deck",
  champion: "registrou o campeão",
};

function Images({ images, alt }: { images: string[]; alt: string }) {
  if (!images.length) return null;
  if (images.length === 1) return <Photo src={images[0]} alt={alt} ratio="4/3" className="rounded-2xl" />;
  return (
    <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl">
      {images.slice(0, 4).map((src, i) => (
        <Photo key={src} src={src} alt={`${alt} (${i + 1})`} ratio="1/1" sizes="(min-width: 1024px) 320px, 50vw" />
      ))}
    </div>
  );
}

/** Post do mural. Cada tipo ganha um visual: campeão com pódio, pull em dourado, deck com resumo. */
export function PostCard({ post, canDelete, canModerate }: { post: Post; canDelete: boolean; canModerate: boolean }) {
  const champion = post.kind === "champion" && post.event;
  return (
    <article
      className={cn(
        "card space-y-3 p-4",
        champion && "border-gold/30 bg-linear-to-b from-gold-soft/40 to-surface",
        post.kind === "pull" && "border-gold/20",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <AuthorLine author={post.author} at={post.createdAt}>{KIND_LINE[post.kind]}</AuthorLine>
        </div>
        {post.isFeatured && <Badge tone="rift"><Pin size={12} aria-hidden /> Destaque</Badge>}
        {(canDelete || canModerate) && <PostMenu postId={post.id} canDelete={canDelete} canModerate={canModerate} featured={post.isFeatured} />}
      </div>

      {champion && post.event && (
        <Link href={`/arena/eventos/${post.event.id}`} className="block space-y-1 hover:opacity-90">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-gold uppercase"><Crown size={14} aria-hidden /> Campeão de torneio</p>
          <p className="font-display text-2xl font-extrabold">{post.event.name}</p>
          {post.event.playerCount ? <p className="text-sm text-muted">{post.event.playerCount} jogadores</p> : null}
        </Link>
      )}

      {post.kind === "pull" && (
        <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-gold uppercase"><Sparkles size={14} aria-hidden /> Pull da semana</p>
      )}

      {post.body && <p className="text-[15px] leading-relaxed whitespace-pre-line">{post.body}</p>}

      <Images images={post.images} alt={post.kind === "pull" ? `Carta que ${post.author.displayName} abriu` : `Foto de ${post.author.displayName}`} />

      {champion && post.event && post.event.podium.length > 0 && <Podium results={post.event.podium.slice(0, 3)} compact />}

      {post.kind === "deck" && post.deck && (
        <>
          <DeckMiniCard deck={post.deck} />
          <Link href={`/decks/${post.deck.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-energy hover:underline">
            <Layers size={16} aria-hidden /> Ver deck
          </Link>
        </>
      )}
    </article>
  );
}
