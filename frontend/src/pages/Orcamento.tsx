import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Camera, Check, ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { apiUpload, errorMessage } from "@/lib/api";
import type { QuotePublic } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX = 5;
const EMPTY = { customer_name: "", customer_phone: "", car_model: "", description: "" };

export default function Orcamento() {
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [done, setDone] = useState<QuotePublic | null>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const send = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("photos", f));
      return apiUpload<QuotePublic>("/quotes", fd);
    },
    onSuccess: (q) => { setDone(q); toast.success("Fotos enviadas! Em breve você recebe o orçamento."); },
    onError: (err) => toast.error(errorMessage(err, "Não foi possível enviar. Tente novamente.")),
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...imgs].slice(0, MAX));
  };
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = files.length > 0 && form.customer_name.trim().length >= 2 && form.customer_phone.replace(/\D/g, "").length >= 10 && form.car_model.trim().length >= 2;
  const trackUrl = done ? `/orcamento/${done.id}` : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-500/[0.07] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Orçamento por foto</p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl" data-testid="orcamento-title">Mande as fotos do amassado</h1>
          <p className="mt-3 max-w-2xl text-neutral-400">O funileiro avalia as fotos e responde com o valor. Depois é só agendar.</p>

          {done ? (
            <div className="mt-10 max-w-2xl rounded-2xl border border-emerald-500/30 bg-panel p-8" data-testid="quote-success">
              <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><Check className="size-7" /></span>
              <h2 className="mt-6 font-heading text-2xl font-bold text-white">Recebemos suas fotos, {done.customer_name.split(" ")[0]}!</h2>
              <p className="mt-2 text-neutral-400">O orçamento será enviado para o seu WhatsApp. Você também pode acompanhar por este link — guarde-o:</p>
              <div className="mt-4 break-all rounded-lg border border-line bg-[#0B0D11] p-3 font-mono text-sm text-amber-300" data-testid="quote-track-url">{window.location.origin}{trackUrl}</div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={trackUrl} className={cn(buttonVariants(), "h-11 px-5 font-semibold")} data-testid="quote-track-link">Acompanhar orçamento</Link>
                <Button variant="outline" className="h-11" onClick={() => { setDone(null); setForm(EMPTY); setFiles([]); }} data-testid="quote-new-button">Enviar outro</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (valid) send.mutate(); }} className="mt-10 grid items-start gap-8 lg:grid-cols-12" data-testid="quote-form">
              <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 lg:col-span-7">
                <Label className="text-base">Fotos do amassado * <span className="font-normal text-neutral-500">(até {MAX})</span></Label>
                <p className="mt-1 text-sm text-neutral-500">Dica: fotografe de perto e de lado, com a luz refletindo na lataria.</p>
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5" data-testid="quote-photo-previews">
                  {previews.map((src, i) => (
                    <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                      <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                      <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} aria-label="Remover foto"
                        className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white transition-colors duration-200 hover:bg-red-500" data-testid={`quote-photo-remove-${i}`}>
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {files.length < MAX && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-amber-500/50 text-amber-400 transition-colors duration-200 hover:bg-amber-500/5" data-testid="quote-photo-add">
                      <span className="flex flex-col items-center gap-1 text-xs">
                        {files.length === 0 ? <Camera className="size-6" /> : <ImagePlus className="size-6" />}
                        Adicionar
                      </span>
                      <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} data-testid="quote-photo-input" />
                    </label>
                  )}
                </div>
                <div className="mt-6 space-y-2">
                  <Label htmlFor="q-desc">Onde está o amassado?</Label>
                  <Textarea id="q-desc" value={form.description} onChange={set("description")} rows={3} maxLength={1000} placeholder="Ex.: porta traseira esquerda, amassado do tamanho de uma moeda" data-testid="quote-description-input" />
                </div>
              </div>
              <div className="space-y-5 rounded-2xl border border-line bg-elevated/70 p-6 sm:p-8 lg:col-span-5">
                <div className="space-y-2">
                  <Label htmlFor="q-name">Nome *</Label>
                  <Input id="q-name" value={form.customer_name} onChange={set("customer_name")} data-testid="quote-name-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-phone">WhatsApp *</Label>
                  <Input id="q-phone" inputMode="tel" value={form.customer_phone} onChange={set("customer_phone")} placeholder="(11) 99999-9999" data-testid="quote-phone-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-car">Modelo do carro *</Label>
                  <Input id="q-car" value={form.car_model} onChange={set("car_model")} placeholder="Ex.: Fiat Argo 2021 branco" data-testid="quote-car-input" />
                </div>
                <Button type="submit" className="h-11 w-full font-semibold" disabled={!valid || send.isPending} data-testid="quote-submit-button">
                  {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {send.isPending ? "Enviando fotos..." : "Pedir orçamento"}
                </Button>
                <p className="text-xs text-neutral-500">Suas fotos são vistas apenas pela oficina.</p>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
