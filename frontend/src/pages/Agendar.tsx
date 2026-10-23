import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import BookingWizard from "@/components/BookingWizard";

export default function Agendar() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-500/[0.07] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Agendamento online</p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl" data-testid="agendar-title">Reserve seu horário</h1>
          <p className="mt-3 max-w-2xl text-neutral-400">Escolha o serviço, o dia e o horário. Em três passos seu carro está na agenda da Nadis Car.</p>
          <div className="mt-10">
            <BookingWizard />
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
