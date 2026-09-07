-- Icon color variant (Biblioteca de Ícones tabs: "Colorido"/"Escuro"/"Claro"),
-- chosen per-link alongside `icon` and independent of it - the brand color a
-- "si-*" icon renders in is looked up from its value, but which of
-- brand/dark/light variant is showing is a user choice that can't be derived
-- from the icon value alone.
-- Left NULL by default (rather than defaulting to "brand") so existing rows,
-- and any row saved with no explicit choice, fall back to "brand" at render
-- time - see getLinkIconEntry/EditorLink.iconVariant in the app.
ALTER TABLE public.links
  ADD COLUMN icon_variant text;
