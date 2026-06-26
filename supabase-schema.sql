-- Run this in the Supabase SQL editor

create table if not exists public.programmes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.programmes enable row level security;
create policy "Users own programmes" on public.programmes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.calendar_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  data jsonb not null
);
alter table public.calendar_events enable row level security;
create policy "Users own calendar events" on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.cardio_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null
);
alter table public.cardio_sessions enable row level security;
create policy "Users own cardio sessions" on public.cardio_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.strength_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null
);
alter table public.strength_sessions enable row level security;
create policy "Users own strength sessions" on public.strength_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
