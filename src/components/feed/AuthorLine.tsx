import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/format";
import type { MiniProfile } from "@/types/domain";

export function AuthorLine({ author, at, children }: { author: MiniProfile; at: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/jogador/${author.username}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <Avatar name={author.displayName} src={author.avatarUrl} size={40} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]">
          <Link href={`/jogador/${author.username}`} className="font-semibold hover:underline">{author.displayName}</Link>
          {children && <span className="text-muted"> {children}</span>}
        </p>
        <p className="text-xs text-faint"><time dateTime={at}>{timeAgo(at)}</time></p>
      </div>
    </div>
  );
}
