"use server";

import { z } from "zod";
import {
  saveNewRatingInteraction,
  undoRatingInteraction,
} from "@/lib/repositories/interactions";
import { getTmdbService } from "@/lib/tmdb/service";

const saveSchema = z.object({
  interactionType: z.enum([
    "watched_liked",
    "watched_disliked",
    "watched_neutral",
    "interested",
    "not_interested",
    "skipped",
    "unsure",
  ]),
  mediaType: z.enum(["movie", "tv"]),
  source: z.enum(["trending", "popular"]),
  tmdbId: z.number().int().positive(),
});

const undoSchema = z.string().uuid();

export type RatingActionResult =
  | { ok: true; interactionId: string; alreadySaved?: boolean }
  | { ok: false; message: string };

export async function saveRatingAction(
  rawInput: z.input<typeof saveSchema>,
): Promise<RatingActionResult> {
  const input = saveSchema.safeParse(rawInput);
  if (!input.success) {
    return { ok: false, message: "That rating request was not valid." };
  }

  try {
    const tmdb = getTmdbService();
    const item =
      input.data.mediaType === "movie"
        ? await tmdb.getMovieDetails(input.data.tmdbId)
        : await tmdb.getTvDetails(input.data.tmdbId);
    const saved = await saveNewRatingInteraction(item, {
      interaction_type: input.data.interactionType,
      source: input.data.source,
    });

    const result: RatingActionResult = {
      ok: true,
      interactionId: saved.id,
    };
    if (saved.alreadySaved) result.alreadySaved = true;
    return result;
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && error.message.includes("already been classified")
          ? error.message
          : "We couldn’t save that answer. Nothing changed—please try again.",
    };
  }
}

export async function undoRatingAction(
  interactionId: string,
): Promise<RatingActionResult> {
  const parsedId = undoSchema.safeParse(interactionId);
  if (!parsedId.success) {
    return { ok: false, message: "That undo request was not valid." };
  }

  try {
    await undoRatingInteraction(parsedId.data);
    return { ok: true, interactionId: parsedId.data };
  } catch {
    return {
      ok: false,
      message: "We couldn’t undo that answer. Your saved rating is unchanged.",
    };
  }
}
