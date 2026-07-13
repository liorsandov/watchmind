import { Clock3, Film, ImageOff, Star } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ContentItem } from "@/types/media";

interface ContentCardProps {
  item: ContentItem;
  priority?: boolean;
}

export function ContentCard({ item, priority = false }: ContentCardProps) {
  const runtime = item.runtimeMinutes ?? item.episodeRuntimeMinutes;

  return (
    <Card className="group h-full gap-0 overflow-hidden py-0">
      <div className="relative aspect-2/3 overflow-hidden bg-muted">
        {item.posterUrl ? (
          <Image
            alt={`${item.title} poster`}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            fill
            priority={priority}
            sizes="(max-width: 640px) 44vw, (max-width: 1024px) 28vw, 220px"
            src={item.posterUrl}
          />
        ) : (
          <div className="grid size-full place-items-center bg-linear-to-br from-muted to-background text-muted-foreground">
            <div className="space-y-2 text-center">
              <ImageOff aria-hidden="true" className="mx-auto size-8" />
              <span className="text-xs">Poster unavailable</span>
            </div>
          </div>
        )}
        <Badge className="absolute start-2 top-2 capitalize" variant="secondary">
          <Film aria-hidden="true" />
          {item.mediaType === "tv" ? "TV" : "Movie"}
        </Badge>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 font-semibold leading-5">{item.title}</h3>
          <p className="text-xs text-muted-foreground">
            {item.releaseYear ?? "Year unknown"}
            {item.originalLanguage
              ? ` · ${item.originalLanguage.toUpperCase()}`
              : " · Language unknown"}
          </p>
        </div>
        <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
          {item.overview ?? "No overview is available for this title yet."}
        </p>
        <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star aria-hidden="true" className="size-3.5 text-primary" />
            {item.voteAverage === null ? "Not rated" : item.voteAverage.toFixed(1)}
          </span>
          {runtime ? (
            <span className="flex items-center gap-1">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {runtime} min{item.mediaType === "tv" ? " / episode" : ""}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
