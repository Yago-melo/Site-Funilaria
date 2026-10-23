import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, BellRing, CalendarCheck, CalendarX2, Loader2 } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiPatch, apiPost, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { STATUS_CLASS, STATUS_LABEL, fmtDate, fmtPhone, waLink } from "@/lib/format";
import type { Appointment, AppointmentStatus, AppointmentStatusUpdate, DispatchLog } from "@/lib/types";
import { cn } from "@/lib/utils";

type Scope = "today" | "upcoming" | "past" | "all";
const SCOPES: { value: Scope; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Anteriores" },
  { value: "all", label: "Todos" },
];
const STATUSES: AppointmentStatus[] = ["pendente", "confirmado", "concluido", "cancelado"];

export default function AppointmentsTab() {
  const [scope, setScope] = useState<Scope>("upcoming");
  const q = useQuery({
    queryKey: ["admin-appointments", scope],
    queryFn: () => apiGet<Appointment[]>(`/admin/appointments?scope=${scope}`),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AppointmentStatusUpdate }) => apiPatch<Appointment>(`/admin/appointments/${id}`, body),
    onSuccess: (a) => {
      toast.success(`Status alterado para ${STATUS_LABEL[a.status]}`);
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remind = useMutation({
    mutationFn: (id: string) => apiPost<DispatchLog>(`/admin/appointments/${id}/remind`),
    onSuccess: (log) => {
      if (!log.ok) toast.error(log.detail);
      else toast.success(log.mock ? "Lembrete gerado (envio SIMULADO)." : "Lembrete enviado ao cliente!");
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const rows = q.isError ? [] : (q.data ?? []);

  return (
    <div className="rounded-xl border border-line bg-panel" data-testid="admin-appointments">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setScope(s.value)}
              className={cn("rounded-full border px-3.5 py-1 text-sm transition-colors duration-200",
                scope === s.value ? "border-amber-500 bg-amber-500 text-black" : "border-line text-neutral-300 hover:border-amber-500/60")}
              data-testid={`admin-appointments-scope-${s.value}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-neutral-400" data-testid="admin-appointments-count">{rows.length} agendamento(s)</span>
      </div>

      {q.isLoading ? (
        <div className="flex items-center gap-2 p-8 text-neutral-400"><Loader2 className="size-4 animate-spin" /> Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-3 p-10 text-neutral-400" data-testid="admin-appointments-empty">
          <CalendarX2 className="size-6 text-amber-400" /> Nenhum agendamento neste filtro.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-line hover:bg-transparent">
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Agenda</TableHead>
              <TableHead>Lembrete</TableHead>
              <TableHead className="w-44">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id} className="border-line" data-testid={`admin-appointment-row-${a.id}`}>
                <TableCell className="font-mono text-sm">
                  <span className="text-white">{fmtDate(a.date)}</span>
                  <span className="block text-amber-300">{a.time}</span>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-white">{a.customer_name}</p>
                  <a
                    href={waLink(a.customer_phone.length <= 11 ? `55${a.customer_phone}` : a.customer_phone, `Olá ${a.customer_name.split(" ")[0]}, aqui é da Nadis Car sobre seu agendamento de ${fmtDate(a.date)} às ${a.time}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[#25D366] hover:underline"
                    data-testid={`admin-appointment-whatsapp-${a.id}`}
                  >
                    <SiWhatsapp size={12} /> {fmtPhone(a.customer_phone)}
                  </a>
                </TableCell>
                <TableCell className="text-sm">
                  <p className="text-neutral-200">{a.car_model}</p>
                  {a.car_plate && <p className="font-mono text-xs text-neutral-500">{a.car_plate}</p>}
                </TableCell>
                <TableCell className="max-w-56 text-sm">
                  <p className="whitespace-normal text-neutral-200">{a.service_name}</p>
                  {a.notes && <p className="mt-0.5 whitespace-normal text-xs text-neutral-500">{a.notes}</p>}
                </TableCell>
                <TableCell>
                  {a.gcal_event_id && a.status !== "cancelado" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300" title={a.gcal_event_id}>
                      <CalendarCheck className="size-3.5" /> {a.gcal_event_id.startsWith("mock-") ? "Registrado (simulado)" : "Google Agenda"}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {a.reminder_sent_at ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300" data-testid={`admin-appointment-reminder-status-${a.id}`}>
                      <BellRing className="size-3.5" /> {a.reminder_mock ? "Simulado" : "Enviado"}
                    </span>
                  ) : a.status === "pendente" || a.status === "confirmado" ? (
                    <Button size="xs" variant="outline" disabled={remind.isPending} onClick={() => remind.mutate(a.id)} data-testid={`admin-appointment-remind-${a.id}`}>
                      <Bell className="size-3" /> Enviar
                    </Button>
                  ) : (
                    <span className="text-xs text-neutral-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select value={a.status} onValueChange={(v: string) => update.mutate({ id: a.id, body: { status: v as AppointmentStatus } })}>
                    <SelectTrigger size="sm" className={cn("w-36 border", STATUS_CLASS[a.status])} data-testid={`admin-appointment-status-${a.id}`}>
                      <SelectValue>{(v) => STATUS_LABEL[v as AppointmentStatus]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} data-testid={`admin-status-option-${s}`}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
