import type { InteractionSource } from "@/types/database";
import type { ContentGenre, ContentItem } from "@/types/media";

export type RatingCardSource = Extract<
  InteractionSource,
  "trending" | "popular"
>;

export interface RatingQueueCandidate {
  item: ContentItem;
  source: RatingCardSource;
}

export interface RatingQueueCard extends RatingQueueCandidate {
  genres: ContentGenre[];
}

interface BuildQueueInput {
  candidates: readonly RatingQueueCandidate[];
  classifiedExternalIds?: ReadonlySet<string>;
  genres?: readonly ContentGenre[];
  limit?: number;
}

/**
 * Creates a deterministic, varied first-session queue. The greedy score favors
 * the currently underrepresented media type/source, unseen genres, and a small
 * quota of recognizable pre-2005 titles without letting classics dominate.
 */
export function buildBalancedRatingQueue({
  candidates,
  classifiedExternalIds = new Set(),
  genres = [],
  limit = 30,
}: BuildQueueInput): RatingQueueCard[] {
  const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));
  const unique = new Map<string, RatingQueueCandidate>();

  for (const candidate of candidates) {
    if (
      classifiedExternalIds.has(candidate.item.externalId) ||
      unique.has(candidate.item.externalId)
    ) {
      continue;
    }
    unique.set(candidate.item.externalId, candidate);
  }

  const pool = [...unique.values()];
  const queue: RatingQueueCard[] = [];
  const typeCounts = { movie: 0, tv: 0 };
  const sourceCounts = { popular: 0, trending: 0 };
  const genreCounts = new Map<number, number>();
  let olderCount = 0;

  while (pool.length > 0 && queue.length < Math.max(0, limit)) {
    const targetOlder = Math.ceil((queue.length + 1) / 6);
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index];
      if (!candidate) continue;
      const { item, source } = candidate;
      const isOlder = item.releaseYear !== null && item.releaseYear <= 2005;
      const typeNeed = Math.max(typeCounts.movie, typeCounts.tv) - typeCounts[item.mediaType];
      const sourceNeed =
        Math.max(sourceCounts.popular, sourceCounts.trending) - sourceCounts[source];
      const newGenres = item.genreIds.filter(
        (genreId) => (genreCounts.get(genreId) ?? 0) === 0,
      ).length;
      const underusedGenres = item.genreIds.reduce(
        (sum, genreId) => sum + 1 / (1 + (genreCounts.get(genreId) ?? 0)),
        0,
      );
      const olderNeed = isOlder && olderCount < targetOlder ? 6 : 0;
      const metadataQuality = item.posterUrl && item.overview ? 1.5 : 0;
      const popularityTieBreak = Math.min(item.popularity ?? 0, 1_000) / 10_000;
      const score =
        typeNeed * 5 +
        sourceNeed * 3 +
        newGenres * 2 +
        underusedGenres +
        olderNeed +
        metadataQuality +
        popularityTieBreak;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const [selected] = pool.splice(bestIndex, 1);
    if (!selected) break;
    typeCounts[selected.item.mediaType] += 1;
    sourceCounts[selected.source] += 1;
    if (selected.item.releaseYear !== null && selected.item.releaseYear <= 2005) {
      olderCount += 1;
    }
    for (const genreId of selected.item.genreIds) {
      genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1);
    }
    queue.push({
      ...selected,
      genres: selected.item.genreIds
        .map((id) => ({ id, name: genreNames.get(id) ?? "" }))
        .filter((genre) => genre.name),
    });
  }

  return queue;
}
