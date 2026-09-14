-- "Cards informativos" block: a new link_type ("cards") whose row holds an
-- array of small info cards (icon + text + optional background color)
-- instead of a single url/icon - rendered as a carousel on the public page.
-- Stored as jsonb on the existing links table so it reorders/toggles/deletes
-- exactly like any other link row; NULL for every row that isn't a cards
-- block.
ALTER TABLE public.links
  ADD COLUMN cards_data jsonb;
