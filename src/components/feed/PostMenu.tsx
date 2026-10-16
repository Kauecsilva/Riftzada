"use client";

import { useState } from "react";
import { EyeOff, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Sheet } from "@/components/ui/Sheet";
import { deletePost } from "@/server/actions/content";
import { moderatePost } from "@/server/actions/admin";

/** Menu "…" do post: apagar (autor) e ocultar/destacar (moderação). */
export function PostMenu({ postId, canDelete, canModerate, featured }: { postId: string; canDelete: boolean; canModerate: boolean; featured: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Opções do post" className="-mr-2 inline-flex size-9 items-center justify-center rounded-full text-faint hover:bg-surface-2 hover:text-ink">
        <MoreHorizontal size={20} aria-hidden />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Opções do post">
        <div className="grid gap-2">
          {canModerate && (
            <>
              <ActionButton action={() => moderatePost(postId, { featured: !featured })} size="lg" className="justify-start">
                {featured ? <PinOff size={18} aria-hidden /> : <Pin size={18} aria-hidden />} {featured ? "Tirar do destaque" : "Destacar no mural"}
              </ActionButton>
              <ActionButton action={() => moderatePost(postId, { hidden: true })} confirm="Ocultar este post para a comunidade?" size="lg" className="justify-start">
                <EyeOff size={18} aria-hidden /> Ocultar post
              </ActionButton>
            </>
          )}
          {canDelete && (
            <ActionButton action={() => deletePost(postId)} confirm="Apagar este post? Não dá para desfazer." variant="danger" size="lg" className="justify-start">
              <Trash2 size={18} aria-hidden /> Apagar post
            </ActionButton>
          )}
        </div>
      </Sheet>
    </>
  );
}
