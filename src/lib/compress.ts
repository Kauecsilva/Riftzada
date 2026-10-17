// Reduz a foto no navegador antes do envio: economiza dados móveis e cota do Storage.

export async function compressImage(file: File, maxSide = 1600): Promise<{ blob: Blob; type: string; ext: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (blob) return { blob, type: "image/jpeg", ext: "jpg" };
  } catch {
    // Formato que o navegador não decodifica: segue com o original (o bucket ainda valida)
  }
  const ext = ({ "image/png": "png", "image/webp": "webp" } as Record<string, string>)[file.type] ?? "jpg";
  return { blob: file, type: file.type || "image/jpeg", ext };
}
