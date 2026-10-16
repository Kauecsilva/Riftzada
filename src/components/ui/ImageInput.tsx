"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/compress";
import { DEMO_MESSAGE, isDemoMode } from "@/lib/env";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MEDIA_BUCKET, mediaUrl, type UploadFolder } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { useToast } from "./Toast";

/**
 * Escolhe fotos, comprime no navegador e envia direto para o Storage, na pasta do usuário.
 * O formulário recebe só os caminhos (inputs hidden com `name`).
 */
export function ImageInput({
  name, folder, userId, max = 1, initialUrl, label = "Adicionar foto", round,
}: {
  name: string; folder: UploadFolder; userId: string; max?: number; initialUrl?: string | null; label?: string; round?: boolean;
}) {
  // Itens novos têm `path` (vai no formulário); a foto já salva só aparece (url) e não é reenviada
  const [items, setItems] = useState<{ url: string; path: string | null }[]>(initialUrl ? [{ url: initialUrl, path: null }] : []);
    const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (isDemoMode) {
      toast(DEMO_MESSAGE, "error");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const added: string[] = [];
    try {
      for (const file of [...files].slice(0, max === 1 ? 1 : max - items.length)) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
          toast("Só dá para enviar fotos (JPG, PNG ou WebP).", "error");
          continue;
        }
        const { blob, type, ext } = await compressImage(file);
        if (blob.size > MAX_UPLOAD_BYTES) {
          toast("Foto grande demais (máx. 5 MB).", "error");
          continue;
        }
        const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: type, cacheControl: "31536000" });
        if (error) {
          console.error(error);
          toast("Não deu para enviar a foto. Tenta de novo?", "error");
          continue;
        }
        added.push(path);
      }
      const fresh = added.map((path) => ({ url: mediaUrl(path) ?? "", path }));
      if (fresh.length) setItems((current) => (max === 1 ? fresh : [...current, ...fresh].slice(0, max)));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const canAdd = max === 1 || items.length < max;

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.url} className={cn("relative size-24 overflow-hidden border border-line bg-surface-2", round ? "rounded-full" : "rounded-2xl")}>
          <Image src={item.url} alt="Foto escolhida" fill sizes="96px" className="object-cover" unoptimized />
          {item.path && <input type="hidden" name={name} value={item.path} />}
          {!round && (
            <button
              type="button"
              onClick={() => setItems((list) => list.filter((i) => i !== item))}
              aria-label="Remover foto"
              className="absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      ))}
      {canAdd && (
        <label
          className={cn(
            "flex size-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-surface-2 text-center text-xs font-medium text-muted transition-colors hover:border-rift hover:text-ink",
            round ? "rounded-full" : "rounded-2xl",
            busy && "pointer-events-none opacity-60",
          )}
        >
          {busy ? <Loader2 size={22} className="animate-spin" aria-hidden /> : <ImagePlus size={22} aria-hidden />}
          <span className="px-1">{busy ? "Enviando…" : items.length && max === 1 ? "Trocar" : label}</span>
          <input ref={input} type="file" accept="image/*" multiple={max > 1} className="sr-only" onChange={(e) => upload(e.target.files)} disabled={busy} />
        </label>
      )}
    </div>
  );
}
