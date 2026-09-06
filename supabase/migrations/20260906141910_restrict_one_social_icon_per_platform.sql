-- One-time cleanup: remove a known duplicate social icon before the
-- uniqueness constraint below is added.
--
-- Profile "jonas-mikael" had two active WhatsApp social links pointing to the
-- same number (https://wa.me/89981038990), created 2026-09-03 and
-- 2026-09-04. Per product owner decision, the newer duplicate is removed and
-- the original (2026-09-03) is kept.
DELETE FROM public.links
WHERE id = 'd4d3c18b-99f3-4cb1-858a-a20ae8b0ec74'
  AND link_type = 'social'
  AND icon = 'whatsapp-icon';

-- Restrict social links to at most one icon per platform per user.
--
-- Social platform identity is encoded in the `icon` column (e.g.
-- "instagram-icon", "whatsapp-icon"), there is no separate `platform` column.
-- This is scoped to link_type = 'social' only, so regular "button" links
-- (which may legitimately reuse the same icon across multiple entries) are
-- unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS links_one_icon_per_social_platform
ON public.links (user_id, icon)
WHERE link_type = 'social' AND icon IS NOT NULL;
