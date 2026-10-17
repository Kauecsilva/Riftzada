import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { FormMessage } from "@/components/ui/FormMessage";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const { next, erro, confirmado } = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Bora pra mesa?</h1>
      {confirmado && <FormMessage state={{ ok: true, message: "E-mail confirmado! Agora é só entrar com teu e-mail e senha." }} />}
      {erro === "link" && <FormMessage state={{ ok: false, message: "Esse link expirou ou já foi usado. Entra com tua senha ou pede um novo." }} />}
      <SignInForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
