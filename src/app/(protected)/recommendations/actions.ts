"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateCurrentRecommendations } from "@/lib/recommendations/generate";
import type { RecommendationSessionInput } from "@/lib/recommendations/model";
import { saveInteraction } from "@/lib/repositories/interactions";
import { recordRecommendationEvent } from "@/lib/repositories/recommendations";
import { saveWatchProgress } from "@/lib/repositories/watch-progress";
import type { Json } from "@/types/database";

const inputSchema = z.object({
  mediaType: z.enum(["movie", "tv"]).optional(),
  availableMinutes: z.number().int().min(15).max(600).optional(),
  mood: z.enum(["light", "tense", "thoughtful", "comfort"]).optional(),
  discovery: z.enum(["familiar", "adventurous"]).optional(),
  genreId: z.number().int().positive().optional(),
});

const actionSchema = z.object({
  contentId: z.string().uuid(),
  sessionId: z.string().uuid(),
  action: z.enum(["watchlist", "not_interested", "watched", "opened", "similar"]),
});

export async function generateRecommendationsAction(raw: RecommendationSessionInput) {
  return generateCurrentRecommendations(inputSchema.parse(raw));
}

export async function recommendationAction(raw: z.input<typeof actionSchema>) {
  const input = actionSchema.parse(raw);
  const eventType = {
    watchlist: "saved",
    not_interested: "dismissed",
    watched: "rated",
    opened: "opened",
    similar: "similar_requested",
  } as const;

  if (input.action === "watchlist") {
    await saveInteraction({ content_id: input.contentId, interaction_type: "interested", rating: null, source: "recommendation" });
  } else if (input.action === "not_interested") {
    await saveInteraction({ content_id: input.contentId, interaction_type: "not_interested", rating: null, source: "recommendation" });
  } else if (input.action === "watched") {
    await saveInteraction({ content_id: input.contentId, interaction_type: "watched_neutral", rating: null, source: "recommendation" });
    await saveWatchProgress({
      content_id: input.contentId,
      completed: true,
      progress_percent: 100,
      last_season_number: null,
      last_episode_number: null,
      last_watched_at: new Date().toISOString(),
    });
  }

  await recordRecommendationEvent({
    recommendation_session_id: input.sessionId,
    content_id: input.contentId,
    event_type: eventType[input.action],
    metadata: { action: input.action } as Json,
  });
  revalidatePath("/recommendations");
  revalidatePath("/history");
  revalidatePath("/watchlist");
  return { ok: true } as const;
}

export async function replaceRecommendationAction(raw: {
  contentId: string;
  sessionId: string;
  rejectedContentIds: string[];
  sessionInput: RecommendationSessionInput;
}) {
  const contentId = z.string().uuid().parse(raw.contentId);
  const sessionId = z.string().uuid().parse(raw.sessionId);
  const rejectedContentIds = z.array(z.string().uuid()).max(50).parse(raw.rejectedContentIds);
  const sessionInput = inputSchema.parse(raw.sessionInput);
  await recordRecommendationEvent({
    recommendation_session_id: sessionId,
    content_id: contentId,
    event_type: "replaced",
    metadata: { action: "replace", dislike: false } as Json,
  });
  return generateCurrentRecommendations(sessionInput, [...new Set([...rejectedContentIds, contentId])]);
}
