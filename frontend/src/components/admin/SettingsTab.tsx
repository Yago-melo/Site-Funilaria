import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiPost, apiPut, errorMessage } from "@/lib/api";
import { useSite } from "@/lib/hooks";
import { queryClient } from "@/lib/queryClient";
import { WEEKDAYS, fmtDuration } from "@/lib/format";
import type { BusinessSettings, Service, ServiceCreate } from "@/lib/types";

type TextKey = "business_name" | "tagline" | "whatsapp_number" | "owner_whatsapp" | "whatsapp_message" | "address" | "city" | "email" | "instagram" | "open_time" | "close_time" | "daily_summary_time" | "reminder_time";

function Field({ label, k, form, set, hint, type = "text" }: {
  label: string; k: TextKey; form: BusinessSettings; set: (k: TextKey, v: string) => void; hint?: string; type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`s-${k}`}>{label}</Label>
      <Input id={`s-${k}`} type={type} value={form[k]} onChange={(e) => set(k, e.target.value)} data-testid={`settings-${k.replace(/_/g, "-")}-input`} />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function SettingsForm({ initial }: { initial: BusinessSettings }) {
  const [form, setForm] = useState<BusinessSettings>(initial);
  const set = (k: TextKey, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: (body: BusinessSettings) => apiPut<BusinessSettings>("/admin/settings", body),
    onSuccess: () => { toast.success("Configurações salvas!"); queryClient.invalidateQueries({ queryKey: ["site"] }); queryClient.invalidateQueries({ queryKey: ["integrations"] }); },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const toggleDay = (d: number, on: boolean) =>
    setForm((f) => ({ ...f, work_days: on ? [...f.work_days, d].sort() : f.work_days.filter((x) => x !== d) }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate({ ...form, whatsapp_number: form.whatsapp_number.replace(/\D/g, ""), owner_whatsapp: form.owner_whatsapp.replace(/\D/g, "") }); }}
      className="space-y-8 rounded-xl border border-line bg-panel p-6" data-testid="settings-form">
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">Negócio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da oficina" k="business_name" form={form} set={set} />
          <Field label="E-mail" k="email" form={form} set={set} />
          <Field label="Endereço" k="address" form={form} set={set} />
          <Field label="Cidade" k="city" form={form} set={set} />
          <Field label="Instagram" k="instagram" form={form} set={set} hint="Ex.: @nadiscar (opcional)" />
          <Field label="Frase de apresentação" k="tagline" form={form} set={set} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">WhatsApp</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp de atendimento (botões do site)" k="whatsapp_number" form={form} set={set} hint="Com DDI e DDD, só números. Ex.: 5511987654321" />
          <Field label="WhatsApp do funileiro (resumo diário)" k="owner_whatsapp" form={form} set={set} hint="Número que recebe a agenda do dia." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-msg">Mensagem inicial do botão WhatsApp</Label>
          <Textarea id="s-msg" value={form.whatsapp_message} onChange={(e) => set("whatsapp_message", e.target.value)} rows={2} data-testid="settings-whatsapp-message-input" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">Horários e agenda</h2>
        <div>
          <Label>Dias de atendimento</Label>
          <div className="mt-3 flex flex-wrap gap-4" data-testid="settings-work-days">
            {WEEKDAYS.map((d, i) => (
              <label key={d} className="flex items-center gap-2 text-sm text-neutral-200">
                <Checkbox checked={form.work_days.includes(i)} onCheckedChange={(c) => toggleDay(i, Boolean(c))} data-testid={`settings-day-${i}`} /> {d}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Abre às" k="open_time" type="time" form={form} set={set} />
          <Field label="Fecha às" k="close_time" type="time" form={form} set={set} />
          <div className="space-y-2">
            <Label htmlFor="s-step">Intervalo entre horários (min)</Label>
            <Input id="s-step" type="number" min={15} max={240} step={15} value={form.slot_step_min} onChange={(e) => setForm((f) => ({ ...f, slot_step_min: Number(e.target.value) }))} data-testid="settings-slot-step-input" />
          </div>
          <Field label="Envio do resumo diário" k="daily_summary_time" type="time" form={form} set={set} />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-200">
          <Checkbox checked={form.daily_summary_enabled} onCheckedChange={(c) => setForm((f) => ({ ...f, daily_summary_enabled: Boolean(c) }))} data-testid="settings-daily-enabled-checkbox" />
          Enviar automaticamente a agenda do dia pelo WhatsApp
        </label>
        <div className="grid items-end gap-4 sm:grid-cols-4">
          <Field label="Lembrete ao cliente (véspera)" k="reminder_time" type="time" form={form} set={set} />
          <label className="flex items-center gap-2 pb-2 text-sm text-neutral-200 sm:col-span-3">
            <Checkbox checked={form.reminder_enabled} onCheckedChange={(c) => setForm((f) => ({ ...f, reminder_enabled: Boolean(c) }))} data-testid="settings-reminder-enabled-checkbox" />
            Enviar lembrete pelo WhatsApp ao cliente no dia anterior ao agendamento
          </label>
        </div>
      </section>

      <Button type="submit" className="h-10 px-6 font-semibold" disabled={save.isPending} data-testid="settings-save-button">
        {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar configurações
      </Button>
    </form>
  );
}

const EMPTY_SERVICE: ServiceCreate = { name: "", description: "", duration_min: 60, price_label: "" };

function ServicesPanel({ services }: { services: Service[] }) {
  const [form, setForm] = useState<ServiceCreate>(EMPTY_SERVICE);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["site"] });

  const create = useMutation({
    mutationFn: (body: ServiceCreate) => apiPost<Service>("/admin/services", body),
    onSuccess: () => { toast.success("Serviço adicionado."); setForm(EMPTY_SERVICE); refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/admin/services/${id}`),
    onSuccess: () => { toast.success("Serviço removido."); refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="space-y-5 rounded-xl border border-line bg-panel p-6" data-testid="services-panel">
      <h2 className="font-heading text-lg font-semibold text-white">Serviços</h2>
      <ul className="space-y-2">
        {services.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-line p-3" data-testid={`services-item-${s.id}`}>
            <div>
              <p className="text-sm font-medium text-white">{s.name}</p>
              <p className="text-xs text-neutral-500">{fmtDuration(s.duration_min)} · {s.price_label || "sem preço"}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Remover ${s.name}`} className="text-neutral-400 hover:text-red-400"
              onClick={() => { if (window.confirm("Remover este serviço?")) remove.mutate(s.id); }} data-testid={`services-delete-${s.id}`}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim().length >= 2) create.mutate(form); }} className="space-y-3 border-t border-line pt-5" data-testid="services-create-form">
        <Input placeholder="Nome do serviço" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} data-testid="services-name-input" />
        <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} data-testid="services-description-input" />
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" min={15} step={15} placeholder="Duração (min)" value={form.duration_min} onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))} data-testid="services-duration-input" />
          <Input placeholder="Preço (ex.: A partir de R$ 150)" value={form.price_label} onChange={(e) => setForm((f) => ({ ...f, price_label: e.target.value }))} data-testid="services-price-input" />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={create.isPending || form.name.trim().length < 2} data-testid="services-add-button">
          <Plus className="size-4" /> Adicionar serviço
        </Button>
      </form>
    </div>
  );
}

export default function SettingsTab() {
  const { data, isLoading, isError, settings, services } = useSite();
  if (isLoading) return <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="size-4 animate-spin" /> Carregando...</div>;
  if (isError || !data) return <p className="text-red-400" data-testid="settings-error">Não foi possível carregar as configurações.</p>;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8"><SettingsForm key={JSON.stringify(settings)} initial={settings} /></div>
      <div className="lg:col-span-4"><ServicesPanel services={services} /></div>
    </div>
  );
}
