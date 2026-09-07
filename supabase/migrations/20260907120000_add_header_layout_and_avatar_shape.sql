-- Header layout picker (Personalizar Design > Header): lets a user choose
-- how their avatar/banner/title are arranged, independent of the color
-- template. `header_layout` is left NULL by default (rather than defaulting
-- to 'classic') so existing profiles keep rendering exactly as they do today
-- - the app falls back to the template's own hasBanner flag when this is
-- NULL, and only starts reading this column once a user explicitly picks a
-- layout in the new UI.
ALTER TABLE public.profiles
  ADD COLUMN header_layout text,
  ADD COLUMN avatar_shape text NOT NULL DEFAULT 'rounded';
