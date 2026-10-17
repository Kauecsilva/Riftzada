import { WifiOff } from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark size={56} />
      <WifiOff size={28} className="mt-8 text-muted" aria-hidden />
      <h1 className="mt-3 font-display text-2xl font-bold">Caiu a conexão</h1>
      <p className="mt-1 max-w-xs text-muted">Assim que a internet voltar, a Riftzada volta junto.</p>
    </main>
  );
}
