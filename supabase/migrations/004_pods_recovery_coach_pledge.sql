-- Migration 004: Accountability Pods, Streak Recovery, Coach Mode, Public Pledges
-- Run in Supabase SQL Editor → New query → paste → Run

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. FIX notifications type constraint to allow email-type notifications
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. GOALS: public pledge support
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS is_public  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pledge     TEXT;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. PROFILES: coach opt-in flag + pattern analysis storage
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_coach BOOLEAN NOT NULL DEFAULT FALSE;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. CHECK-IN PATTERN ANALYSIS (stored per goal)
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS pattern_analysis      TEXT,
  ADD COLUMN IF NOT EXISTS pattern_analyzed_at   TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. ACCOUNTABILITY PODS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code  TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 6)),
  max_members  INT NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id     UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pod_id, user_id)
);

ALTER TABLE pods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;

-- pods: visible to members and creator
CREATE POLICY "pods_member_select"  ON pods FOR SELECT USING (
  created_by = auth.uid()
  OR id IN (SELECT pod_id FROM pod_members WHERE user_id = auth.uid())
);
CREATE POLICY "pods_auth_insert"    ON pods FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "pods_creator_update" ON pods FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "pods_creator_delete" ON pods FOR DELETE USING (auth.uid() = created_by);

-- pod_members: members see their own pods
CREATE POLICY "pod_members_member_select" ON pod_members FOR SELECT USING (
  pod_id IN (SELECT pod_id FROM pod_members WHERE user_id = auth.uid())
  OR pod_id IN (SELECT id FROM pods WHERE created_by = auth.uid())
);
CREATE POLICY "pod_members_auth_insert" ON pod_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pod_members_self_delete" ON pod_members FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. STREAK RECOVERY CHALLENGES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recovery_challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id        UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_date    TIMESTAMPTZ NOT NULL,  -- 3 days from started_at
  checkins_done  INT NOT NULL DEFAULT 0,
  completed      BOOLEAN NOT NULL DEFAULT FALSE,
  failed         BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE recovery_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovery_own_all" ON recovery_challenges FOR ALL USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. COACH RELATIONSHIPS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS coach_relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coachee_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, coachee_id),
  CHECK (coach_id <> coachee_id)
);

ALTER TABLE coach_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_rel_select"  ON coach_relationships FOR SELECT USING (
  coach_id = auth.uid() OR coachee_id = auth.uid()
);
CREATE POLICY "coach_rel_insert"  ON coach_relationships FOR INSERT WITH CHECK (coachee_id = auth.uid());
CREATE POLICY "coach_rel_delete"  ON coach_relationships FOR DELETE USING (
  coach_id = auth.uid() OR coachee_id = auth.uid()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. VIEW: pods with member count + creator display name
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW pods_with_members AS
SELECT
  p.*,
  pr.display_name AS creator_name,
  pr.avatar_url   AS creator_avatar,
  (SELECT COUNT(*) FROM pod_members pm WHERE pm.pod_id = p.id)::INT AS member_count
FROM pods p
LEFT JOIN profiles pr ON pr.id = p.created_by;

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. VIEW: available coaches (is_coach=true, not already coaching you)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW available_coaches AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  p.level,
  p.title,
  p.xp,
  (SELECT COUNT(*) FROM coach_relationships cr WHERE cr.coach_id = p.id)::INT AS coachee_count
FROM profiles p
WHERE p.is_coach = TRUE;
