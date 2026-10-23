// Hand-written mirrors of the backend Pydantic models — keep in sync with backend/models/*.py.

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  price_label: string;
}

export interface ServiceCreate {
  name: string;
  description: string;
  duration_min: number;
  price_label: string;
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  owner_whatsapp: string;
  whatsapp_message: string;
  address: string;
  city: string;
  email: string;
  instagram: string;
  work_days: number[]; // 0 = segunda ... 6 = domingo
  open_time: string;
  close_time: string;
  slot_step_min: number;
  daily_summary_enabled: boolean;
  daily_summary_time: string;
}

export interface SiteInfo {
  settings: BusinessSettings;
  services: Service[];
  today: string;
}

export interface GalleryItem {
  id: string;
  type: "image" | "video";
  title: string;
  category: string;
  description: string;
  media_url: string;
  before_url: string | null;
  created_at: string;
}

export type AppointmentStatus = "pendente" | "confirmado" | "concluido" | "cancelado";

export interface AppointmentCreate {
  service_id: string;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  car_model: string;
  car_plate: string;
  notes: string;
}

export interface Appointment {
  id: string;
  service_id: string;
  service_name: string;
  duration_min: number;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  car_model: string;
  car_plate: string;
  notes: string;
  status: AppointmentStatus;
  gcal_event_id: string | null;
  created_at: string;
}

export interface AppointmentStatusUpdate {
  status: AppointmentStatus;
}

export interface Availability {
  date: string;
  open: boolean;
  slots: string[];
}

export interface BookingResult {
  appointment: Appointment;
  whatsapp_url: string;
  calendar_synced: boolean;
  calendar_mocked: boolean;
}

export interface AdminStats {
  today: string;
  today_count: number;
  upcoming_count: number;
  pending_count: number;
  gallery_count: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AdminUser {
  email: string;
}

export interface SessionInfo {
  authenticated: boolean;
  email: string | null;
}

export interface DispatchLog {
  id: string;
  date: string;
  kind: string;
  recipient: string;
  count: number;
  preview: string;
  sent_at: string;
  mock: boolean;
  ok: boolean;
  detail: string;
}

export interface WhatsAppStatus {
  configured: boolean;
  mode: string;
  template_name: string;
  recipient: string;
  daily_enabled: boolean;
  daily_time: string;
  last_dispatch: DispatchLog | null;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  status: string;
}

export interface CalendarStatus {
  connected: boolean;
  mocked: boolean;
  events_created: number;
  recent_events: CalendarEvent[];
}

export interface IntegrationsStatus {
  whatsapp: WhatsAppStatus;
  google_calendar: CalendarStatus;
}
