import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { SiGooglecalendar, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { fmtPhone } from "@/lib/format";
import type { DispatchLog, IntegrationsStatus } from "@/lib/types";

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function LogItem({ log }: { log: DispatchLog }) {
  return (
    <li className="rounded-lg border border-line bg-[#0B0D11] p-3" data-testid={`whatsapp-log-${log.id}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-neutral-400">{fmtDateTime(log.sent_at)}</span>
        <Badge variant="outline" className="border-line">{log.kind === "auto" ? "Automático" : "Manual"}</Badge>
        {log.mock ? (
          <Badge className="bg-amber-500/15 text-amber-300">SIMULADO</Badge>
        ) : log.ok ? (
          <Badge className="bg-emerald-500/15 text-emerald-300">Enviado</Badge>
        ) : (
          <Badge className="bg-red-500/15 text-red-300">Falhou</Badge>
        )}
        <span className="text-neutral-500">{log.count} agendamento(s)</span>
      </div>
      <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-300">{log.preview}</pre>
      {log.detail && <p className="mt-1 text-xs text-neutral-500">{log.detail}</p>}
    </li>
  );
}

export default function IntegrationsTab() {
  const status = useQuery({ queryKey: ["integrations"], queryFn: () => apiGet<IntegrationsStatus>("/admin/integrations") });
  const logs = useQuery({ queryKey: ["whatsapp-logs"], queryFn: () => apiGet<DispatchLog[]>("/admin/integrations/whatsapp/logs") });

  const send = useMutation({
    mutationFn: () => apiPost<DispatchLog>("/admin/integrations/whatsapp/send-today"),
    onSuccess: (log) => {
      if (!log.ok) toast.error(log.detail);
      else toast.success(log.mock ? "Resumo gerado (envio SIMULADO)." : "Resumo enviado pelo WhatsApp!");
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const s = status.data && !status.isError ? status.data : undefined;
  const wa = s?.whatsapp;
  const gc = s?.google_calendar;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {/* WhatsApp */}
      <div className="space-y-5 rounded-xl border border-line bg-panel p-6" data-testid="integration-whatsapp-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#25D366]/15 text-[#25D366]"><SiWhatsapp size={22} /></span>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">WhatsApp Business</h2>
              <p className="text-xs text-neutral-400">Cloud API (Meta) · resumo diário para o funileiro</p>
            </div>
          </div>
          {status.isLoading ? <Loader2 className="size-4 animate-spin text-neutral-400" /> : wa?.configured ? (
            <Badge className="bg-emerald-500/15 text-emerald-300" data-testid="integration-whatsapp-status">Conectado</Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-300" data-testid="integration-whatsapp-status">SIMULADO</Badge>
          )}
        </div>

        {wa && !wa.configured && (
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90" data-testid="integration-whatsapp-mock-notice">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p>As credenciais da Meta (Token de Acesso e ID do Número de Telefone) ainda não estão completas. Os resumos são gerados e registrados abaixo, mas <b>não são enviados</b> até a configuração.</p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-neutral-500">Destinatário</dt><dd className="mt-1 font-mono text-white" data-testid="integration-whatsapp-recipient">{wa ? fmtPhone(wa.recipient) : "—"}</dd></div>
          <div><dt className="text-xs text-neutral-500">Envio automático</dt><dd className="mt-1 font-mono text-white">{wa ? (wa.daily_enabled ? `todo dia às ${wa.daily_time}` : "desativado") : "—"}</dd></div>
          <div><dt className="text-xs text-neutral-500">Modo</dt><dd className="mt-1 text-white">{wa?.mode === "text" ? "Texto livre" : "Template aprovado"}</dd></div>
          <div><dt className="text-xs text-neutral-500">Template</dt><dd className="mt-1 font-mono text-white">{wa?.template_name ?? "—"}</dd></div>
        </dl>

        <Button onClick={() => send.mutate()} disabled={send.isPending} className="h-11 w-full bg-[#25D366] font-semibold text-white hover:bg-[#1fb857]" data-testid="integration-whatsapp-send-button">
          {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Disparar resumo do dia agora
        </Button>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Histórico de envios</p>
          {logs.isLoading ? <Loader2 className="size-4 animate-spin text-neutral-400" /> : (logs.data ?? []).length === 0 || logs.isError ? (
            <p className="text-sm text-neutral-500" data-testid="whatsapp-logs-empty">Nenhum envio ainda.</p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1" data-testid="whatsapp-logs">
              {(logs.data ?? []).map((l) => <LogItem key={l.id} log={l} />)}
            </ul>
          )}
        </div>

        <details className="rounded-lg border border-line p-4 text-sm text-neutral-400">
          <summary className="cursor-pointer font-medium text-neutral-200">Como ativar o envio real</summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Em developers.facebook.com crie um app do tipo Business e adicione o produto WhatsApp.</li>
            <li>Em WhatsApp → Configuração da API copie o <b>ID do número de telefone</b> e gere um <b>token de acesso permanente</b> (usuário do sistema).</li>
            <li>No WhatsApp Manager crie o template <code className="font-mono text-amber-300">agenda_do_dia</code> (categoria Utilidade, idioma pt_BR) com o corpo: <i>"Agenda de {"{{1}}"}: {"{{2}}"}"</i>.</li>
            <li>Informe as duas chaves no painel de chaves do projeto. O status acima mudará para <b>Conectado</b>.</li>
          </ol>
        </details>
      </div>

      {/* Google Calendar */}
      <div className="space-y-5 rounded-xl border border-line bg-panel p-6" data-testid="integration-gcal-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-sky-500/15 text-sky-300"><SiGooglecalendar size={20} /></span>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">Google Agenda</h2>
              <p className="text-xs text-neutral-400">Cada agendamento do site vira um evento</p>
            </div>
          </div>
          <Badge className="bg-amber-500/15 text-amber-300" data-testid="integration-gcal-status">{gc?.mocked ?? true ? "SIMULADO" : "Conectado"}</Badge>
        </div>
        <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <p>Integração <b>SIMULADA</b>: os eventos são criados e guardados no sistema no mesmo formato do Google Agenda. Para sincronizar com sua conta Google, será necessário um Client ID/Secret do Google Cloud.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-[#0B0D11] p-4">
          <CalendarDays className="size-6 text-amber-400" />
          <div>
            <p className="font-mono text-2xl font-semibold text-white" data-testid="integration-gcal-count">{gc?.events_created ?? "—"}</p>
            <p className="text-xs text-neutral-400">eventos ativos criados</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Últimos eventos</p>
          {(gc?.recent_events ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum evento ainda.</p>
          ) : (
            <ul className="space-y-2" data-testid="integration-gcal-events">
              {gc?.recent_events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm">
                  <span className="flex items-center gap-2 text-neutral-200">
                    <CheckCircle2 className={e.status === "confirmed" ? "size-4 text-emerald-400" : "size-4 text-neutral-600"} /> {e.summary}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-neutral-400">{e.start.replace("T", " ").slice(0, 16)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="outline" disabled className="w-full" data-testid="integration-gcal-connect-button">
          <SiGooglecalendar size={15} /> Conectar conta Google (em breve)
        </Button>
      </div>
    </div>
  );
}
