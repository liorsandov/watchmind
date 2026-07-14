import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-8 rounded-lg border border-input bg-background px-2.5 text-sm";

export function LibraryFilters({ genres, values, showInteraction = true }: {
  genres: number[];
  values: { q?: string; media?: string; interaction?: string; genre?: string; sort?: string; view?: string };
  showInteraction?: boolean;
}) {
  return <form className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
    {values.view ? <input name="view" type="hidden" value={values.view} /> : null}
    <Input aria-label="Search saved titles" className="lg:col-span-2" defaultValue={values.q} name="q" placeholder="Search your titles" type="search" />
    <select aria-label="Media type" className={selectClass} defaultValue={values.media ?? ""} name="media"><option value="">Movies & TV</option><option value="movie">Movies</option><option value="tv">TV shows</option></select>
    {showInteraction ? <select aria-label="Interaction type" className={selectClass} defaultValue={values.interaction ?? ""} name="interaction"><option value="">All interactions</option><option value="interested">Watchlist</option><option value="watched">Watched</option><option value="not_interested">Not interested</option><option value="skipped">Skipped</option><option value="unsure">Unsure</option></select> : null}
    <select aria-label="Genre" className={selectClass} defaultValue={values.genre ?? ""} name="genre"><option value="">All genres</option>{genres.map((id) => <option key={id} value={id}>Genre {id}</option>)}</select>
    <select aria-label="Sort order" className={selectClass} defaultValue={values.sort ?? "date"} name="sort"><option value="date">Newest activity</option><option value="title">Title</option><option value="rating">Personal rating</option></select>
    <Button type="submit">Apply filters</Button>
  </form>;
}
