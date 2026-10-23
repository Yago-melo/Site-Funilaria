# Martelinho de Ouro Nadis Car — SPEC

Site for a paintless-dent-repair shop (pt-BR). Stack: FastAPI + MongoDB (backend), React 19 + Vite + Tailwind v4 + shadcn (frontend).

## Pages
- `/` Home: hero (Agendar + WhatsApp CTAs, before/after slider), Serviços (from DB), Galeria (photos/videos, filter Todos/Fotos/Vídeos, dialog viewer), Como funciona, CTA, footer/contato, floating WhatsApp button (wa.me link built from settings.whatsapp_number).
- `/agendar`: 3-step wizard (serviço → data+horário → dados) → POST /api/appointments → success screen with wa.me confirmation link.
- `/orcamento`: customer sends 1-5 dent photos + name/phone/car → POST /api/quotes (multipart, photos stored PRIVATE, admin-only via /api/media). Success shows tracking link `/orcamento/:id` (GET /api/quotes/{id}, no photos/phone).
- Home `#avaliacoes`: approved reviews (GET /api/reviews → average/count/items) + dialog form POST /api/reviews (status pendente until approved).
- `/admin`: admin login (email+password from env). `/admin/painel`: stats + tabs Agendamentos (status + Lembrete column/manual send) / Orçamentos (reply price+message, wa.me reply, statuses novo|respondido|agendado|arquivado) / Avaliações (approve/reject/delete) / Galeria (upload) / Integrações / Configurações.

## Data model (Mongo collections)
- settings (single doc id="business"): BusinessSettings (business_name, whatsapp_number, owner_whatsapp, work_days [0=Mon], open_time, close_time, slot_step_min, daily_summary_enabled, daily_summary_time, ...)
- services: Service {id, name, description, duration_min, price_label}
- gallery: GalleryItem {id, type image|video, title, category, description, media_url, before_url, created_at, is_deleted}
- media_files: {storage_path, content_type, size, is_deleted} — files in Emergent Object Storage, served by GET /api/media/{path} (Range supported)
- appointments: {id, service_id, service_name, duration_min, date YYYY-MM-DD, time HH:MM (America/Sao_Paulo local), customer_*, car_model, car_plate, notes, status pendente|confirmado|concluido|cancelado, gcal_event_id}
- calendar_events: MOCKED Google Calendar events
- whatsapp_logs: dispatch history (kind auto|manual|reminder|reminder_manual)
- quotes: {id, customer_name, customer_phone, car_model, description, photos[], status, price_quote, owner_reply, created_at, replied_at}
- reviews: {id, customer_name, rating 1-5, comment, car_model, status pendente|aprovado|rejeitado, created_at}
- google_tokens: {id='owner', email, access_token, refresh_token, expires_at}

## Integrations
- WhatsApp click-to-chat: wa.me links (real).
- WhatsApp Business Cloud API (Meta): lib/whatsapp.py. Needs WHATSAPP_ACCESS_TOKEN + numeric WHATSAPP_PHONE_NUMBER_ID; otherwise **MOCKED** (logged, marked SIMULADO). Template mode default: template `agenda_do_dia` pt_BR with params {{1}} date, {{2}} list.
  Daily loop (lib/scheduler.py) sends once/day after settings.daily_summary_time (kind="auto"); manual: POST /api/admin/integrations/whatsapp/send-today.
- Customer reminder: day before at settings.reminder_time (default 18:00) via scheduler run_reminders → lib/whatsapp.send_reminder (template `lembrete_agendamento` params name,date,time,service); marks reminder_sent_at/reminder_mock. Manual: POST /api/admin/appointments/{id}/remind. MOCKED while Meta creds missing.
- Google Calendar: real OAuth (lib/gcal.py, routers/google.py) when GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET set and owner connected (GET /api/admin/google/connect → Google → GET /api/google/callback → /admin/painel?google=ok). Tokens in db.google_tokens. Otherwise **MOCKED** (ids `mock-gcal-*`). All events mirrored in db.calendar_events with provider google|mock. Credentials NOT yet provided → currently mocked.

## Booking rules
Slots from open_time to close_time stepping slot_step_min; slot must fit service duration, not overlap active (pendente/confirmado) appointments, not be in the past (APP_TZ), day in work_days, within 60 days. Conflict → 409.

## Auth
Single admin from env ADMIN_EMAIL/ADMIN_PASSWORD; JWT httpOnly cookie `nadis_session`. All /api/admin/* require it.

## Seed
`python seed.py`: 3 services (svc-pequena 60min, svc-media 120min, svc-granizo 240min), 5 gallery images (gal-1 has before/after).
