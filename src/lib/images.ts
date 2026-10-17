// Fotos: URL pública a partir do caminho salvo no banco e validação de caminhos enviados.
// O banco guarda só o caminho dentro do bucket "media" (ex.: "{user_id}/posts/{uuid}.jpg").

import { SUPABASE_URL } from "@/lib/env";

export const MEDIA_BUCKET = "media";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const UPLOAD_FOLDERS = ["avatars", "posts", "listings", "events", "results", "cards"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Caminhos "demo/..." são as artes do seed, servidas de /public/demo. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("demo/")) return `/${path}`;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATH_RE = new RegExp(`^(${UUID})/(${UPLOAD_FOLDERS.join("|")})/${UUID}\\.(jpg|png|webp)$`);

/**
 * Um caminho enviado por formulário só vale se estiver na pasta do próprio usuário
 * (impede apontar para a foto de outra pessoa) e tiver o formato que o upload gera.
 */
export function isOwnMediaPath(path: string, userId: string): boolean {
  const match = path.match(PATH_RE);
  return Boolean(match && match[1] === userId);
}
