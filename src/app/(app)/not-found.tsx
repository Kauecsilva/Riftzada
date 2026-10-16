import Link from "next/link";
import { Ghost } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <Ghost size={40} className="text-muted" aria-hidden />
      <h1 className="mt-4 font-display text-2xl font-bold">Isso sumiu na fenda</h1>
      <p className="mt-1 text-muted">A página não existe ou foi apagada.</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>Voltar para a Home</Link>
    </div>
  );
}
