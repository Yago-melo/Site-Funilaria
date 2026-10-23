import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { CalendarCheck, CalendarDays, Car, Check, ChevronLeft, ChevronRight, Clock, Loader2, Wrench } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import { useSite } from "@/lib/hooks";
import { fmtDate, fmtDuration, parseIso } from "@/lib/format";
import type { AppointmentCreate, Availability, BookingResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

const STEP_LABELS = ["Serviço", "Data e horário", "Seus dados"];

const EMPTY_FORM = { customer_name: "", customer_phone: "", car_model: "", car_plate: "", notes: "" };

export default function BookingWizard() {
  const { services, settings, today, isError } = useSite();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<BookingResult | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const dateIso = date ? format(date, "yyyy-MM-dd") : "";

  const todayDate = useMemo(() => (today ? parseIso(today) : new Date()), [today]);
  const maxDate = useMemo(() => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + 60);
    return d;
  }, [todayDate]);

  const slotsQ = useQuery({
    queryKey: ["availability", dateIso, serviceId],
    queryFn: () => apiGet<Availability>(`/availability?date=${dateIso}&service_id=${serviceId}`),
    enabled: Boolean(dateIso && serviceId),
  });

  const book = useMutation({
    mutationFn: (body: AppointmentCreate) => apiPost<BookingResult>("/appointments", body),
    onSuccess: (res) => {
      setResult(res);
      toast.success("Agendamento confirmado!");
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const phoneDigits = form.customer_phone.replace(/\D/g, "");
  const formValid = form.customer_name.trim().length >= 2 && phoneDigits.length >= 10 && form.car_model.trim().length >= 2;
  const canNext = step === 0 ? Boolean(service) : step === 1 ? Boolean(dateIso && time) : formValid;

  function submit() {
    if (!service || !dateIso || !time) return;
    book.mutate({ service_id: service.id, date: dateIso, time, ...form, customer_phone: phoneDigits });
  }

  function reset() {
    setResult(null);
    setStep(0);
    setServiceId("");
    setDate(undefined);
    setTime("");
    setForm(EMPTY_FORM);
  }

  if (result) {
    const a = result.appointment;
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-500/30 bg-panel p-8 sm:p-10" data-testid="booking-success">
        <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check className="size-7" />
        </span>
        <h2 className="mt-6 font-heading text-3xl font-bold text-white">Horário reservado, {a.customer_name.split(" ")[0]}!</h2>
        <p className="mt-2 text-neutral-400">Seu agendamento foi registrado na agenda da oficina. Envie a confirmação pelo WhatsApp para o funileiro já receber os detalhes.</p>
        <dl className="mt-8 grid gap-4 rounded-xl border border-line bg-[#0B0D11] p-5 sm:grid-cols-2" data-testid="booking-success-details">
          <div><dt className="text-xs uppercase tracking-widest text-neutral-500">Serviço</dt><dd className="mt-1 font-medium text-white">{a.service_name}</dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-neutral-500">Data</dt><dd className="mt-1 font-mono text-amber-300" data-testid="booking-success-datetime">{fmtDate(a.date)} às {a.time}</dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-neutral-500">Veículo</dt><dd className="mt-1 text-white">{a.car_model} {a.car_plate}</dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-neutral-500">Agenda</dt><dd className="mt-1 flex items-center gap-2 text-emerald-300"><CalendarCheck className="size-4" /> Adicionado à agenda</dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={result.whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-5 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5" data-testid="booking-success-whatsapp-button">
            <SiWhatsapp size={17} /> Enviar confirmação no WhatsApp
          </a>
          <Button variant="outline" className="h-11" onClick={reset} data-testid="booking-new-button">Fazer outro agendamento</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 lg:col-span-8" data-testid="booking-wizard">
        {/* Step indicator */}
        <ol className="mb-8 flex items-center gap-2" data-testid="booking-steps">
          {STEP_LABELS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border font-mono text-xs transition-colors duration-200",
                i < step ? "border-amber-500 bg-amber-500 text-black" : i === step ? "border-amber-500 text-amber-400" : "border-line text-neutral-500")}>
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm sm:inline", i === step ? "font-semibold text-white" : "text-neutral-500")}>{label}</span>
              {i < STEP_LABELS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-amber-500" : "bg-line")} />}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div className="space-y-3" data-testid="booking-step-service">
                <h2 className="font-heading text-xl font-semibold text-white">Qual serviço você precisa?</h2>
                {services.length === 0 && (
                  <p className="text-sm text-neutral-400" data-testid="booking-services-empty">
                    {isError ? "Não foi possível carregar os serviços agora. Tente novamente em instantes ou fale pelo WhatsApp." : "Carregando serviços..."}
                  </p>
                )}
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setServiceId(s.id); setTime(""); }}
                    className={cn("flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-[border-color,background-color] duration-200",
                      serviceId === s.id ? "border-amber-500 bg-amber-500/10" : "border-line hover:border-amber-500/50")}
                    data-testid={`booking-service-option-${s.id}`}
                  >
                    <Wrench className={cn("mt-0.5 size-5 shrink-0", serviceId === s.id ? "text-amber-400" : "text-neutral-500")} />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="mt-1 text-sm text-neutral-400">{s.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-300">{s.price_label}</p>
                      <p className="font-mono text-xs text-neutral-500">~{fmtDuration(s.duration_min)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div data-testid="booking-step-datetime">
                <h2 className="mb-5 font-heading text-xl font-semibold text-white">Escolha o dia e o horário</h2>
                <div className="grid gap-6 md:grid-cols-[auto_1fr]">
                  <div className="rounded-xl border border-line bg-[#0B0D11] p-2" data-testid="booking-calendar">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => { setDate(d); setTime(""); }}
                      locale={ptBR}
                      defaultMonth={date ?? todayDate}
                      startMonth={todayDate}
                      endMonth={maxDate}
                      disabled={[{ before: todayDate }, { after: maxDate }, (d: Date) => !settings.work_days.includes((d.getDay() + 6) % 7)]}
                    />
                  </div>
                  <div>
                    {!dateIso ? (
                      <p className="flex items-center gap-2 text-sm text-neutral-400"><CalendarDays className="size-4 text-amber-400" /> Selecione uma data no calendário.</p>
                    ) : slotsQ.isLoading ? (
                      <p className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 className="size-4 animate-spin" /> Buscando horários...</p>
                    ) : slotsQ.isError ? (
                      <p className="text-sm text-red-400" data-testid="booking-slots-error">Não foi possível carregar os horários.</p>
                    ) : !slotsQ.data?.open || slotsQ.data.slots.length === 0 ? (
                      <p className="text-sm text-neutral-400" data-testid="booking-slots-empty">Sem horários livres neste dia. Tente outra data.</p>
                    ) : (
                      <>
                        <p className="mb-3 text-sm text-neutral-400">Horários livres em <span className="font-mono text-amber-300">{fmtDate(dateIso)}</span></p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" data-testid="booking-slots">
                          {slotsQ.data.slots.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setTime(s)}
                              className={cn("rounded-md border py-2.5 font-mono text-sm transition-colors duration-200",
                                time === s ? "border-amber-500 bg-amber-500 text-black" : "border-line text-neutral-200 hover:border-amber-500/60")}
                              data-testid={`booking-slot-${s.replace(":", "")}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5" data-testid="booking-step-details">
                <h2 className="font-heading text-xl font-semibold text-white">Seus dados e do veículo</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="b-name">Nome completo *</Label>
                    <Input id="b-name" value={form.customer_name} onChange={set("customer_name")} placeholder="Ex.: João Silva" data-testid="booking-name-input" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-phone">WhatsApp / Telefone *</Label>
                    <Input id="b-phone" inputMode="tel" value={form.customer_phone} onChange={set("customer_phone")} placeholder="(11) 99999-9999" data-testid="booking-phone-input" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-car">Modelo do carro *</Label>
                    <Input id="b-car" value={form.car_model} onChange={set("car_model")} placeholder="Ex.: Honda Civic 2020 prata" data-testid="booking-car-input" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-plate">Placa</Label>
                    <Input id="b-plate" value={form.car_plate} onChange={set("car_plate")} placeholder="ABC1D23" maxLength={10} data-testid="booking-plate-input" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-notes">Descreva o amassado (opcional)</Label>
                  <Textarea id="b-notes" value={form.notes} onChange={set("notes")} placeholder="Ex.: amassado na porta traseira direita, sem trinca na pintura" maxLength={500} data-testid="booking-notes-input" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0} data-testid="booking-back-button">
            <ChevronLeft className="size-4" /> Voltar
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="h-10 px-5 font-semibold" data-testid="booking-next-button">
              Continuar <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={!canNext || book.isPending} className="h-10 px-5 font-semibold" data-testid="booking-submit-button">
              {book.isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />} Confirmar agendamento
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4" data-testid="booking-summary">
        <div className="rounded-2xl border border-line bg-elevated/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Resumo</p>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3"><Wrench className="size-4 shrink-0 text-amber-400" /><span className={service ? "text-white" : "text-neutral-500"} data-testid="booking-summary-service">{service?.name ?? "Serviço não escolhido"}</span></li>
            <li className="flex gap-3"><CalendarDays className="size-4 shrink-0 text-amber-400" /><span className={dateIso ? "font-mono text-white" : "text-neutral-500"} data-testid="booking-summary-date">{dateIso ? fmtDate(dateIso) : "Data"}</span></li>
            <li className="flex gap-3"><Clock className="size-4 shrink-0 text-amber-400" /><span className={time ? "font-mono text-white" : "text-neutral-500"} data-testid="booking-summary-time">{time || "Horário"}{service && time ? ` · ~${fmtDuration(service.duration_min)}` : ""}</span></li>
            <li className="flex gap-3"><Car className="size-4 shrink-0 text-amber-400" /><span className={form.car_model ? "text-white" : "text-neutral-500"}>{form.car_model || "Veículo"}</span></li>
          </ul>
        </div>
        <p className="px-1 text-xs leading-relaxed text-neutral-500">
          Atendimento {settings.open_time}–{settings.close_time}. Após confirmar, o horário entra direto na agenda do funileiro.
        </p>
      </aside>
    </div>
  );
}
