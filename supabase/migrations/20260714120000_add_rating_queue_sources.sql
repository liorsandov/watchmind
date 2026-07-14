-- Preserve the collection that introduced a card to the rating flow.
alter type public.interaction_source add value if not exists 'trending';
alter type public.interaction_source add value if not exists 'popular';
