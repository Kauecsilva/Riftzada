import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-radiance-line/50 bg-radiance-soft px-4 py-1.5 text-center text-xs font-medium text-rift-strong">
      <FlaskConical size={14} className="mr-1.5 inline -translate-y-px" aria-hidden />
      Modo demonstração: dados fictícios, alterações não são salvas.
    </div>
  );
}
