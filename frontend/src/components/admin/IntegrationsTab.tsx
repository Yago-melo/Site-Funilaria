import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, CheckCircle2, Copy, Link2, Loader2, Send, TriangleAlert, Unlink } from "lucide-react";
import { SiGooglecalendar, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { fmtPhone } from "@/lib/format";
import type { DispatchLog, IntegrationsStatus } from "@/lib/types";

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const KIND: Record<string, string> = { auto: "Resumo automático", manual: "Resumo manual", reminder: "Lembrete automático", reminder_manual: "Lembrete manual" };

function LogItem({ log }: { log: DispatchLog }) {
  return (
    <li className="rounded-lg border border-line bg-[#0B0D11] p-3" data-testid={`whatsapp-log-${log.id}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-neutral-400">{fmtDateTime(log.sent_at)}</span>
        <Badge variant="outline" className="border-line">{KIND[log.kind] ?? log.kind}</Badge>
        {log.mock ? (
          <Badge className="bg-amber-500/15 text-amber-300">SIMULADO</Badge>
        ) : log.ok ? (
          <Badge className="bg-emerald-500/15 text-emerald-300">Enviado</Badge>
        ) : (
          <Badge className="bg-red-500/15 text-red-300">Falhou</Badge>
        )}
        <span className="font-mono text-neutral-500">→ {fmtPhone(log.recipient)}</span>
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

  const connect = useMutation({
    mutationFn: () => apiGet<{ authorization_url: string }>("/admin/google/connect"),
    onSuccess: (r) => window.location.assign(r.authorization_url),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const disconnect = useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>("/admin/google/disconnect"),
    onSuccess: () => { toast.success("Google Agenda desconectado."); queryClient.invalidateQueries({ queryKey: ["integrations"] }); },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const s = status.data && !status.isError ? status.data : undefined;
  const wa = s?.whatsapp;
  const gc = s?.google_calendar;

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => toast.success("Copiado!"), () => toast.error("Não foi possível copiar."));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {/* WhatsApp */}
      <div className="space-y-5 rounded-xl border border-line bg-panel p-6" data-testid="integration-whatsapp-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#25D366]/15 text-[#25D366]"><SiWhatsapp size={22} /></span>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">WhatsApp Business</h2>
              <p className="text-xs text-neutral-400">Cloud API (Meta) · resumo diário + lembretes</p>
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
            <p>As credenciais da Meta (Token de Acesso e ID do Número de Telefone) ainda não estão completas. Resumos e lembretes são gerados e registrados abaixo, mas <b>não são enviados</b> até a configuração.</p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-neutral-500">Resumo diário para</dt><dd className="mt-1 font-mono text-white" data-testid="integration-whatsapp-recipient">{wa ? fmtPhone(wa.recipient) : "—"}</dd></div>
          <div><dt className="text-xs text-neutral-500">Envio do resumo</dt><dd className="mt-1 font-mono text-white">{wa ? (wa.daily_enabled ? `todo dia às ${wa.daily_time}` : "desativado") : "—"}</dd></div>
          <div><dt className="text-xs text-neutral-500">Lembrete ao cliente</dt><dd className="mt-1 font-mono text-white" data-testid="integration-reminder-time">{wa ? (wa.reminder_enabled ? `véspera às ${wa.reminder_time}` : "desativado") : "—"}</dd></div>
          <div><dt className="text-xs text-neutral-500">Templates</dt><dd className="mt-1 font-mono text-xs text-white">{wa ? `${wa.template_name} · ${wa.reminder_template}` : "—"}</dd></div>
        </dl>

        <Button onClick={() => send.mutate()} disabled={send.isPending} className="h-11 w-full bg-[#25D366] font-semibold text-white hover:bg-[#1fb857]" data-testid="integration-whatsapp-send-button">
          {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Disparar resumo do dia agora
        </Button>
        <p className="flex items-center gap-2 text-xs text-neutral-500"><Bell className="size-3.5" /> Lembretes também podem ser enviados manualmente na aba Agendamentos.</p>

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
            <li>Em WhatsApp → Configuração da API copie o <b>ID do número de telefone</b> (só números) e gere um <b>token de acesso permanente</b> (usuário do sistema).</li>
            <li>No WhatsApp Manager crie 2 templates (categoria Utilidade, idioma pt_BR):
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li><code className="font-mono text-amber-300">agenda_do_dia</code>: <i>"Agenda de {"{{1}}"}: {"{{2}}"}"</i></li>
                <li><code className="font-mono text-amber-300">lembrete_agendamento</code>: <i>"Olá {"{{1}}"}! Lembrete: seu horário na Nadis Car é amanhã, {"{{2}}"} às {"{{3}}"} ({"{{4}}"})."</i></li>
              </ul>
            </li>
            <li>Peça para cadastrar as duas chaves no projeto. O status acima mudará para <b>Conectado</b>.</li>
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
          {gc?.connected ? (
            <Badge className="bg-emerald-500/15 text-emerald-300" data-testid="integration-gcal-status">Conectado</Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-300" data-testid="integration-gcal-status">SIMULADO</Badge>
          )}
        </div>

        {gc?.connected ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            <span className="flex items-center gap-2 text-emerald-200"><CheckCircle2 className="size-4" /> Conectado como <b data-testid="integration-gcal-email">{gc.email || "conta Google"}</b></span>
            <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Desconectar o Google Agenda?")) disconnect.mutate(); }} data-testid="integration-gcal-disconnect-button">
              <Unlink className="size-4" /> Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90" data-testid="integration-gcal-mock-notice">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p>
              {gc?.client_configured
                ? <>Chaves do Google configuradas. Clique em <b>Conectar conta Google</b> e autorize o acesso à sua agenda.</>
                : <>Integração <b>SIMULADA</b>: os eventos ficam registrados aqui. Para enviar para sua agenda real, crie o Client ID/Secret no Google Cloud (passo a passo abaixo).</>}
            </p>
          </div>
        )}

        {!gc?.connected && (
          <Button onClick={() => connect.mutate()} disabled={!gc?.client_configured || connect.isPending} className="h-11 w-full font-semibold" data-testid="integration-gcal-connect-button">
            {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {gc?.client_configured ? "Conectar conta Google" : "Conectar conta Google (aguardando chaves)"}
          </Button>
        )}

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
                    <CheckCircle2 className={e.status === "confirmed" ? "size-4 shrink-0 text-emerald-400" : "size-4 shrink-0 text-neutral-600"} /> {e.summary}
                  </span>
                  <span className="shrink-0 text-right font-mono text-xs text-neutral-400">
                    {e.start.replace("T", " ").slice(0, 16)}
                    <span className="block text-[10px] uppercase">{e.provider === "google" ? "Google" : "simulado"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="rounded-lg border border-line p-4 text-sm text-neutral-400" open={!gc?.client_configured}>
          <summary className="cursor-pointer font-medium text-neutral-200">Como obter o Client ID e o Client Secret</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Acesse <b>console.cloud.google.com</b> com a conta Google da oficina e crie um projeto (ex.: "Nadis Car Site").</li>
            <li>Em <b>APIs e serviços → Biblioteca</b>, procure <b>Google Calendar API</b> e clique em <b>Ativar</b>.</li>
            <li>Em <b>APIs e serviços → Tela de consentimento OAuth</b>: tipo <b>Externo</b>, preencha nome do app e e-mails. Em <b>Usuários de teste</b>, adicione o seu Gmail.</li>
            <li>Em <b>APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth</b>, tipo <b>Aplicativo da Web</b>.</li>
            <li>
              Em <b>URIs de redirecionamento autorizados</b>, cole este endereço:
              <span className="mt-1.5 flex items-center gap-2 rounded-md border border-line bg-[#0B0D11] p-2">
                <code className="flex-1 break-all font-mono text-xs text-amber-300" data-testid="integration-gcal-redirect-uri">{gc?.redirect_uri ?? "…/api/google/callback"}</code>
                <Button type="button" size="icon-xs" variant="ghost" aria-label="Copiar endereço" onClick={() => gc && copy(gc.redirect_uri)} data-testid="integration-gcal-copy-redirect">
                  <Copy className="size-3.5" />
                </Button>
              </span>
              <span className="mt-1 block text-xs">Quando o site for publicado em outro endereço, adicione também o endereço novo terminando em <code className="font-mono">/api/google/callback</code>.</span>
            </li>
            <li>Clique em <b>Criar</b>. Copie o <b>ID do cliente</b> e a <b>Chave secreta do cliente</b> e peça para cadastrá-los no projeto. Depois volte aqui e clique em <b>Conectar conta Google</b>.</li>
          </ol>
        </details>
      </div>
    </div>
  );
}
