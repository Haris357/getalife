-- Migration 005: All features — categories, milestones, activity feed,
-- daily missions, buddies, challenges, goal DNA, anonymous posts
-- Run in Supabase SQL Editor → New query → paste → Run

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. GOALS — category column
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. POSTS — anonymous flag
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- Rebuild posts_with_authors view to include is_anonymous
DROP VIEW IF EXISTS posts_with_authors;
CREATE VIEW posts_with_authors AS
SELECT
  p.id, p.user_id, p.title, p.body, p.image_url, p.type, p.goal_id,
  p.score, p.comment_count, p.created_at, p.updated_at,
  p.pinned, p.removed, p.locked, p.flair, p.removed_reason, p.is_anonymous,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.display_name END AS display_name,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.avatar_url END   AS author_avatar,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.level END        AS author_level,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.title END        AS author_title
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. PROFILES — goal DNA
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_dna    TEXT,
  ADD COLUMN IF NOT EXISTS goal_dna_at TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. MILESTONES — track streak milestone celebrations
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id      UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,   -- '7_day','14_day','21_day','30_day','60_day','100_day'
  streak_count INT  NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, type)
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_own" ON milestones FOR ALL USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. ACTIVITY FEED — public real-time check-in stream
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_feed (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,   -- 'checkin','milestone','goal_completed'
  goal_id       UUID REFERENCES goals(id) ON DELETE CASCADE,
  display_name  TEXT,            -- cached at event time
  goal_snippet  TEXT,            -- short goal excerpt
  streak        INT,
  day_number    INT,
  category      TEXT,
  is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_public_select" ON activity_feed FOR SELECT USING (true);
CREATE POLICY "activity_own_insert"    ON activity_feed FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "activity_admin_insert"  ON activity_feed FOR INSERT WITH CHECK (true);  -- service role

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. DAILY MISSIONS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS daily_missions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  missions   JSONB NOT NULL,   -- string[]
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, date)
);

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_own" ON daily_missions FOR ALL USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. GOAL BUDDY SYSTEM
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS buddies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buddy_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  buddy_goal_id     UUID REFERENCES goals(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','declined')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, buddy_id),
  CHECK(requester_id <> buddy_id)
);

ALTER TABLE buddies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buddies_select" ON buddies FOR SELECT USING (requester_id = auth.uid() OR buddy_id = auth.uid());
CREATE POLICY "buddies_insert" ON buddies FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "buddies_update" ON buddies FOR UPDATE USING (requester_id = auth.uid() OR buddy_id = auth.uid());
CREATE POLICY "buddies_delete" ON buddies FOR DELETE USING (requester_id = auth.uid() OR buddy_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. COMMUNITY CHALLENGES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  duration_days INT NOT NULL DEFAULT 30,
  start_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date      TIMESTAMPTZ NOT NULL,
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id   UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id        UUID REFERENCES goals(id) ON DELETE SET NULL,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkins_done  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (challenge_id, user_id)
);

ALTER TABLE challenges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_public_select"  ON challenges FOR SELECT USING (true);
CREATE POLICY "challenges_mod_insert"     ON challenges FOR INSERT WITH CHECK (is_mod());
CREATE POLICY "challenges_mod_update"     ON challenges FOR UPDATE USING (is_mod());
CREATE POLICY "challenges_mod_delete"     ON challenges FOR DELETE USING (is_mod());

CREATE POLICY "cp_public_select"  ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "cp_auth_insert"    ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cp_self_update"    ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cp_self_delete"    ON challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. VIEWS
-- ══════════════════════════════════════════════════════════════════════════════

-- Available buddies (users with active goals, not already buddied)
CREATE OR REPLACE VIEW available_buddies AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  p.level,
  p.title,
  g.id          AS goal_id,
  g.description AS active_goal,
  g.current_streak
FROM profiles p
JOIN goals g ON g.user_id = p.id AND g.status = 'active'
WHERE p.display_name IS NOT NULL;

-- Challenge leaderboard
CREATE OR REPLACE VIEW challenge_leaderboard AS
SELECT
  cp.challenge_id,
  cp.user_id,
  cp.checkins_done,
  cp.joined_at,
  p.display_name,
  p.avatar_url,
  p.level,
  p.title,
  RANK() OVER (PARTITION BY cp.challenge_id ORDER BY cp.checkins_done DESC) AS rank
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id;

-- Public goals board
CREATE OR REPLACE VIEW public_goals AS
SELECT
  g.id,
  g.description,
  g.category,
  g.current_streak,
  g.created_at,
  g.deadline,
  g.pledge,
  p.display_name,
  p.avatar_url,
  p.level,
  p.title
FROM goals g
JOIN profiles p ON p.id = g.user_id
WHERE g.is_public = TRUE AND g.status = 'active'
ORDER BY g.current_streak DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. REALTIME — enable on activity_feed for live community ticker
-- ══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase dashboard → Database → Replication → enable for activity_feed
-- ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
-- (Uncomment if running via psql directly, or do it in the dashboard)
