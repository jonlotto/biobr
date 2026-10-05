-- "Conteúdo sensível" (Configurações > Conteúdo sensível): an age-gate shown
-- on the public bio page before the real content, matching the gate a shop
-- owner can pick per profile. Default 'none' so existing profiles are
-- unaffected until a user opts in.
ALTER TABLE public.profiles
  ADD COLUMN content_warning_level text NOT NULL DEFAULT 'none';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_content_warning_level_check
  CHECK (content_warning_level IN ('none', '18+', '21+', '25+'));
