import Image from "next/image";
import { Check, Trash2 } from "lucide-react";
import { updateLibraryItemAction } from "@/app/(protected)/history/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTmdbImageUrl } from "@/lib/tmdb/images";
import type { InteractionType, Tables } from "@/types/database";

const selectClass = "h-8 rounded-lg border border-input bg-background px-2 text-xs";
const labels: Record<InteractionType, string> = {
  watched_liked: "Watched · liked", watched_disliked: "Watched · disliked", watched_neutral: "Watched · neutral",
  interested: "Watchlist", not_interested: "Not interested", skipped: "Skipped", unsure: "Unsure",
};

export function LibraryItemCard({ content, interaction, note }: {
  content: Tables<"content_items">;
  interaction?: Tables<"user_content_interactions"> | undefined;
  note?: string | undefined;
}) {
  const poster = getTmdbImageUrl(content.poster_path, "w342");
  return <Card className="grid grid-cols-[6.5rem_1fr] gap-0 py-0 sm:grid-cols-[8rem_1fr]">
    <div className="relative min-h-48 bg-muted">{poster ? <Image alt={`Poster for ${content.title}`} className="object-cover" fill sizes="128px" src={poster} /> : null}</div>
    <div className="min-w-0 py-4"><CardHeader><div className="flex flex-wrap items-start justify-between gap-2"><CardTitle className="line-clamp-2">{content.title}</CardTitle><Badge variant="outline">{content.media_type === "movie" ? "Movie" : "TV"}</Badge></div><p className="text-xs text-muted-foreground">{content.release_date?.slice(0, 4) ?? "Year unknown"}{interaction ? ` · ${labels[interaction.interaction_type]}` : ""}</p></CardHeader><CardContent className="space-y-3">{note ? <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{note}</p> : null}{interaction ? <form action={updateLibraryItemAction} className="flex flex-wrap gap-2"><input name="contentId" type="hidden" value={content.id} /><input name="intent" type="hidden" value="update" /><label className="sr-only" htmlFor={`type-${interaction.id}`}>Classification</label><select className={selectClass} defaultValue={interaction.interaction_type} id={`type-${interaction.id}`} name="interactionType">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="sr-only" htmlFor={`rating-${interaction.id}`}>Personal rating</label><select className={selectClass} defaultValue={interaction.rating ?? ""} id={`rating-${interaction.id}`} name="rating"><option value="">No rating</option>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}/10</option>)}</select><Button size="sm" type="submit">Save</Button></form> : null}<div className="flex flex-wrap gap-2"><form action={updateLibraryItemAction}><input name="contentId" type="hidden" value={content.id} /><input name="intent" type="hidden" value="watched" /><Button size="sm" type="submit" variant="outline"><Check /> Mark watched</Button></form><form action={updateLibraryItemAction}><input name="contentId" type="hidden" value={content.id} /><input name="intent" type="hidden" value="remove" /><Button size="sm" type="submit" variant="destructive"><Trash2 /> Remove</Button></form></div></CardContent></div>
  </Card>;
}
