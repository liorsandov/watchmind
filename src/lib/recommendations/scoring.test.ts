import assert from "node:assert/strict";
import test from "node:test";
import type { RecommendationInteractionItem, RecommendationSourceItem } from "@/lib/recommendations/model";
import { generateRecommendations } from "@/lib/recommendations/scoring";
import { calculateTasteProfile } from "@/lib/taste/scoring";
import type { TasteProfileSourceItem } from "@/lib/taste/model";
import type { InteractionType, MediaType } from "@/types/database";

function tasteItem(
  index: number,
  values: Partial<TasteProfileSourceItem> = {},
): TasteProfileSourceItem {
  return {
    interactionId: `interaction-${index}`,
    interactionType: "watched_liked",
    rating: null,
    title: `Known ${index}`,
    mediaType: "movie",
    genreIds: [80],
    releaseDate: "2018-01-01",
    originalLanguage: "en",
    runtimeMinutes: 104,
    popularity: 50,
    ...values,
  };
}

function candidate(
  index: number,
  values: Partial<RecommendationSourceItem> = {},
): RecommendationSourceItem {
  return {
    contentId: `content-${index}`,
    tmdbId: 1000 + index,
    mediaType: "movie",
    title: `Candidate ${index}`,
    overview: "A complete enough overview for deterministic recommendation tests.",
    genreIds: [80],
    releaseDate: "2020-01-01",
    originalLanguage: "en",
    runtimeMinutes: 110,
    popularity: 45,
    voteAverage: 7.4,
    voteCount: 500,
    ...values,
  };
}

function interaction(
  index: number,
  interactionType: InteractionType,
  values: Partial<RecommendationInteractionItem> = {},
): RecommendationInteractionItem {
  return {
    contentId: `known-${index}`,
    tmdbId: 2000 + index,
    mediaType: "movie",
    title: `Known ${index}`,
    interactionType,
    genreIds: [80],
    releaseDate: "2018-01-01",
    originalLanguage: "en",
    ...values,
  };
}

function run(
  taste: TasteProfileSourceItem[],
  candidates: RecommendationSourceItem[],
  interactions: RecommendationInteractionItem[] = [],
) {
  return generateRecommendations({
    tasteProfile: calculateTasteProfile(taste),
    interactions,
    candidates,
    rejectedContentIds: ["content-rejected"],
  });
}

test("new user with little data still gets transparent low-confidence categories", () => {
  const output = run([], [
    candidate(1, { genreIds: [878], popularity: 35 }),
    candidate(2, { mediaType: "tv", genreIds: [18], popularity: 55 }),
    candidate(3, { genreIds: [35], popularity: 25 }),
  ]);

  assert.equal(output.recommendations.length, 3);
  assert.ok(output.recommendations.some((result) => result.category === "Something Different"));
  assert.ok(output.recommendations.every((result) => result.confidence === "low"));
  assert.match(output.recommendations[0]?.reasons.join(" ") ?? "", /lower confidence/i);
});

test("user with strong genre preferences gets a safe match and human reasons", () => {
  const taste = Array.from({ length: 6 }, (_, index) =>
    tasteItem(index + 1, { genreIds: [80, 53] }),
  );
  const output = run(taste, [
    candidate(1, { title: "Crime One", genreIds: [80, 53], voteAverage: 8.1 }),
    candidate(2, { title: "Space One", genreIds: [878] }),
    candidate(3, { title: "Drama One", genreIds: [18] }),
  ]);

  assert.equal(output.recommendations[0]?.category, "Safe Match");
  assert.match(output.recommendations[0]?.reasons.join(" ") ?? "", /crime|thriller/i);
  assert.ok(
    output.recommendations[0]?.signals.some((signal) => signal.key === "genre"),
  );
});

test("conflicting signals penalize candidates close to disliked titles", () => {
  const taste = [
    ...Array.from({ length: 5 }, (_, index) =>
      tasteItem(index + 1, { genreIds: [878], title: `Liked sci-fi ${index}` }),
    ),
    ...Array.from({ length: 5 }, (_, index) =>
      tasteItem(index + 20, {
        interactionType: "watched_disliked",
        genreIds: [27],
        title: `Disliked horror ${index}`,
      }),
    ),
  ];
  const interactions = [
    interaction(1, "watched_liked", { genreIds: [878] }),
    interaction(2, "watched_disliked", { genreIds: [27] }),
  ];
  const output = run(taste, [
    candidate(1, { title: "Clean sci-fi", genreIds: [878], voteAverage: 7.2 }),
    candidate(2, { title: "Horror sci-fi", genreIds: [878, 27], voteAverage: 8.4 }),
    candidate(3, { title: "Drama option", genreIds: [18], voteAverage: 7.8 }),
  ], interactions);

  assert.equal(output.recommendations[0]?.item.title, "Clean sci-fi");
  assert.ok(
    output.recommendations
      .flatMap((result) => result.signals)
      .some((signal) => signal.key === "similar-disliked" && signal.score < 0),
  );
});

test("mostly skipped items avoid overfitting but still explore", () => {
  const taste = Array.from({ length: 8 }, (_, index) =>
    tasteItem(index + 1, {
      interactionType: index === 0 ? "interested" : "skipped",
      genreIds: [35],
    }),
  );
  const output = run(taste, [
    candidate(1, { genreIds: [35], mediaType: "movie" }),
    candidate(2, { genreIds: [99], mediaType: "tv" }),
    candidate(3, { genreIds: [18], mediaType: "movie" }),
  ]);

  assert.equal(output.recommendations.length, 3);
  assert.ok(output.recommendations.some((result) => result.category === "Something Different"));
});

test("large interaction history remains deterministic and diverse", () => {
  const mediaTypes: MediaType[] = ["movie", "tv"];
  const taste = Array.from({ length: 80 }, (_, index) =>
    tasteItem(index + 1, {
      mediaType: mediaTypes[index % mediaTypes.length] ?? "movie",
      genreIds: index % 3 === 0 ? [80] : [18],
      interactionType: index % 5 === 0 ? "watched_disliked" : "watched_liked",
    }),
  );
  const candidates = Array.from({ length: 30 }, (_, index) =>
    candidate(index + 1, {
      genreIds: index % 2 === 0 ? [80] : [18],
      mediaType: mediaTypes[index % mediaTypes.length] ?? "movie",
      popularity: 20 + index,
      voteCount: 100 + index,
    }),
  );
  const first = run(taste, candidates);
  const second = run([...taste].reverse(), [...candidates].reverse());

  assert.deepEqual(second.recommendations, first.recommendations);
  assert.equal(new Set(first.recommendations.map((result) => result.item.genreIds[0])).size, 2);
});

test("watched, not-interested, rejected, duplicate, and incomplete titles are excluded", () => {
  const taste = Array.from({ length: 4 }, (_, index) => tasteItem(index + 1));
  const output = run(
    taste,
    [
      candidate(1, { contentId: "watched" }),
      candidate(2, { contentId: "blocked" }),
      candidate(3, { contentId: "content-rejected" }),
      candidate(4, { title: "Duplicate title", tmdbId: 44 }),
      candidate(5, { title: "Duplicate title", tmdbId: 45 }),
      candidate(6, { overview: null }),
      candidate(7, { title: "Eligible crime" }),
    ],
    [
      interaction(1, "watched_liked", { contentId: "watched" }),
      interaction(2, "not_interested", { contentId: "blocked" }),
    ],
  );

  assert.equal(output.excluded.watched, 1);
  assert.equal(output.excluded.notInterested, 1);
  assert.equal(output.excluded.rejectedInSession, 1);
  assert.equal(output.excluded.duplicate, 1);
  assert.equal(output.excluded.missingMetadata, 1);
  assert.deepEqual(
    output.recommendations.map((result) => result.item.title),
    ["Eligible crime", "Duplicate title"],
  );
});
