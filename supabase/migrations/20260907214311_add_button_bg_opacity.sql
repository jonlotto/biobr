-- Button background opacity (Personalizar Design > Cores), applied as the
-- alpha channel of `global_button_bg_color` when rendering (rgba), so a
-- solid color can be dialed down to semi-transparent - e.g. over a banner
-- image. Left NULL by default (rather than defaulting to 100) so existing
-- profiles keep rendering their button background fully opaque exactly as
-- before, and the app only starts reading this column once a user
-- explicitly drags the slider - see EditorProfile.globalButtonBgOpacity.
ALTER TABLE public.profiles
  ADD COLUMN global_button_bg_opacity integer;
