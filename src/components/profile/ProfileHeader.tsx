import Link from "next/link";
import { AtSign, CalendarDays, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/button";
import { longDate } from "@/lib/format";
import type { Profile } from "@/types/domain";

export function ProfileHeader({ profile, mine, champion }: { profile: Profile; mine: boolean; champion: boolean }) {
  return (
    <header className="relative overflow-hidden rounded-[28px] border border-line bg-linear-to-br from-rift-soft via-surface to-surface p-5 md:p-7">
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-rift/25 blur-3xl" aria-hidden />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar name={profile.displayName} src={profile.avatarUrl} size={96} ring={champion ? "gold" : "rift"} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl leading-none font-extrabold tracking-tight">{profile.displayName}</h1>
          <p className="mt-1 text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-3 max-w-prose">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.favoriteLegend && <Badge tone="rift">Main {profile.favoriteLegend.name.split(",")[0]}</Badge>}
            <Badge><CalendarDays size={12} aria-hidden /> Desde {longDate(profile.createdAt).replace(/^\d+ de /, "")}</Badge>
            {profile.instagram && (
              <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer">
                <Badge className="hover:text-ink"><AtSign size={12} aria-hidden /> {profile.instagram}</Badge>
              </a>
            )}
          </div>
        </div>
        {mine && (
          <Link href="/perfil/editar" className={buttonClass("secondary", "sm", "sm:self-start")}>
            <Pencil size={15} aria-hidden /> Editar perfil
          </Link>
        )}
      </div>
    </header>
  );
}
