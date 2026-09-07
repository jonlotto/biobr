-- Button layout picker (Personalizar Design > Botões): lets a user choose how
-- the list of link buttons is structured/composed (single divided card,
-- overlapping alternating icons, or a pill with a fixed square/round icon),
-- independent of the existing per-button style/shape/color settings.
-- Left NULL by default (rather than defaulting to a specific layout) so
-- existing profiles keep rendering exactly as they do today - the app falls
-- back to "pill-square-icon" (today's look) when this is NULL, and only
-- starts reading this column once a user explicitly picks a layout.
ALTER TABLE public.profiles
  ADD COLUMN button_layout text;
