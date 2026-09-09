-- Verified badge toggle (Personalizar Design > Header): shows a small
-- verification badge next to the profile's display name. Free for any
-- shop owner to enable for now, no plan restriction - default false so
-- existing profiles are unaffected until a user opts in.
ALTER TABLE public.profiles
  ADD COLUMN show_verified_badge boolean NOT NULL DEFAULT false;
