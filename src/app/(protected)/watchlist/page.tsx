import Link from "next/link";
import { Heart } from "lucide-react";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryItemCard } from "@/components/library/library-item-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentLibrary } from "@/lib/library";

export const metadata = { title: "Watchlist · WatchMind" };

export default async function WatchlistPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const library = await getCurrentLibrary();
  const byId = new Map(library.content.map((item) => [item.id, item]));
  const genre = Number(params.genre) || null;
  const items = library.interactions.filter((item) => item.interaction_type === "interested").flatMap((interaction) => {
    const content = byId.get(interaction.content_id);
    return content ? [{ content, interaction }] : [];
  }).filter(({ content }) => (!params.q || content.title.toLowerCase().includes(params.q.toLowerCase())) && (!params.media || content.media_type === params.media) && (!genre || content.genre_ids.includes(genre)));
  items.sort((a, b) => params.sort === "title" ? a.content.title.localeCompare(b.content.title) : params.sort === "rating" ? (b.interaction.rating ?? 0) - (a.interaction.rating ?? 0) : b.interaction.updated_at.localeCompare(a.interaction.updated_at));
  const page = Math.max(Number(params.page) || 1, 1);
  const pageSize = 24;
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  const genres = [...new Set(library.content.flatMap((item) => item.genre_ids))].sort((a, b) => a - b);
  return <div className="space-y-7"><header className="space-y-3"><Badge variant="secondary"><Heart /> Saved</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your watchlist</h1><p className="text-muted-foreground">A private, durable list you can edit whenever your plans change.</p></header><LibraryFilters genres={genres} showInteraction={false} values={params} />{pageItems.length ? <div className="grid gap-4 xl:grid-cols-2">{pageItems.map((item) => <LibraryItemCard {...item} key={item.content.id} />)}</div> : <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">No saved titles match</p><p className="mt-1 text-sm text-muted-foreground">Save a recommendation or broaden your filters.</p><Button asChild className="mt-4"><Link href="/recommendations">Get recommendations</Link></Button></div>}<Pagination page={page} total={items.length} params={params} pageSize={pageSize} /></div>;
}

function Pagination({ page, pageSize, params, total }: { page: number; pageSize: number; params: Record<string, string | undefined>; total: number }) {
  const pages = Math.ceil(total / pageSize); if (pages <= 1) return null;
  const href = (next: number) => `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, value]) => value)), page: String(next) }).toString()}`;
  return <nav aria-label="Watchlist pages" className="flex items-center justify-between"><Button asChild={page > 1} disabled={page <= 1} variant="outline">{page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span>Previous</span>}</Button><span className="text-sm text-muted-foreground">Page {page} of {pages}</span><Button asChild={page < pages} disabled={page >= pages} variant="outline">{page < pages ? <Link href={href(page + 1)}>Next</Link> : <span>Next</span>}</Button></nav>;
}
