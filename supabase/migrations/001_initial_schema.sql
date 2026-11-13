-- DRISHTI — Initial PostgreSQL / Supabase Schema & Row Level Security
-- Run via Supabase SQL Editor or `supabase db push`

create extension if not exists "pgcrypto";

-- Helper trigger for automatic updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 1. User Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'kn', 'hi')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. User Preferences (Speech, Display, Accessibility, Offline)
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  language text not null default 'en' check (language in ('en', 'kn', 'hi')),
  theme text not null default 'navy' check (theme in ('navy', 'light', 'high-contrast')),
  text_scale text not null default 'standard' check (text_scale in ('standard', 'large', 'xl')),
  speech_rate numeric(3, 2) not null default 1.00 check (speech_rate >= 0.50 and speech_rate <= 2.00),
  preferred_voice_uri text,
  auto_speak_results boolean not null default true,
  haptic_feedback boolean not null default true,
  reduced_motion boolean not null default false,
  offline_ocr_only boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();

alter table public.user_preferences enable row level security;

create policy "Users manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Trusted Contacts for Emergency SOS
create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  phone text not null check (char_length(trim(phone)) between 5 and 30),
  relationship text not null default 'Family',
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_trusted_contacts_user_id on public.trusted_contacts (user_id);

create trigger trusted_contacts_updated_at
  before update on public.trusted_contacts
  for each row execute function public.handle_updated_at();

alter table public.trusted_contacts enable row level security;

create policy "Users manage their own trusted contacts"
  on public.trusted_contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Explicit User Consents (Privacy by Design)
create table if not exists public.user_consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  camera_consent boolean not null default false,
  microphone_consent boolean not null default false,
  location_share_consent boolean not null default false,
  cloud_ai_consent boolean not null default false,
  sos_location_consent boolean not null default false,
  consent_updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_consents enable row level security;

create policy "Users manage their own consents"
  on public.user_consents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Document Metadata (Learning Assistant & OCR History — stores metadata/summaries only, no raw private images)
create table if not exists public.document_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  source_type text not null check (source_type in ('ocr_scan', 'uploaded_text', 'uploaded_pdf', 'manual_note')),
  language text not null default 'en' check (language in ('en', 'kn', 'hi')),
  extracted_text text,
  summary_text text,
  word_count integer not null default 0 check (word_count >= 0),
  storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_document_metadata_user_created on public.document_metadata (user_id, created_at desc);

create trigger document_metadata_updated_at
  before update on public.document_metadata
  for each row execute function public.handle_updated_at();

alter table public.document_metadata enable row level security;

create policy "Users manage their own document metadata"
  on public.document_metadata for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Usage Events (Privacy-respecting non-PII feature usage metrics)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_name text not null,
  status text not null check (status in ('success', 'uncertain', 'offline_fallback', 'error')),
  language text not null default 'en',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_usage_events_user_created on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

create policy "Users can view and insert their own usage events"
  on public.usage_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own usage events"
  on public.usage_events for insert
  with check (auth.uid() = user_id);
