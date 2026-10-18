import Image from "next/image";
import { LogoMark } from "@/components/layout/Logo";
import { RiftboundCredit } from "@/components/layout/RiftboundCredit";
import { ART } from "@/lib/art";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-[60dvh]" aria-hidden>
        <Image src={ART.launch} alt="" fill priority sizes="100vw" className="object-cover object-[50%_15%] opacity-60" />
        <div className="absolute inset-0 bg-linear-to-b from-bg/30 via-bg/70 to-bg" />
      </div>
      <div className="relative mb-8 flex flex-col items-center text-center">
        <LogoMark size={64} className="drop-shadow-[0_10px_30px_rgba(242,138,31,0.45)]" />
        <p className="mt-4 font-display text-5xl leading-none font-extrabold tracking-wide drop-shadow-[0_2px_12px_rgb(0_0_0/0.8)]">
          RIFT<span className="text-brand">ZADA</span>
        </p>
        <p className="mt-2 text-ink/85">Onde a galera do Rift se encontra.</p>
      </div>
      <div className="card frame-hex relative w-full max-w-sm p-6">{children}</div>
      <div className="relative mt-8 flex max-w-sm flex-col items-center text-center">
        <RiftboundCredit className="flex flex-col items-center" />
        <p className="mt-2 text-xs text-faint">Projeto da comunidade, feito por jogadores. Não é um app oficial de nenhuma loja.</p>
      </div>
    </main>
  );
}
