import type {
  RecommendationCategory,
  RecommendationConfidence,
  RecommendationEngineInput,
  RecommendationEngineOutput,
  RecommendationInteractionItem,
  RecommendationResult,
  RecommendationSignalContribution,
  RecommendationSourceItem,
  SignalLookup,
} from "@/lib/recommendations/model";
import { RECOMMENDATION_ALGORITHM_VERSION } from "@/lib/recommendations/model";
import type { TasteProfile, TasteSignal } from "@/lib/taste/model";

const WATCHED_INTERACTIONS = new Set([
  "watched_liked",
  "watched_disliked",
  "watched_neutral",
]);
const POSITIVE_INTERACTIONS = new Set(["watched_liked", "interested"]);
const NEGATIVE_INTERACTIONS = new Set(["watched_disliked", "not_interested"]);
const ESSENTIAL_OVERVIEW_LENGTH = 20;

function byKey(signals: readonly TasteSignal[]): SignalLookup {
  return new Map(signals.map((signal) => [signal.key, signal]));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Number(value.toFixed(4));
}

function decadeFor(releaseDate: string | null) {
  const year = releaseDate?.match(/^(\d{4})-/)?.[1];
  if (!year) return null;
  return String(Math.floor(Number(year) / 10) * 10);
}

function runtimeRange(runtimeMinutes: number | null) {
  if (runtimeMinutes === null || runtimeMinutes <= 0) return null;
  if (runtimeMinutes < 45) return "short";
  if (runtimeMinutes < 120) return "standard";
  return "long";
}

function popularityRange(popularity: number | null) {
  if (popularity === null || popularity < 0) return null;
  if (popularity >= 50) return "popular";
  if (popularity < 20) return "less-mainstream";
  return "middle";
}

function titleKey(item: RecommendationSourceItem) {
  return item.title.trim().toLocaleLowerCase();
}

function externalKey(item: Pick<RecommendationSourceItem, "mediaType" | "tmdbId">) {
  return `${item.mediaType}:${item.tmdbId}`;
}

function hasEssentialMetadata(item: RecommendationSourceItem) {
  return (
    item.tmdbId > 0 &&
    item.title.trim().length > 0 &&
    item.overview !== null &&
    item.overview.trim().length >= ESSENTIAL_OVERVIEW_LENGTH &&
    item.genreIds.length > 0 &&
    item.releaseDate !== null &&
    item.originalLanguage !== null &&
    item.voteAverage !== null &&
    item.voteCount !== null &&
    item.popularity !== null
  );
}

function contribution(
  key: string,
  label: string,
  score: number,
  weight: number,
  value: string,
): RecommendationSignalContribution {
  return { key, label, score: round(score), weight, value };
}

function signalScore(
  lookup: SignalLookup,
  key: string | null,
  weight: number,
  label: string,
  valueLabel: string,
) {
  if (!key) return { score: 0, signals: [] };
  const signal = lookup.get(key);
  if (!signal) return { score: 0, signals: [] };
  const score = signal.score * weight;
  return {
    score,
    signals: [contribution(label, signal.label, score, weight, valueLabel)],
  };
}

function genreScore(
  lookup: SignalLookup,
  genreIds: readonly number[],
) {
  const matched = genreIds
    .map((genreId) => lookup.get(String(genreId)))
    .filter((signal): signal is TasteSignal => Boolean(signal));
  if (matched.length === 0) return { score: 0, signals: [] };

  const sorted = matched.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  const top = sorted.slice(0, 3);
  const score = top.reduce((total, signal) => total + signal.score, 0) * 0.36;
  return {
    score,
    signals: top.map((signal) =>
      contribution("genre", signal.label, signal.score * 0.36, 0.36, signal.key),
    ),
  };
}

function qualityScore(item: RecommendationSourceItem) {
  const voteAverage = item.voteAverage ?? 0;
  const voteCount = item.voteCount ?? 0;
  const confidence = clamp(Math.log10(voteCount + 1) / 4, 0.15, 1);
  const score = ((voteAverage - 5.8) / 4.2) * confidence * 0.18;
  return {
    score,
    signals: [
      contribution(
        "quality",
        "TMDB quality signal",
        score,
        0.18,
        `${voteAverage.toFixed(1)} average from ${voteCount} votes`,
      ),
    ],
  };
}

function popularityBalance(item: RecommendationSourceItem) {
  const popularity = item.popularity ?? 0;
  let score = 0.02;
  if (popularity >= 20 && popularity <= 80) score = 0.12;
  if (popularity > 120) score = -0.08;
  if (popularity < 5) score = -0.04;
  return {
    score,
    signals: [
      contribution("popularity", "Popularity balance", score, 0.12, String(popularity)),
    ],
  };
}

function jaccard(a: readonly number[], b: readonly number[]) {
  const left = new Set(a);
  const right = new Set(b);
  const intersection = [...left].filter((value) => right.has(value)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function similarityScore(
  item: RecommendationSourceItem,
  interactions: readonly RecommendationInteractionItem[],
) {
  let positive = 0;
  let negative = 0;
  for (const interaction of interactions) {
    const similarity =
      jaccard(item.genreIds, interaction.genreIds) +
      (item.mediaType === interaction.mediaType ? 0.25 : 0) +
      (item.originalLanguage &&
      interaction.originalLanguage === item.originalLanguage
        ? 0.15
        : 0);
    if (POSITIVE_INTERACTIONS.has(interaction.interactionType)) {
      positive = Math.max(positive, similarity);
    }
    if (NEGATIVE_INTERACTIONS.has(interaction.interactionType)) {
      negative = Math.max(negative, similarity);
    }
  }

  const score = positive * 0.16 - negative * 0.22;
  return {
    positive,
    negative,
    score,
    signals: [
      contribution("similar-liked", "Similarity to liked titles", positive * 0.16, 0.16, round(positive).toString()),
      contribution("similar-disliked", "Penalty near disliked titles", -negative * 0.22, 0.22, round(negative).toString()),
    ],
  };
}

function explorationScore(item: RecommendationSourceItem, profile: TasteProfile) {
  const positiveGenres = new Set(
    profile.dimensions.genres
      .filter((signal) => signal.sentiment === "positive")
      .map((signal) => Number(signal.key)),
  );
  const overlap = item.genreIds.filter((genreId) => positiveGenres.has(genreId)).length;
  const languageKnown = profile.dimensions.languages.some(
    (signal) => signal.key === item.originalLanguage,
  );
  const differentMedia =
    profile.dimensions.mediaTypes[0] &&
    profile.dimensions.mediaTypes[0].key !== item.mediaType;
  const score =
    (overlap === 0 ? 0.1 : 0) +
    (!languageKnown ? 0.04 : 0) +
    (differentMedia ? 0.04 : 0);

  return {
    score,
    signals: [
      contribution(
        "exploration",
        "Exploration bonus",
        score,
        0.18,
        overlap === 0 ? "outside top liked genres" : "near known preferences",
      ),
    ],
  };
}

function confidenceFor(score: number, profile: TasteProfile): RecommendationConfidence {
  if (profile.confidence === "high" && score >= 0.55) return "high";
  if (profile.confidence !== "low" && score >= 0.34) return "medium";
  return "low";
}

function categoryFor(
  score: number,
  exploration: number,
  similarityToLiked: number,
  positiveGenreScore: number,
): RecommendationCategory {
  if (score >= 0.42 && (similarityToLiked >= 0.45 || positiveGenreScore >= 0.16)) {
    return "Safe Match";
  }
  if (exploration >= 0.1) return "Something Different";
  return "Worth Exploring";
}

function buildReasons(
  item: RecommendationSourceItem,
  category: RecommendationCategory,
  confidence: RecommendationConfidence,
  signals: readonly RecommendationSignalContribution[],
  profile: TasteProfile,
) {
  const reasons: string[] = [];
  const genreSignals = signals
    .filter((signal) => signal.key === "genre" && signal.score > 0)
    .slice(0, 2)
    .map((signal) => signal.label.toLocaleLowerCase());
  if (genreSignals.length > 0) {
    reasons.push(`Recommended because you liked ${genreSignals.join(" and ")} titles.`);
  }

  if (signals.some((signal) => signal.key === "similar-liked" && signal.score > 0.07)) {
    reasons.push("Similar in shape to titles you rated positively.");
  }

  if (category === "Something Different") {
    reasons.push("A slightly different choice that still keeps one foot near your taste.");
  }

  const language = signals.find(
    (signal) => signal.key === "language" && signal.score > 0,
  );
  if (language) reasons.push(`Matches your interest in ${language.label} titles.`);

  if (confidence === "low" || profile.confidence === "low") {
    reasons.push(
      `Lower confidence because we have limited feedback for ${item.title}.`,
    );
  }

  if (signals.some((signal) => signal.key === "quality" && signal.score > 0.06)) {
    reasons.push("Backed by a solid TMDB quality signal.");
  }

  return reasons.slice(0, 4);
}

function scoreCandidate(
  item: RecommendationSourceItem,
  input: RecommendationEngineInput,
) {
  const profile = input.tasteProfile;
  const lookups = {
    genres: byKey(profile.dimensions.genres),
    mediaTypes: byKey(profile.dimensions.mediaTypes),
    decades: byKey(profile.dimensions.decades),
    languages: byKey(profile.dimensions.languages),
    runtimeRanges: byKey(profile.dimensions.runtimeRanges),
    popularity: byKey(profile.dimensions.popularity),
  };

  const pieces = [
    genreScore(lookups.genres, item.genreIds),
    signalScore(lookups.mediaTypes, item.mediaType, 0.16, "media-type", item.mediaType),
    signalScore(lookups.languages, item.originalLanguage, 0.1, "language", item.originalLanguage ?? ""),
    signalScore(lookups.decades, decadeFor(item.releaseDate), 0.08, "release-period", item.releaseDate ?? ""),
    signalScore(lookups.runtimeRanges, runtimeRange(item.runtimeMinutes), 0.05, "runtime", String(item.runtimeMinutes ?? "")),
    signalScore(lookups.popularity, popularityRange(item.popularity), 0.04, "popularity-affinity", String(item.popularity ?? "")),
    qualityScore(item),
    popularityBalance(item),
    similarityScore(item, input.interactions),
    explorationScore(item, profile),
  ];
  const score = pieces.reduce((total, piece) => total + piece.score, 0);
  const signals = pieces.flatMap((piece) => piece.signals);
  const similarity = signals.find((signal) => signal.key === "similar-liked")?.score ?? 0;
  const positiveGenreScore = signals
    .filter((signal) => signal.key === "genre" && signal.score > 0)
    .reduce((total, signal) => total + signal.score, 0);
  const exploration =
    signals.find((signal) => signal.key === "exploration")?.score ?? 0;
  const category = categoryFor(
    score,
    exploration,
    similarity / 0.16,
    positiveGenreScore,
  );
  const confidence = confidenceFor(score, profile);

  return {
    item,
    category,
    confidence,
    score: round(score),
    reasons: buildReasons(item, category, confidence, signals, profile),
    signals: signals.filter((signal) => signal.score !== 0),
  };
}

function conflictsWithSelected(
  candidate: RecommendationResult,
  selected: readonly RecommendationResult[],
) {
  return selected.some((result) => {
    const sameMedia = result.item.mediaType === candidate.item.mediaType;
    const genreOverlap = jaccard(result.item.genreIds, candidate.item.genreIds);
    const titleRoot = result.item.title.split(":")[0]?.trim().toLocaleLowerCase();
    return (
      titleRoot === candidate.item.title.split(":")[0]?.trim().toLocaleLowerCase() ||
      (sameMedia && genreOverlap >= 0.67)
    );
  });
}

function pickDiverse(
  scored: readonly RecommendationResult[],
  limit: number,
) {
  const desired: RecommendationCategory[] = [
    "Safe Match",
    "Worth Exploring",
    "Something Different",
  ];
  const selected: RecommendationResult[] = [];

  for (const category of desired) {
    const next = scored.find(
      (result) =>
        result.category === category &&
        !selected.includes(result) &&
        !conflictsWithSelected(result, selected),
    );
    if (next) selected.push(next);
    if (selected.length >= limit) return selected;
  }

  for (const result of scored) {
    if (selected.length >= limit) break;
    if (selected.includes(result)) continue;
    if (conflictsWithSelected(result, selected)) continue;
    selected.push(result);
  }

  for (const result of scored) {
    if (selected.length >= limit) break;
    if (!selected.includes(result)) selected.push(result);
  }

  return selected;
}

export function generateRecommendations(
  input: RecommendationEngineInput,
): RecommendationEngineOutput {
  const watchedIds = new Set(
    input.interactions
      .filter((interaction) => WATCHED_INTERACTIONS.has(interaction.interactionType))
      .map((interaction) => interaction.contentId),
  );
  const notInterestedIds = new Set(
    input.interactions
      .filter((interaction) => interaction.interactionType === "not_interested")
      .map((interaction) => interaction.contentId),
  );
  const rejectedIds = new Set(input.rejectedContentIds ?? []);
  const seenExternal = new Set<string>();
  const seenTitles = new Set<string>();
  const excluded = {
    watched: 0,
    notInterested: 0,
    rejectedInSession: 0,
    duplicate: 0,
    missingMetadata: 0,
  };
  const eligible: RecommendationSourceItem[] = [];

  for (const candidate of input.candidates) {
    const contentId = candidate.contentId;
    if (contentId && watchedIds.has(contentId)) {
      excluded.watched += 1;
      continue;
    }
    if (contentId && notInterestedIds.has(contentId)) {
      excluded.notInterested += 1;
      continue;
    }
    if (contentId && rejectedIds.has(contentId)) {
      excluded.rejectedInSession += 1;
      continue;
    }
    const external = externalKey(candidate);
    const title = titleKey(candidate);
    if (seenExternal.has(external) || seenTitles.has(title)) {
      excluded.duplicate += 1;
      continue;
    }
    seenExternal.add(external);
    seenTitles.add(title);
    if (!hasEssentialMetadata(candidate)) {
      excluded.missingMetadata += 1;
      continue;
    }
    eligible.push(candidate);
  }

  const scored = eligible
    .map((candidate) => scoreCandidate(candidate, input))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.item.voteCount ?? 0) - (a.item.voteCount ?? 0) ||
        externalKey(a.item).localeCompare(externalKey(b.item)),
    );

  return {
    algorithmVersion: RECOMMENDATION_ALGORITHM_VERSION,
    recommendations: pickDiverse(scored, input.limit ?? 3),
    excluded,
  };
}
