import { Info, Keyboard, ShieldCheck, Smartphone } from "lucide-react";
import { RatingFlow } from "@/components/rating/rating-flow";
import { TmdbAttribution } from "@/components/content/tmdb-attribution";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getContentItems } from "@/lib/repositories/content-items";
import { listCurrentInteractions } from "@/lib/repositories/interactions";
import {
  buildBalancedRatingQueue,
  type RatingQueueCandidate,
} from "@/lib/rating/queue";
import { getTmdbService } from "@/lib/tmdb/service";
import type { ContentGenre, ContentItem } from "@/types/media";

export const metadata = {
  title: "Rate titles · WatchMind",
  description: "Classify movies and TV shows to build your private taste profile.",
};

function fulfilled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export default async function RatePage() {
  const tmdb = getTmdbService();
  const [interactions, results] = await Promise.all([
    listCurrentInteractions(500),
    Promise.allSettled([
      tmdb.getTrendingMovies(),
      tmdb.getTrendingTvShows(),
      tmdb.getPopularMovies(1),
      tmdb.getPopularMovies(2),
      tmdb.getPopularTvShows(1),
      tmdb.getPopularTvShows(2),
      tmdb.getGenres("movie"),
      tmdb.getGenres("tv"),
    ]),
  ]);
  const classifiedItems = await getContentItems(
    interactions.map((interaction) => interaction.content_id),
  );
  const classifiedExternalIds = new Set(
    classifiedItems.map((item) => `${item.media_type}:${item.tmdb_id}`),
  );

  const [
    trendingMovies,
    trendingTv,
    popularMoviesOne,
    popularMoviesTwo,
    popularTvOne,
    popularTvTwo,
    movieGenres,
    tvGenres,
  ] = results;
  const candidates: RatingQueueCandidate[] = [
    ...asCandidates(fulfilled(trendingMovies), "trending"),
    ...asCandidates(fulfilled(trendingTv), "trending"),
    ...asCandidates(fulfilled(popularMoviesOne), "popular"),
    ...asCandidates(fulfilled(popularMoviesTwo), "popular"),
    ...asCandidates(fulfilled(popularTvOne), "popular"),
    ...asCandidates(fulfilled(popularTvTwo), "popular"),
  ];
  const genres = mergeGenres(
    fulfilled(movieGenres) ?? [],
    fulfilled(tvGenres) ?? [],
  );
  const queue = buildBalancedRatingQueue({
    candidates,
    classifiedExternalIds,
    genres,
    limit: 30,
  });
  const failedCollections = results.filter((result) => result.status === "rejected").length;

  return (
    <div className="space-y-8">
      <header className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Build your taste profile</Badge>
          <Badge variant="outline">
            <ShieldCheck aria-hidden="true" /> Private
          </Badge>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Rate what you already know
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Rate titles you already know. The more accurate your answers are, the
            better your future recommendations become.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Smartphone aria-hidden="true" className="size-4" /> Swipe on touch
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Keyboard aria-hidden="true" className="size-4" /> Keyboard shortcuts
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Info aria-hidden="true" className="size-4" /> Haven’t watched won’t affect taste
          </span>
        </div>
      </header>

      {failedCollections > 0 ? (
        <Alert className="mx-auto max-w-5xl">
          <AlertTitle>Some titles are temporarily unavailable</AlertTitle>
          <AlertDescription>
            The session is using the collections that loaded successfully. Your
            answers will still save normally.
          </AlertDescription>
        </Alert>
      ) : null}

      <RatingFlow
        initialClassifiedCount={interactions.length}
        queue={queue}
      />

      <div className="mx-auto max-w-5xl">
        <TmdbAttribution />
      </div>
    </div>
  );
}

function asCandidates(
  items: ContentItem[] | null,
  source: RatingQueueCandidate["source"],
): RatingQueueCandidate[] {
  return (items ?? []).map((item) => ({ item, source }));
}

function mergeGenres(...collections: ContentGenre[][]) {
  return [...new Map(collections.flat().map((genre) => [genre.id, genre])).values()];
}
