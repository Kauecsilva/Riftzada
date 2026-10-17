"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ROLE } from "@/lib/domain/labels";
import { updateMember } from "@/server/actions/admin";
import type { Member, MemberRole } from "@/types/domain";

export function MemberRow({ member, isMe }: { member: Member; isMe: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const run = (change: { role?: MemberRole; banned?: boolean }) =>
    start(async () => {
      const r = await updateMember(member.id, change);
      if (r.message) toast(r.message, r.ok ? "ok" : "error");
    });

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3" aria-busy={pending}>
      <Avatar name={member.displayName} src={member.avatarUrl} size={40} />
      <div className="min-w-40 flex-1">
        <p className="truncate font-semibold">{member.displayName} {member.isBanned && <span className="text-xs text-danger">(banido)</span>}</p>
        <p className="truncate text-sm text-muted">@{member.username}</p>
      </div>
      <label className="sr-only" htmlFor={`role-${member.id}`}>Papel de {member.displayName}</label>
      <select id={`role-${member.id}`} disabled={isMe || pending} defaultValue={member.role} onChange={(e) => run({ role: e.target.value as MemberRole })} className="input w-auto min-w-36">
        {(Object.keys(ROLE) as MemberRole[]).map((r) => <option key={r} value={r}>{ROLE[r]}</option>)}
      </select>
      {!isMe && (
        <button
          type="button"
          disabled={pending}
          onClick={() => (member.isBanned || window.confirm(`Banir ${member.displayName}? Ele perde acesso ao app.`)) && run({ banned: !member.isBanned })}
          className="min-h-10 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-danger"
        >
          {member.isBanned ? "Desbanir" : "Banir"}
        </button>
      )}
    </li>
  );
}
