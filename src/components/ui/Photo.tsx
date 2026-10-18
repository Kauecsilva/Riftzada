import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Foto com proporção fixa e fallback quando não há imagem.
 * `alt` é obrigatório: descreva o que aparece (ou "" se for decorativa).
 */
export function Photo({
  src, alt, ratio = "4/3", sizes = "(min-width: 1024px) 640px, 100vw", priority, className, fallback,
}: {
  src: string | null; alt: string; ratio?: string; sizes?: string; priority?: boolean; className?: string; fallback?: React.ReactNode;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-surface-2", className)} style={{ aspectRatio: ratio }}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" unoptimized={src.endsWith(".svg")} />
      ) : (
        fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgb(242_138_31/0.18),transparent_60%)] text-faint">
            <ImageOff size={28} aria-hidden />
            <span className="sr-only">{alt || "Sem foto"}</span>
          </div>
        )
      )}
    </div>
  );
}
