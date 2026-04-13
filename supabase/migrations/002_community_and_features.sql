-- Migration 002: Community feature + goal updates
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run)

-- ============================================================
-- EMAIL LOGS: make goal_id nullable (welcome emails have no goal)
-- ============================================================
alter table public.email_logs alter column goal_id drop not null;

-- ============================================================
-- GOALS: add deadline column + paused status
-- ============================================================
alter table public.goals add column if not exists deadline timestamptz;

alter table public.goals drop constraint if exists goals_status_check;
alter table public.goals add constraint goals_status_check
  check (status in ('active', 'completed', 'paused'));

-- ============================================================
-- CHECK-INS: add media + social links (may already exist)
-- ============================================================
alter table public.check_ins add column if not exists media_url text;
alter table public.check_ins add column if not exists social_links jsonb;

-- ============================================================
-- STORIES: add social_links (may already exist)
-- ============================================================
alter table public.stories add column if not exists social_links jsonb;

-- ============================================================
-- PROFILES: add game fields + display_name
-- ============================================================
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists title text not null default 'Beginner';
alter table public.profiles add column if not exists streak_shields integer not null default 0;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;

-- Allow public read of profiles for community author info
drop policy if exists "anyone reads profiles" on public.profiles;
create policy "anyone reads profiles"
  on public.profiles for select using (true);

-- ============================================================
-- ACHIEVEMENTS (may already exist)
-- ============================================================
create table if not exists public.achievements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  type       text not null,
  earned_at  timestamptz default now(),
  metadata   jsonb,
  unique (user_id, type)
);

alter table public.achievements enable row level security;

drop policy if exists "users read own achievements" on public.achievements;
create policy "users read own achievements"
  on public.achievements for select using (auth.uid() = user_id);

drop policy if exists "service can insert achievements" on public.achievements;
create policy "service can insert achievements"
  on public.achievements for insert with check (true);

-- ============================================================
-- COMMUNITY: POSTS
-- ============================================================
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  body          text,
  image_url     text,
  type          text not null default 'text' check (type in ('text', 'image', 'milestone')),
  goal_id       uuid references public.goals(id) on delete set null,
  score         integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.posts enable row level security;

drop policy if exists "anyone reads posts" on public.posts;
create policy "anyone reads posts"
  on public.posts for select using (true);

drop policy if exists "users create posts" on public.posts;
create policy "users create posts"
  on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "users update own posts" on public.posts;
create policy "users update own posts"
  on public.posts for update using (auth.uid() = user_id);

drop policy if exists "users delete own posts" on public.posts;
create policy "users delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY: COMMENTS
-- ============================================================
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.posts(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  body        text not null,
  score       integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.comments enable row level security;

drop policy if exists "anyone reads comments" on public.comments;
create policy "anyone reads comments"
  on public.comments for select using (true);

drop policy if exists "users create comments" on public.comments;
create policy "users create comments"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "users update own comments" on public.comments;
create policy "users update own comments"
  on public.comments for update using (auth.uid() = user_id);

drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY: POST VOTES
-- ============================================================
create table if not exists public.post_votes (
  post_id   uuid references public.posts(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  value     integer not null check (value in (1, -1)),
  primary key (post_id, user_id)
);

alter table public.post_votes enable row level security;

drop policy if exists "anyone reads post votes" on public.post_votes;
create policy "anyone reads post votes"
  on public.post_votes for select using (true);

drop policy if exists "users manage own post votes" on public.post_votes;
create policy "users manage own post votes"
  on public.post_votes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY: COMMENT VOTES
-- ============================================================
create table if not exists public.comment_votes (
  comment_id  uuid references public.comments(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  value       integer not null check (value in (1, -1)),
  primary key (comment_id, user_id)
);

alter table public.comment_votes enable row level security;

drop policy if exists "anyone reads comment votes" on public.comment_votes;
create policy "anyone reads comment votes"
  on public.comment_votes for select using (true);

drop policy if exists "users manage own comment votes" on public.comment_votes;
create policy "users manage own comment votes"
  on public.comment_votes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY: SAVED POSTS
-- ============================================================
create table if not exists public.saved_posts (
  post_id   uuid references public.posts(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  saved_at  timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.saved_posts enable row level security;

drop policy if exists "users manage own saved posts" on public.saved_posts;
create policy "users manage own saved posts"
  on public.saved_posts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS: auto-update score + comment_count
-- ============================================================

create or replace function public.update_post_score()
returns trigger language plpgsql as $$
begin
  update public.posts
  set score = (
    select coalesce(sum(value), 0)
    from public.post_votes
    where post_id = coalesce(NEW.post_id, OLD.post_id)
  )
  where id = coalesce(NEW.post_id, OLD.post_id);
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists post_vote_change on public.post_votes;
create trigger post_vote_change
  after insert or update or delete on public.post_votes
  for each row execute function public.update_post_score();

create or replace function public.update_comment_score()
returns trigger language plpgsql as $$
begin
  update public.comments
  set score = (
    select coalesce(sum(value), 0)
    from public.comment_votes
    where comment_id = coalesce(NEW.comment_id, OLD.comment_id)
  )
  where id = coalesce(NEW.comment_id, OLD.comment_id);
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists comment_vote_change on public.comment_votes;
create trigger comment_vote_change
  after insert or update or delete on public.comment_votes
  for each row execute function public.update_comment_score();

create or replace function public.update_comment_count()
returns trigger language plpgsql as $$
begin
  update public.posts
  set comment_count = (
    select count(*) from public.comments
    where post_id = coalesce(NEW.post_id, OLD.post_id)
  )
  where id = coalesce(NEW.post_id, OLD.post_id);
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists comment_count_change on public.comments;
create trigger comment_count_change
  after insert or delete on public.comments
  for each row execute function public.update_comment_count();

-- ============================================================
-- VIEWS: posts + comments with author info
-- ============================================================
drop view if exists public.posts_with_authors;
create view public.posts_with_authors as
select
  p.*,
  pr.display_name,
  pr.avatar_url  as author_avatar,
  pr.level       as author_level,
  pr.title       as author_title
from public.posts p
left join public.profiles pr on pr.id = p.user_id;

drop view if exists public.comments_with_authors;
create view public.comments_with_authors as
select
  c.*,
  pr.display_name,
  pr.avatar_url  as author_avatar,
  pr.level       as author_level,
  pr.title       as author_title
from public.comments c
left join public.profiles pr on pr.id = c.user_id;
