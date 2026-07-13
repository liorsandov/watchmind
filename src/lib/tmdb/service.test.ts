import assert from "node:assert/strict";
import test from "node:test";

test("calls every TMDB service endpoint with server auth and caching", async (t) => {
  const originalFetch = globalThis.fetch;
  process.env.TMDB_API_TOKEN = "test-server-token";
  const requests: Array<{ init?: RequestInit; url: string }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requests.push(init ? { init, url } : { url });
    const path = new URL(url).pathname;
    let body: unknown;

    if (path.includes("/genre/")) {
      body = { genres: [{ id: 18, name: "Drama" }] };
    } else if (path === "/3/movie/101") {
      body = {
        genres: [{ id: 18, name: "Drama" }],
        id: 101,
        runtime: 123,
        title: "Movie detail",
      };
    } else if (path === "/3/tv/202") {
      body = {
        episode_run_time: [47],
        genres: [{ id: 18, name: "Drama" }],
        id: 202,
        name: "TV detail",
      };
    } else if (path === "/3/search/multi") {
      body = page([
        { id: 101, media_type: "movie", title: "Movie" },
        { id: 202, media_type: "tv", name: "TV" },
        { id: 303, media_type: "person", name: "Person" },
      ]);
    } else {
      const isTv = path.includes("/tv/") || path.endsWith("/tv");
      body = page([isTv ? { id: 202, name: "TV" } : { id: 101, title: "Movie" }]);
    }

    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const { getTmdbService } = await import("@/lib/tmdb/service");
  const service = getTmdbService();
  const [
    trendingMovies,
    trendingTv,
    popularMovies,
    popularTv,
    search,
    movie,
    tv,
    movieGenres,
    tvGenres,
  ] = await Promise.all([
      service.getTrendingMovies(),
      service.getTrendingTvShows(),
      service.getPopularMovies(),
      service.getPopularTvShows(),
      service.search("test"),
      service.getMovieDetails(101),
      service.getTvDetails(202),
      service.getGenres("movie"),
      service.getGenres("tv"),
    ]);

  assert.equal(trendingMovies[0]?.mediaType, "movie");
  assert.equal(trendingTv[0]?.mediaType, "tv");
  assert.equal(popularMovies.length, 1);
  assert.equal(popularTv.length, 1);
  assert.deepEqual(
    search.map((item) => item.mediaType),
    ["movie", "tv"],
  );
  assert.equal(movie.runtimeMinutes, 123);
  assert.equal(tv.episodeRuntimeMinutes, 47);
  assert.equal(movieGenres[0]?.name, "Drama");
  assert.equal(tvGenres[0]?.name, "Drama");
  assert.equal(requests.length, 9);
  assert.ok(
    requests.every(
      ({ init }) =>
        (init?.headers as Record<string, string>).authorization ===
        "Bearer test-server-token",
    ),
  );
  assert.ok(
    requests.every(
      ({ init }) =>
        ((init as RequestInit & { next?: { revalidate?: number } })?.next
          ?.revalidate ?? 0) > 0,
    ),
  );
});

function page(results: unknown[]) {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
  };
}
