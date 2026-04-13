-- 003_community_moderation.sql

-- Add columns to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS removed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flair TEXT,
  ADD COLUMN IF NOT EXISTS removed_reason TEXT;

-- Add columns to comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS removed BOOLEAN NOT NULL DEFAULT FALSE;

-- community_settings (singleton)
CREATE TABLE IF NOT EXISTS community_settings (
  id INT PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'r/getalife',
  description TEXT NOT NULL DEFAULT 'one community · one focus · do the work',
  cover_url TEXT,
  avatar_url TEXT,
  rules_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- community_rules
CREATE TABLE IF NOT EXISTS community_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- community_moderators
CREATE TABLE IF NOT EXISTS community_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- community_bans
CREATE TABLE IF NOT EXISTS community_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- post_reports
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- comment_reports
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post_comment','comment_reply','post_pinned','post_removed','comment_removed')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE community_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: is current user a mod?
CREATE OR REPLACE FUNCTION is_mod()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_moderators WHERE user_id = auth.uid()
  );
$$;

-- community_settings
CREATE POLICY "settings_public_select" ON community_settings FOR SELECT USING (true);
CREATE POLICY "settings_mod_update" ON community_settings FOR UPDATE USING (is_mod());

-- community_rules
CREATE POLICY "rules_public_select" ON community_rules FOR SELECT USING (true);
CREATE POLICY "rules_mod_insert" ON community_rules FOR INSERT WITH CHECK (is_mod());
CREATE POLICY "rules_mod_update" ON community_rules FOR UPDATE USING (is_mod());
CREATE POLICY "rules_mod_delete" ON community_rules FOR DELETE USING (is_mod());

-- community_moderators
CREATE POLICY "mods_public_select" ON community_moderators FOR SELECT USING (true);

-- community_bans
CREATE POLICY "bans_mod_all" ON community_bans FOR ALL USING (is_mod());
CREATE POLICY "bans_self_select" ON community_bans FOR SELECT USING (user_id = auth.uid());

-- post_reports
CREATE POLICY "post_reports_auth_insert" ON post_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_reports_mod_select" ON post_reports FOR SELECT USING (is_mod());
CREATE POLICY "post_reports_mod_update" ON post_reports FOR UPDATE USING (is_mod());

-- comment_reports
CREATE POLICY "comment_reports_auth_insert" ON comment_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comment_reports_mod_select" ON comment_reports FOR SELECT USING (is_mod());
CREATE POLICY "comment_reports_mod_update" ON comment_reports FOR UPDATE USING (is_mod());

-- notifications
CREATE POLICY "notifications_owner_all" ON notifications FOR ALL USING (user_id = auth.uid());

-- Mods can update posts (pin/remove/lock)
CREATE POLICY "posts_mod_update" ON posts FOR UPDATE USING (is_mod());

-- Mods can update/delete comments
CREATE POLICY "comments_mod_update" ON comments FOR UPDATE USING (is_mod());
CREATE POLICY "comments_mod_delete" ON comments FOR DELETE USING (is_mod());

-- ── Update posts_with_authors view ─────────────────────────────────────────────

DROP VIEW IF EXISTS posts_with_authors;
CREATE VIEW posts_with_authors AS
SELECT
  p.id,
  p.user_id,
  p.title,
  p.body,
  p.image_url,
  p.type,
  p.goal_id,
  p.score,
  p.comment_count,
  p.created_at,
  p.updated_at,
  p.pinned,
  p.removed,
  p.locked,
  p.flair,
  p.removed_reason,
  pr.display_name,
  pr.avatar_url AS author_avatar,
  pr.level AS author_level,
  pr.title AS author_title
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id;

-- ── Initial data ───────────────────────────────────────────────────────────────

INSERT INTO community_settings (id, name, description)
VALUES (1, 'r/getalife', 'one community · one focus · do the work')
ON CONFLICT (id) DO NOTHING;

INSERT INTO community_rules (title, description, display_order) VALUES
('be real', 'share your actual progress — no fake wins, no fake failures', 1),
('support over judgment', 'people here are doing the work, same as you. lift them up.', 2),
('stay on topic', 'posts should relate to goals, accountability, growth, or the journey', 3),
('no spam or self-promo', 'do not use this community to promote products, courses, or services', 4),
('respect the process', 'everyone is at a different point. respect where they are.', 5)
ON CONFLICT DO NOTHING;

INSERT INTO community_moderators (user_id)
SELECT id FROM auth.users WHERE email = 'harisimran7857@gmail.com'
ON CONFLICT DO NOTHING;
