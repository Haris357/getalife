-- getalife Database Schema
-- Run this in the Supabase SQL editor

-- ============================================================
-- GOALS
-- ============================================================
create table public.goals (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  description        text not null,
  status             text not null default 'active' check (status in ('active', 'completed')),
  roadmap            jsonb,
  current_streak     integer not null default 0,
  longest_streak     integer not null default 0,
  last_checkin_date  date,
  created_at         timestamptz default now()
);

alter table public.goals enable row level security;

create policy "users own goals"
  on public.goals
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- CHECK-INS
-- ============================================================
create table public.check_ins (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid references public.goals(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null default current_date,
  what_i_did   text not null,
  commitment   text not null,
  ai_response  text,
  created_at   timestamptz default now(),
  unique (goal_id, date)
);

alter table public.check_ins enable row level security;

create policy "users own check_ins"
  on public.check_ins
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- EMAIL LOGS
-- ============================================================
create table public.email_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid references auth.users(id) on delete cascade not null,
  goal_id  uuid references public.goals(id) on delete cascade not null,
  type     text not null,
  sent_at  timestamptz default now(),
  subject  text
);

alter table public.email_logs enable row level security;

create policy "users read own email logs"
  on public.email_logs
  for select
  using (auth.uid() = user_id);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  unsubscribed   boolean default false,
  created_at     timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users own profile"
  on public.profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- SUCCESS STORIES
-- ============================================================
create table public.stories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  goal_id      uuid references public.goals(id) on delete set null,
  name         text not null,
  tagline      text not null,
  body         text not null,
  image_url    text,
  published    boolean default false,
  created_at   timestamptz default now()
);

alter table public.stories enable row level security;

create policy "anyone can read published stories"
  on public.stories
  for select
  using (published = true);

create policy "users manage own stories"
  on public.stories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON NEW USER
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
