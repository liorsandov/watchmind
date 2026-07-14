"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteInteraction, saveInteraction } from "@/lib/repositories/interactions";
import { deleteWatchProgress, saveWatchProgress } from "@/lib/repositories/watch-progress";

const interactionTypes = ["watched_liked", "watched_disliked", "watched_neutral", "interested", "not_interested", "skipped", "unsure"] as const;

export async function updateLibraryItemAction(formData: FormData) {
  const contentId = z.string().uuid().parse(formData.get("contentId"));
  const intent = z.enum(["update", "remove", "watched"]).parse(formData.get("intent"));
  if (intent === "remove") {
    await Promise.all([deleteInteraction(contentId), deleteWatchProgress(contentId)]);
  } else if (intent === "watched") {
    await saveInteraction({ content_id: contentId, interaction_type: "watched_neutral", rating: null, source: "history" });
    await saveWatchProgress({ content_id: contentId, completed: true, progress_percent: 100, last_season_number: null, last_episode_number: null, last_watched_at: new Date().toISOString() });
  } else {
    const interactionType = z.enum(interactionTypes).parse(formData.get("interactionType"));
    const rawRating = String(formData.get("rating") ?? "");
    const rating = rawRating ? z.coerce.number().int().min(1).max(10).parse(rawRating) : null;
    await saveInteraction({ content_id: contentId, interaction_type: interactionType, rating: interactionType.startsWith("watched_") ? rating : null, source: "history" });
  }
  revalidatePath("/history");
  revalidatePath("/watchlist");
  revalidatePath("/discover");
}
