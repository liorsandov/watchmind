import type {
  TasteConfidence,
  TasteProfile,
  TasteProfileSourceItem,
  TasteSentiment,
  TasteSignal,
} from "@/lib/taste/model";
import type { InteractionType } from "@/types/database";

export const TASTE_ALGORITHM_VERSION = "deterministic-v1";

/**
 * Transparent interaction weights. Watched reactions carry twice the weight
 * of intent-only reactions. Neutral, skipped, and unsure responses do not
 * change preference direction, though neutral still counts as collected data.
 */
export const INTERACTION_WEIGHTS: Readonly<Record<InteractionType, number>> = {
  watched_liked: 3,
  watched_disliked: -3,
  watched_neutral: 0,
  interested: 1.5,
  not_interested: -1.5,
  skipped: 0,
  unsure: 0,
};

const PRIOR_WEIGHT = 6;
const MIN_DIRECTIONAL_SUPPORT = 3;
const DIRECTIONAL_THRESHOLD = 0.35;

const genreNames: Readonly<Record<number, string>> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Science fiction",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
  10759: "Action & adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Science fiction & fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & politics",
  10770: "TV movie",
};

const languageNames: Readonly<Record<string, string>> = {
  ar: "Arabic",
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  he: "Hebrew",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ru: "Russian",
  tr: "Turkish",
  zh: "Chinese",
};

interface SignalAccumulator {
  key: string;
  label: string;
  weightedTotal: number;
  absoluteWeight: number;
  support: number;
}

function confidenceForCount(count: number): TasteConfidence {
  if (count >= 15) return "high";
  if (count >= 5) return "medium";
  return "low";
}

function signalConfidence(support: number): TasteConfidence {
  if (support >= 7) return "high";
  if (support >= 3) return "medium";
  return "low";
}

function sentimentFor(score: number, support: number): TasteSentiment {
  if (support < MIN_DIRECTIONAL_SUPPORT) return "unknown";
  if (score >= DIRECTIONAL_THRESHOLD) return "positive";
  if (score <= -DIRECTIONAL_THRESHOLD) return "negative";
  return "neutral";
}

function addSignal(
  signals: Map<string, SignalAccumulator>,
  key: string,
  label: string,
  weight: number,
) {
  const current = signals.get(key) ?? {
    key,
    label,
    weightedTotal: 0,
    absoluteWeight: 0,
    support: 0,
  };
  current.weightedTotal += weight;
  current.absoluteWeight += Math.abs(weight);
  current.support += 1;
  signals.set(key, current);
}

function finalizeSignals(signals: Map<string, SignalAccumulator>): TasteSignal[] {
  return [...signals.values()]
    .map(({ absoluteWeight, key, label, support, weightedTotal }) => {
      const score = weightedTotal / (absoluteWeight + PRIOR_WEIGHT);
      return {
        key,
        label,
        score: Number(score.toFixed(4)),
        support,
        confidence: signalConfidence(support),
        sentiment: sentimentFor(score, support),
      };
    })
    .sort(
      (a, b) =>
        Math.abs(b.score) - Math.abs(a.score) ||
        b.support - a.support ||
        a.key.localeCompare(b.key),
    );
}

function decadeFor(releaseDate: string | null) {
  const year = releaseDate?.match(/^(\d{4})-/)?.[1];
  if (!year) return null;
  const decade = Math.floor(Number(year) / 10) * 10;
  return Number.isFinite(decade) && decade >= 1870 && decade <= 2200
    ? { key: String(decade), label: `${decade}s` }
    : null;
}

function runtimeRange(runtimeMinutes: number | null) {
  if (runtimeMinutes === null || runtimeMinutes <= 0) return null;
  if (runtimeMinutes < 45) return { key: "short", label: "Short (under 45 min)" };
  if (runtimeMinutes < 120) return { key: "standard", label: "Standard (45–119 min)" };
  return { key: "long", label: "Long (120+ min)" };
}

function popularityRange(popularity: number | null) {
  if (popularity === null || popularity < 0) return null;
  if (popularity >= 50) return { key: "popular", label: "Popular titles" };
  if (popularity < 20) {
    return { key: "less-mainstream", label: "Less-mainstream titles" };
  }
  return { key: "middle", label: "Moderately popular titles" };
}

function fingerprint(items: readonly TasteProfileSourceItem[]) {
  const canonical = [...items]
    .sort((a, b) => a.interactionId.localeCompare(b.interactionId))
    .map((item) =>
      [
        item.interactionId,
        item.interactionType,
        item.rating ?? "",
        item.title,
        item.mediaType,
        [...item.genreIds].sort((a, b) => a - b).join(","),
        item.releaseDate ?? "",
        item.originalLanguage ?? "",
        item.runtimeMinutes ?? "",
        item.popularity ?? "",
      ].join("|"),
    )
    .join("\n");

  // FNV-1a is used as a stable change fingerprint, not for security.
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${TASTE_ALGORITHM_VERSION}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function buildExplanations(
  genres: TasteSignal[],
  confidence: TasteConfidence,
  informativeCount: number,
) {
  const explanations: string[] = [];
  const likedGenres = genres
    .filter((signal) => signal.sentiment === "positive")
    .slice(0, 2)
    .map((signal) => signal.label.toLocaleLowerCase());
  const dislikedGenres = genres
    .filter((signal) => signal.sentiment === "negative")
    .slice(0, 2)
    .map((signal) => signal.label.toLocaleLowerCase());

  if (likedGenres.length > 0) {
    explanations.push(`You tend to like ${joinLabels(likedGenres)} titles.`);
  }
  if (dislikedGenres.length > 0) {
    explanations.push(
      `You have reacted negatively to ${joinLabels(dislikedGenres)} titles.`,
    );
  }

  const comedy = genres.find((signal) => signal.key === "35");
  if (!comedy || comedy.support < MIN_DIRECTIONAL_SUPPORT) {
    explanations.push("We still need more data about comedy.");
  }
  if (informativeCount === 0) {
    explanations.unshift(
      "Rate a few titles you know to start revealing reliable patterns.",
    );
  }
  explanations.push(`Your current profile confidence is ${confidence}.`);
  return explanations;
}

export function calculateTasteProfile(
  items: readonly TasteProfileSourceItem[],
): TasteProfile {
  const genres = new Map<string, SignalAccumulator>();
  const mediaTypes = new Map<string, SignalAccumulator>();
  const decades = new Map<string, SignalAccumulator>();
  const languages = new Map<string, SignalAccumulator>();
  const runtimeRanges = new Map<string, SignalAccumulator>();
  const popularity = new Map<string, SignalAccumulator>();

  for (const item of items) {
    const weight = INTERACTION_WEIGHTS[item.interactionType];
    const mediaLabel = item.mediaType === "movie" ? "Movies" : "TV shows";
    addSignal(mediaTypes, item.mediaType, mediaLabel, weight);

    for (const genreId of new Set(item.genreIds)) {
      addSignal(
        genres,
        String(genreId),
        genreNames[genreId] ?? `Genre ${genreId}`,
        weight,
      );
    }

    const decade = decadeFor(item.releaseDate);
    if (decade) addSignal(decades, decade.key, decade.label, weight);

    if (item.originalLanguage) {
      const language = item.originalLanguage.toLocaleLowerCase();
      addSignal(
        languages,
        language,
        languageNames[language] ?? language.toLocaleUpperCase(),
        weight,
      );
    }

    const runtime = runtimeRange(item.runtimeMinutes);
    if (runtime) addSignal(runtimeRanges, runtime.key, runtime.label, weight);

    const popularityBucket = popularityRange(item.popularity);
    if (popularityBucket) {
      addSignal(popularity, popularityBucket.key, popularityBucket.label, weight);
    }
  }

  const informativeInteractionCount = items.filter(
    (item) => !["skipped", "unsure"].includes(item.interactionType),
  ).length;
  const confidence = confidenceForCount(informativeInteractionCount);
  const dimensions = {
    genres: finalizeSignals(genres),
    mediaTypes: finalizeSignals(mediaTypes),
    decades: finalizeSignals(decades),
    languages: finalizeSignals(languages),
    runtimeRanges: finalizeSignals(runtimeRanges),
    popularity: finalizeSignals(popularity),
  };

  return {
    algorithmVersion: TASTE_ALGORITHM_VERSION,
    sourceFingerprint: fingerprint(items),
    interactionCount: items.length,
    informativeInteractionCount,
    confidence,
    dimensions,
    strongSignals: {
      positive: items
        .filter((item) => item.interactionType === "watched_liked")
        .map(({ interactionId, interactionType, title }) => ({
          interactionId,
          interactionType,
          title,
        })),
      negative: items
        .filter((item) => item.interactionType === "watched_disliked")
        .map(({ interactionId, interactionType, title }) => ({
          interactionId,
          interactionType,
          title,
        })),
    },
    explanations: buildExplanations(dimensions.genres, confidence, informativeInteractionCount),
  };
}
