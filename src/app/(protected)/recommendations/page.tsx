import { RecommendationExperience } from "@/components/recommendations/recommendation-experience";
import { Badge } from "@/components/ui/badge";
import { listAllCurrentInteractions } from "@/lib/repositories/interactions";
import { getTmdbService } from "@/lib/tmdb/service";

export const metadata = { title: "Recommendations · WatchMind" };

export default async function RecommendationsPage() {
  const [movieGenres, tvGenres, interactions] = await Promise.all([
    getTmdbService().getGenres("movie"),
    getTmdbService().getGenres("tv"),
    listAllCurrentInteractions(),
  ]);
  const genres = [...new Map([...movieGenres, ...tvGenres].map((genre) => [genre.id, genre])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const informativeCount = interactions.filter((interaction) => !["skipped", "unsure"].includes(interaction.interaction_type)).length;
  return <div className="mx-auto max-w-7xl space-y-8"><header className="space-y-4"><Badge variant="secondary">For you</Badge><div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Three good options, not an endless feed</h1><p className="mt-2 max-w-3xl leading-7 text-muted-foreground">Tell WatchMind what fits the moment, or leave every choice open. Every explanation comes from your stored taste signals.</p></div></header><RecommendationExperience genres={genres} informativeCount={informativeCount} /></div>;
}
