-- Structured WhatsApp fields for "button" links, so the admin edit UI no
-- longer has to reverse-engineer country code / phone / prefilled message by
-- regex-parsing a wa.me url on every load (see ButtonEditDrawer's old
-- initializer). `button_kind` distinguishes a "whatsapp" button from a plain
-- "link" one - kept separate from `link_type` (which already means
-- button/social/cards) so existing filters on that column are untouched.
-- `url` keeps being written as a real https://wa.me/... link alongside these,
-- so the public bio page renderer (which just does href={link.url}) needs no
-- changes.
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS button_kind text DEFAULT 'link',
  ADD COLUMN IF NOT EXISTS whatsapp_country_code text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text;
