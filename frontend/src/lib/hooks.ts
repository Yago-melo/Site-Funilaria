import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { BusinessSettings, GalleryItem, SiteInfo } from "@/lib/types";

// Static fallback so the shell renders even with no backend (static preview).
export const FALLBACK_SETTINGS: BusinessSettings = {
  business_name: "Martelinho de Ouro Nadis Car",
  tagline: "Desamassamento sem pintura com acabamento de fábrica.",
  whatsapp_number: "5511999999999",
  owner_whatsapp: "5511999999999",
  whatsapp_message: "Olá! Gostaria de um orçamento de Martelinho de Ouro para o meu carro.",
  address: "Rua Exemplo, 123 - Centro",
  city: "São Paulo - SP",
  email: "contato@nadiscar.com.br",
  instagram: "",
  work_days: [0, 1, 2, 3, 4, 5],
  open_time: "08:00",
  close_time: "18:00",
  slot_step_min: 60,
  daily_summary_enabled: true,
  daily_summary_time: "07:30",
  reminder_enabled: true,
  reminder_time: "18:00",
};

export function useSite() {
  const q = useQuery({ queryKey: ["site"], queryFn: () => apiGet<SiteInfo>("/site") });
  const live = q.data && !q.isError ? q.data : undefined;
  return {
    ...q,
    settings: live?.settings ?? FALLBACK_SETTINGS,
    services: live?.services ?? [],
    today: live?.today,
  };
}

export function useGallery() {
  return useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryItem[]>("/gallery") });
}
