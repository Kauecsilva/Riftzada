import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/format";
import type { MiniProfile } from "@/types/domain";

export function AuthorLine({ author, at, region, children }: {
  author: MiniProfile; at: string; region?: string | null; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/jogador/${author.username}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <Avatar name={author.displayName} src={author.avatarUrl} size={40} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug [overflow-wrap:anywhere]">
          <Link href={`/jogador/${author.username}`} className="font-semibold hover:underline">{author.displayName}</Link>
          {children && <span className="text-muted"> {children}</span>}
        </p>
        <p className="flex items-center gap-1 text-xs text-faint">
          <time dateTime={at}>{timeAgo(at)}</time>
          {region && <><span aria-hidden>·</span><MapPin size={12} aria-hidden /><span className="truncate">{region}</span></>}
        </p>
      </div>
    </div>
  );
}
