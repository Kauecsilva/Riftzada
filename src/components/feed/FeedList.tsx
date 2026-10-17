import Link from "next/link";
import { MessageSquareDashed } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/button";
import type { FeedItem, Session } from "@/types/domain";
import { canModerate } from "@/server/session";
import { ListingFeedCard } from "./ListingFeedCard";
import { PostCard } from "./PostCard";

export function FeedList({ items, session, pageSize, basePath = "/" }: { items: FeedItem[]; session: Session; pageSize: number; basePath?: string }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={MessageSquareDashed}
        title="O mural tá quieto…"
        text="Posta aquela foto do testing ou o pull da semana e puxa a resenha."
        action={{ href: "/publicar", label: "Publicar no mural" }}
      />
    );
  }
  const posts = items.filter((i) => i.type === "post");
  const oldest = posts.at(-1)?.at;
  const mod = canModerate(session);
  return (
    <div className="space-y-4">
      {items.map((item) =>
        item.type === "post" ? (
          <PostCard key={`p-${item.post.id}`} post={item.post} canDelete={item.post.author.id === session.userId} canModerate={mod} />
        ) : (
          <ListingFeedCard key={`l-${item.listing.id}`} listing={item.listing} />
        ),
      )}
      {posts.length >= pageSize && oldest && (
        <div className="flex justify-center pt-2">
          <Link href={`${basePath}?antes=${encodeURIComponent(oldest)}#mural`} className={buttonClass("secondary")} scroll={false}>
            Carregar mais
          </Link>
        </div>
      )}
    </div>
  );
}
