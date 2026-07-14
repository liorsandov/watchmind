import assert from "node:assert/strict";
import test from "node:test";
import type { TasteProfileSourceItem } from "@/lib/taste/model";
import { INTERACTION_WEIGHTS, calculateTasteProfile } from "@/lib/taste/scoring";

function item(index: number, values: Partial<TasteProfileSourceItem> = {}): TasteProfileSourceItem {
  return {
    interactionId: `interaction-${index}`,
    interactionType: "watched_liked",
    rating: null,
    title: `Title ${index}`,
    mediaType: "movie",
    genreIds: [80],
    releaseDate: "2018-01-01",
    originalLanguage: "en",
    runtimeMinutes: 105,
    popularity: 70,
    ...values,
  };
}

test("documents the required interaction weight hierarchy", () => {
  assert.equal(INTERACTION_WEIGHTS.watched_liked, 3);
  assert.equal(INTERACTION_WEIGHTS.watched_disliked, -3);
  assert.equal(INTERACTION_WEIGHTS.interested, 1.5);
  assert.equal(INTERACTION_WEIGHTS.not_interested, -1.5);
  assert.equal(INTERACTION_WEIGHTS.watched_neutral, 0);
  assert.equal(INTERACTION_WEIGHTS.skipped, 0);
  assert.equal(INTERACTION_WEIGHTS.unsure, 0);
});

test("a crime-film fan develops positive genre and movie signals", () => {
  const profile = calculateTasteProfile(Array.from({ length: 6 }, (_, index) => item(index + 1)));
  assert.equal(profile.confidence, "medium");
  assert.equal(profile.dimensions.genres[0]?.label, "Crime");
  assert.equal(profile.dimensions.genres[0]?.sentiment, "positive");
  assert.equal(profile.dimensions.mediaTypes[0]?.sentiment, "positive");
  assert.match(profile.explanations.join(" "), /tend to like crime/i);
});

test("a TV viewer's repeated dislikes become strong negative signals", () => {
  const profile = calculateTasteProfile(
    Array.from({ length: 5 }, (_, index) => item(index + 1, {
      interactionType: "watched_disliked",
      mediaType: "tv",
      genreIds: [18, 36],
      runtimeMinutes: 55,
      popularity: 12,
    })),
  );
  assert.equal(profile.dimensions.genres[0]?.sentiment, "negative");
  assert.equal(profile.dimensions.mediaTypes[0]?.key, "tv");
  assert.equal(profile.dimensions.mediaTypes[0]?.sentiment, "negative");
  assert.equal(profile.dimensions.popularity[0]?.key, "less-mainstream");
  assert.equal(profile.strongSignals.negative.length, 5);
});

test("one reaction is shrunk toward neutral instead of overfitting", () => {
  const profile = calculateTasteProfile([item(1, { genreIds: [878] })]);
  assert.equal(profile.confidence, "low");
  assert.equal(profile.dimensions.genres[0]?.sentiment, "unknown");
});

test("skip and unsure do not affect preference direction or confidence", () => {
  const profile = calculateTasteProfile([
    item(1, { interactionType: "skipped" }),
    item(2, { interactionType: "unsure" }),
  ]);
  assert.equal(profile.informativeInteractionCount, 0);
  assert.equal(profile.confidence, "low");
  assert.equal(profile.dimensions.genres[0]?.score, 0);
  assert.equal(profile.dimensions.genres[0]?.sentiment, "unknown");
});

test("watched likes are stronger than the same number of interested signals", () => {
  const liked = calculateTasteProfile(Array.from({ length: 3 }, (_, index) => item(index + 1)));
  const interested = calculateTasteProfile(
    Array.from({ length: 3 }, (_, index) => item(index + 1, { interactionType: "interested" })),
  );
  assert.ok((liked.dimensions.genres[0]?.score ?? 0) > (interested.dimensions.genres[0]?.score ?? 0));
});

test("confidence reaches high only after enough informative data", () => {
  const profile = calculateTasteProfile(
    Array.from({ length: 15 }, (_, index) => item(index + 1, {
      interactionType: index % 2 === 0 ? "watched_neutral" : "interested",
    })),
  );
  assert.equal(profile.confidence, "high");
});

test("recalculation is deterministic and idempotent", () => {
  const source = [
    item(2, { interactionType: "not_interested" }),
    item(1, { genreIds: [35, 18] }),
  ];
  const first = calculateTasteProfile(source);
  const second = calculateTasteProfile([...source].reverse());
  assert.deepEqual(second, first);
  assert.equal(second.sourceFingerprint, first.sourceFingerprint);
});
