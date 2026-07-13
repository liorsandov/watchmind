import { Database, Search, Server, ShieldCheck } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { TmdbAttribution } from "@/components/content/tmdb-attribution";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TmdbApiError } from "@/lib/tmdb/client";
import { normalizeTmdbTitle } from "@/lib/tmdb/normalization";
import { getTmdbService } from "@/lib/tmdb/service";
import type { ContentGenre, ContentItem } from "@/types/media";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string }>;
}

type LoadResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

async function load<T>(promise: Promise<T>): Promise<LoadResult<T>> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof TmdbApiError
          ? error.message
          : "This TMDB collection is temporarily unavailable.",
    };
  }
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const query = (await searchParams).q?.trim().slice(0, 100) ?? "";
  const tmdb = getTmdbService();
  const [
    trendingMovies,
    trendingTv,
    popularMovies,
    popularTv,
    movieGenres,
    tvGenres,
    searchResults,
  ] = await Promise.all([
    load(tmdb.getTrendingMovies()),
    load(tmdb.getTrendingTvShows()),
    load(tmdb.getPopularMovies()),
    load(tmdb.getPopularTvShows()),
    load(tmdb.getGenres("movie")),
    load(tmdb.getGenres("tv")),
    query ? load(tmdb.search(query)) : Promise.resolve({ data: [], error: null }),
  ]);

  const [movieDetails, tvDetails] = await Promise.all([
    trendingMovies.data?.[0]
      ? load(tmdb.getMovieDetails(trendingMovies.data[0].tmdbId))
      : Promise.resolve({ data: null, error: trendingMovies.error }),
    trendingTv.data?.[0]
      ? load(tmdb.getTvDetails(trendingTv.data[0].tmdbId))
      : Promise.resolve({ data: null, error: trendingTv.error }),
  ]);
  const missingDataFixture = normalizeTmdbTitle(
    { id: 999_999_999, title: "Metadata pending" },
    "movie",
  );

  return (
    <div className="space-y-12">
      <header className="space-y-5">
        <Badge variant="outline">Task 5 integration lab</Badge>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            TMDB content verification
          </h1>
          <p className="max-w-3xl leading-7 text-muted-foreground">
            A temporary server-rendered page for checking normalized movie and TV
            metadata before the rating experience is built.
          </p>
        </div>
        <form className="flex max-w-2xl flex-col gap-3 sm:flex-row" method="get">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search movies and TV shows"
              className="ps-9"
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search movies and TV shows"
              type="search"
            />
          </div>
          <Button type="submit">Search TMDB</Button>
        </form>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard
          icon={Server}
          label="Server only"
          text="The bearer token never enters the browser bundle."
        />
        <StatusCard
          icon={ShieldCheck}
          label="Normalized"
          text="Movies and TV shows share one validated ContentItem model."
        />
        <StatusCard
          icon={Database}
          label="Selective storage"
          text="Browsing and search do not write catalog rows to Supabase."
        />
      </section>

      {query ? (
        <ContentSection
          emptyText={`No movie or TV results were found for “${query}”.`}
          error={searchResults.error}
          items={searchResults.data}
          title={`Search results for “${query}”`}
        />
      ) : null}

      <ContentSection
        error={trendingMovies.error}
        items={trendingMovies.data}
        prioritizeFirst
        title="Trending movies"
      />
      <ContentSection
        error={trendingTv.error}
        items={trendingTv.data}
        title="Trending TV shows"
      />

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Details endpoints</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detail responses add movie runtime, episode runtime, and named genres.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {movieDetails.data ? <ContentCard item={movieDetails.data} /> : null}
          {tvDetails.data ? <ContentCard item={tvDetails.data} /> : null}
          <ContentCard item={missingDataFixture} />
        </div>
        {movieDetails.error || tvDetails.error ? (
          <IntegrationError
            message={movieDetails.error ?? tvDetails.error ?? "Details unavailable."}
          />
        ) : null}
      </section>

      <GenrePanel movieGenres={movieGenres} tvGenres={tvGenres} />

      <ContentSection
        error={popularMovies.error}
        items={popularMovies.data}
        title="Popular movies"
      />
      <ContentSection
        error={popularTv.error}
        items={popularTv.data}
        title="Popular TV shows"
      />

      <TmdbAttribution />
    </div>
  );
}

function ContentSection({
  emptyText = "No titles are available.",
  error,
  items,
  prioritizeFirst = false,
  title,
}: {
  emptyText?: string;
  error: string | null;
  items: ContentItem[] | null;
  prioritizeFirst?: boolean;
  title: string;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {items ? (
          <span className="text-xs text-muted-foreground">
            Showing {Math.min(items.length, 5)} of {items.length}
          </span>
        ) : null}
      </div>
      {error ? <IntegrationError message={error} /> : null}
      {!error && items?.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : null}
      {items?.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.slice(0, 5).map((item, index) => (
            <ContentCard
              item={item}
              key={item.externalId}
              priority={prioritizeFirst && index < 2}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function IntegrationError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>TMDB data unavailable</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function StatusCard({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Server;
  label: string;
  text: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <Icon aria-hidden="true" className="size-5 text-primary" />
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs leading-5 text-muted-foreground">
        {text}
      </CardContent>
    </Card>
  );
}

function GenrePanel({
  movieGenres,
  tvGenres,
}: {
  movieGenres: LoadResult<ContentGenre[]>;
  tvGenres: LoadResult<ContentGenre[]>;
}) {
  const genres = [...(movieGenres.data ?? []), ...(tvGenres.data ?? [])];
  const uniqueGenres = [...new Map(genres.map((genre) => [genre.id, genre])).values()];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Genre endpoints</h2>
      {movieGenres.error || tvGenres.error ? (
        <IntegrationError
          message={movieGenres.error ?? tvGenres.error ?? "Genres unavailable."}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {uniqueGenres.map((genre) => (
            <Badge key={genre.id} variant="secondary">
              {genre.name}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
