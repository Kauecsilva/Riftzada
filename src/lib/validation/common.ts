import { z } from "zod";

/** Resultado padrão de uma Server Action usada com useActionState. */
export type ActionState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string> };

export const initialActionState: ActionState = {};

/** Texto opcional: vazio vira null, espaços nas pontas somem. */
export const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres`).transform((v) => (v === "" ? null : v)).nullable().optional()
    .transform((v) => v ?? null);

export const requiredText = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label}: mínimo de ${min} caracteres`).max(max, `${label}: máximo de ${max} caracteres`);

export const uuid = z.uuid("Id inválido");
export const optionalUuid = z.union([z.uuid(), z.literal("")]).optional().transform((v) => (v ? v : null));

/** Checkbox de formulário: "on" quando marcado, ausente quando não. */
export const checkbox = z.union([z.literal("on"), z.literal("true"), z.literal("")]).optional().transform((v) => v === "on" || v === "true");

export const optionalInt = (min: number, max: number) =>
  z.union([z.literal(""), z.coerce.number().int().min(min).max(max)]).optional().transform((v) => (v === "" || v == null ? null : v));

export const record = z
  .string()
  .trim()
  .regex(/^(\d{1,2}-\d{1,2}(-\d{1,2})?)?$/, "Use o formato 4-1 ou 3-1-1")
  .transform((v) => (v === "" ? null : v))
  .optional()
  .transform((v) => v ?? null);

/** Converte FormData em objeto simples (campos repetidos viram lista). */
export function formToObject(form: FormData, arrays: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrays.includes(key) ? values : values[0];
  }
  for (const key of arrays) out[key] ??= [];
  return out;
}

/** Transforma o erro do Zod em mensagens por campo + a primeira como resumo. */
export function zodErrorState(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, message: error.issues[0]?.message ?? "Confira os campos.", fieldErrors };
}
