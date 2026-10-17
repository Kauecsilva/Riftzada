import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-gold/20 bg-gold-soft/60 px-4 py-2 text-center text-xs text-gold">
      <FlaskConical size={14} className="mr-1.5 inline -translate-y-px" aria-hidden />
      Modo demonstração: dados fictícios, nada é salvo. Configure o Supabase no <code>.env.local</code>.
    </div>
  );
}
