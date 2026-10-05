-- Adds back "general" (Geral) as a 5th content_warning_level: a plain content
-- warning with no age check, between "none" and "18+". The previous
-- migration's CHECK only allowed ('none','18+','21+','25+') - replace it
-- rather than edit that already-applied migration.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_content_warning_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_content_warning_level_check
  CHECK (content_warning_level IN ('none', 'general', '18+', '21+', '25+'));
