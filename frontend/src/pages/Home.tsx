import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, CalendarCheck, Clock3, PaintBucket, ShieldCheck, Sparkles } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { buttonVariants } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import GalleryGrid from "@/components/GalleryGrid";
import { useSite } from "@/lib/hooks";
import { fmtDuration, waLink } from "@/lib/format";
import { cn } from "@/lib/utils";

const HERO_BG = "https://images.unsplash.com/photo-1708805282706-f44730b7e527?crop=entropy&cs=srgb&fm=jpg&q=80&w=2000";
const TEASER_BEFORE = "https://images.unsplash.com/photo-1673187139211-1e7ec3dd60ec?w=1200&q=80";
const TEASER_AFTER = "https://images.pexels.com/photos/29755711/pexels-photo-29755711.jpeg?auto=compress&cs=tinysrgb&w=1200";
const ABOUT_IMG = "https://images.pexels.com/photos/35149611/pexels-photo-35149611.jpeg?auto=compress&cs=tinysrgb&w=1200";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

const PERKS = [
  { icon: PaintBucket, title: "Pintura original", text: "Sem massa, sem lixa, sem repintura. O carro mantém a tinta de fábrica e o valor de revenda." },
  { icon: Clock3, title: "Rapidez", text: "A maioria dos reparos fica pronta no mesmo dia — você não fica dias sem o carro." },
  { icon: ShieldCheck, title: "Garantia", text: "Trabalho feito à mão, com ferramentas de precisão e garantia do serviço executado." },
];

const STEPS = [
  { n: "01", title: "Avaliação", text: "Mande fotos pelo WhatsApp ou traga o carro para avaliarmos o amassado." },
  { n: "02", title: "Agendamento", text: "Escolha o melhor dia e horário pelo site. Em segundos está reservado." },
  { n: "03", title: "Reparo DSP", text: "Desamassamos pelo lado interno da peça, com alavancas e luz de inspeção." },
  { n: "04", title: "Entrega", text: "Superfície alinhada, sem ondulações e com a pintura de fábrica intacta." },
];

const FALLBACK_SERVICES = [
  { id: "f1", name: "Martelinho de Ouro — Pequena Avaria", description: "Mossas de estacionamento, batidas de porta e pequenos amassados.", duration_min: 60, price_label: "A partir de R$ 150,00" },
  { id: "f2", name: "Martelinho de Ouro — Média Avaria / Vinco", description: "Vincos em paralamas, portas e capô, mantendo a pintura original.", duration_min: 120, price_label: "A partir de R$ 280,00" },
  { id: "f3", name: "Martelinho de Ouro — Granizo", description: "Recuperação completa de veículos atingidos por granizo.", duration_min: 240, price_label: "Orçamento sob avaliação" },
];

export default function Home() {
  const { settings, services } = useSite();
  const list = services.length ? services : FALLBACK_SERVICES;
  const wa = waLink(settings.whatsapp_number, settings.whatsapp_message);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section id="inicio" className="relative overflow-hidden" data-testid="hero-section">
        <img src={HERO_BG} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(11,13,17,0.96)_0%,rgba(11,13,17,0.85)_50%,rgba(11,13,17,0.6)_100%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-[#1E293B]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 animate-rise">
              <Sparkles className="size-3.5" /> Desamassamento sem pintura · DSP
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl animate-rise [animation-delay:80ms]" data-testid="hero-title">
              O amassado some.<br />
              <span className="bg-gradient-to-r from-amber-300 to-amber-600 bg-clip-text text-transparent">A pintura de fábrica fica.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-300 animate-rise [animation-delay:160ms]">
              {settings.business_name}: martelinho de ouro artesanal para portas, paralamas, capôs e granizo — com precisão milimétrica e sem repintura.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-rise [animation-delay:240ms]">
              <Link
                to="/agendar"
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base font-semibold transition-transform duration-200 hover:-translate-y-0.5")}
                data-testid="hero-agendar-button"
              >
                <CalendarCheck className="size-5" /> Agendar horário
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#25D366] px-6 text-base font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="hero-whatsapp-button"
              >
                <SiWhatsapp size={18} /> Falar no WhatsApp
              </a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[["100%", "tinta original"], ["1 dia", "na maioria dos reparos"], ["0", "massa ou lixa"]].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-mono text-2xl font-semibold text-amber-400">{v}</dt>
                  <dd className="mt-1 text-xs text-neutral-400">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/60 backdrop-blur-md">
              <BeforeAfterSlider before={TEASER_BEFORE} after={TEASER_AFTER} alt="Reparo de paralama" className="aspect-[4/3] rounded-xl" testId="hero-before-after" />
              <div className="flex items-center justify-between px-2 pb-1 pt-3">
                <p className="text-sm text-neutral-300">Arraste para comparar</p>
                <span className="font-mono text-[11px] uppercase tracking-widest text-amber-400">Antes / Depois</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" data-testid="services-section">
        <div className="grid gap-12 lg:grid-cols-12">
          <motion.div {...fadeUp} className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Serviços</p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Especialistas em Martelinho de Ouro</h2>
            <p className="mt-4 leading-relaxed text-neutral-400">
              Técnica que devolve a forma original da lataria trabalhando pelo lado de dentro da peça. Sem repintura, sem diferença de tonalidade.
            </p>
            <Link to="/agendar" className="mt-6 inline-flex items-center gap-2 font-semibold text-amber-400 hover:underline" data-testid="services-agendar-link">
              Reservar um horário <ArrowRight className="size-4" />
            </Link>
          </motion.div>
          <div className="space-y-4 lg:col-span-8">
            {list.map((s, i) => (
              <motion.div
                key={s.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="group grid gap-4 rounded-xl border border-line bg-panel p-6 transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-amber-500/60 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                data-testid={`service-card-${s.id}`}
              >
                <span className="font-mono text-sm text-amber-400">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white">{s.name}</h3>
                  <p className="mt-1 text-sm text-neutral-400">{s.description}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-amber-300">{s.price_label}</p>
                  <p className="font-mono text-xs text-neutral-500">~{fmtDuration(s.duration_min)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PERKS.map((p, i) => (
            <motion.div key={p.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="border-l-2 border-amber-500/70 pl-5">
              <p.icon className="size-6 text-amber-400" />
              <h3 className="mt-3 font-heading text-lg font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TRABALHOS */}
      <section id="trabalhos" className="border-y border-line bg-[#0E1117] py-24" data-testid="gallery-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <motion.div {...fadeUp}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Galeria de trabalhos</p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Fotos e vídeos de quem confia na Nadis Car</h2>
            </motion.div>
            <p className="max-w-sm text-sm text-neutral-400">Arraste os comparativos de antes e depois e assista aos vídeos do processo.</p>
          </div>
          <GalleryGrid />
        </div>
      </section>

      {/* PROCESSO */}
      <section id="processo" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" data-testid="process-section">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <motion.div {...fadeUp} className="relative lg:col-span-5">
            <img src={ABOUT_IMG} alt="Funileiro realizando martelinho de ouro" className="aspect-[4/5] w-full rounded-2xl object-cover" />
            <div className="absolute -bottom-6 -right-4 rounded-xl border border-line bg-elevated/95 p-5 shadow-2xl backdrop-blur sm:-right-8">
              <p className="font-mono text-3xl font-semibold text-amber-400">DSP</p>
              <p className="text-xs text-neutral-400">Desamassamento sem pintura</p>
            </div>
          </motion.div>
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Como funciona</p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Do orçamento à entrega, sem complicação</h2>
            <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <motion.li key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
                  <span className="font-mono text-sm text-amber-400">{s.n}</span>
                  <h3 className="mt-2 font-heading text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">{s.text}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1A202C] to-[#0B0D11] p-8 sm:p-12" data-testid="cta-section">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">Seu carro merece voltar ao original.</h2>
              <p className="mt-2 text-neutral-400">Agende online em menos de 1 minuto ou mande as fotos do amassado no WhatsApp para um orçamento.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/agendar" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 font-semibold")} data-testid="cta-agendar-button">
                <CalendarCheck className="size-5" /> Agendar
              </Link>
              <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#25D366]/60 px-6 font-semibold text-[#25D366] transition-colors duration-200 hover:bg-[#25D366]/10" data-testid="cta-whatsapp-button">
                <SiWhatsapp size={18} /> WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
