import "server-only";

import { getContentItems } from "@/lib/repositories/content-items";
import { listAllCurrentInteractions } from "@/lib/repositories/interactions";
import { saveTasteProfileSnapshot } from "@/lib/repositories/taste-profiles";
import type { TasteProfileSourceItem } from "@/lib/taste/model";
import { calculateTasteProfile } from "@/lib/taste/scoring";

export async function recalculateCurrentTasteProfile() {
  const interactions = await listAllCurrentInteractions();
  const contentItems = await getContentItems(
    interactions.map((interaction) => interaction.content_id),
  );
  const contentById = new Map(contentItems.map((item) => [item.id, item]));
  const sourceItems: TasteProfileSourceItem[] = interactions.flatMap(
    (interaction) => {
      const content = contentById.get(interaction.content_id);
      if (!content) return [];
      return [
        {
          interactionId: interaction.id,
          interactionType: interaction.interaction_type,
          rating: interaction.rating,
          title: content.title,
          mediaType: content.media_type,
          genreIds: content.genre_ids,
          releaseDate: content.release_date,
          originalLanguage: content.original_language,
          runtimeMinutes: content.runtime_minutes,
          popularity: content.popularity,
        },
      ];
    },
  );
  const profile = calculateTasteProfile(sourceItems);
  const snapshot = await saveTasteProfileSnapshot(profile);
  return { profile, snapshot };
}
