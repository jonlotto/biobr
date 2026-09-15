import { BarChart3 } from "lucide-react";

export function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Acompanhe cliques e visitas da sua página
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Em breve</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Estamos preparando métricas detalhadas sobre os acessos à sua página.
        </p>
      </div>
    </div>
  );
}
