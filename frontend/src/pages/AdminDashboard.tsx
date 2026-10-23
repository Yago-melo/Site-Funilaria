import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, Images, Loader2, LogOut, MessageSquareQuote, Timer, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/Navbar";
import AppointmentsTab from "@/components/admin/AppointmentsTab";
import QuotesTab from "@/components/admin/QuotesTab";
import ReviewsTab from "@/components/admin/ReviewsTab";
import GalleryTab from "@/components/admin/GalleryTab";
import SettingsTab from "@/components/admin/SettingsTab";
import IntegrationsTab from "@/components/admin/IntegrationsTab";
import { ApiError, apiGet } from "@/lib/api";
import { endSession } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import type { AdminStats, AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";

function CountDot({ n, testId }: { n?: number; testId: string }) {
  if (!n) return null;
  return <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 font-mono text-[10px] font-bold leading-4 text-black" data-testid={testId}>{n}</span>;
}

export default function AdminDashboard() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("google") ? "integracoes" : "agendamentos");
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<AdminUser>("/auth/me"), retry: false });
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet<AdminStats>("/admin/stats"), enabled: Boolean(me.data) });

  useEffect(() => {
    const g = params.get("google");
    if (!g) return;
    if (g === "ok") toast.success("Google Agenda conectado! Novos agendamentos vão direto para sua agenda.");
    else toast.error("Não foi possível conectar o Google Agenda. Tente novamente.");
    setParams({}, { replace: true });
  }, [params, setParams]);

  if (me.isError && me.error instanceof ApiError && me.error.status === 401) return <Navigate to="/admin" replace />;

  const s = stats.data && !stats.isError ? stats.data : undefined;
  const METRICS = [
    { label: "Hoje", value: s?.today_count, icon: CalendarClock, id: "today" },
    { label: "Próximos", value: s?.upcoming_count, icon: Timer, id: "upcoming" },
    { label: "Pendentes", value: s?.pending_count, icon: TriangleAlert, id: "pending" },
    { label: "Orçamentos novos", value: s?.quotes_new, icon: MessageSquareQuote, id: "quotes" },
    { label: "Itens na galeria", value: s?.gallery_count, icon: Images, id: "gallery" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D11]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <BrandMark />
            <span className="hidden rounded border border-amber-500/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-400 sm:inline">Painel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-neutral-400 md:inline" data-testid="admin-user-email">{me.data?.email}</span>
            <Link to="/" target="_blank" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))} data-testid="admin-view-site-link">
              <ExternalLink className="size-4" /> Ver site
            </Link>
            <Button variant="outline" size="sm" onClick={() => endSession("/admin")} data-testid="admin-logout-button">
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">{s ? fmtDate(s.today) : "Hoje"}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white">Painel da oficina</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" data-testid="admin-stats">
          {METRICS.map((m) => (
            <div key={m.id} className="rounded-xl border border-line bg-panel p-5" data-testid={`admin-stat-${m.id}`}>
              <m.icon className="size-5 text-amber-400" />
              <p className="mt-3 font-mono text-3xl font-semibold text-white">
                {m.value ?? (stats.isLoading ? <Loader2 className="size-5 animate-spin" /> : "—")}
              </p>
              <p className="text-xs text-neutral-400">{m.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList className="h-auto flex-wrap" data-testid="admin-tabs">
            <TabsTrigger value="agendamentos" data-testid="admin-tab-agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="orcamentos" data-testid="admin-tab-orcamentos">Orçamentos<CountDot n={s?.quotes_new} testId="admin-tab-orcamentos-count" /></TabsTrigger>
            <TabsTrigger value="avaliacoes" data-testid="admin-tab-avaliacoes">Avaliações<CountDot n={s?.reviews_pending} testId="admin-tab-avaliacoes-count" /></TabsTrigger>
            <TabsTrigger value="galeria" data-testid="admin-tab-galeria">Galeria</TabsTrigger>
            <TabsTrigger value="integracoes" data-testid="admin-tab-integracoes">Integrações</TabsTrigger>
            <TabsTrigger value="configuracoes" data-testid="admin-tab-configuracoes">Configurações</TabsTrigger>
          </TabsList>
          <TabsContent value="agendamentos" className="mt-6"><AppointmentsTab /></TabsContent>
          <TabsContent value="orcamentos" className="mt-6"><QuotesTab /></TabsContent>
          <TabsContent value="avaliacoes" className="mt-6"><ReviewsTab /></TabsContent>
          <TabsContent value="galeria" className="mt-6"><GalleryTab /></TabsContent>
          <TabsContent value="integracoes" className="mt-6"><IntegrationsTab /></TabsContent>
          <TabsContent value="configuracoes" className="mt-6"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
