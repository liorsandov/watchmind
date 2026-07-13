import type { ContentItem } from "@/types/media";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const validImagePath = /^\/[A-Za-z0-9._/-]+$/;

export type PosterSize = "w342" | "w500" | "w780" | "original";
export type BackdropSize = "w780" | "w1280" | "original";

export function getTmdbImageUrl(
  path: string | null | undefined,
  size: PosterSize | BackdropSize,
) {
  return path && validImagePath.test(path)
    ? `${TMDB_IMAGE_BASE_URL}/${size}${path}`
    : null;
}

export function getContentImageUrls(
  posterPath: ContentItem["posterPath"],
  backdropPath: ContentItem["backdropPath"],
) {
  return {
    posterUrl: getTmdbImageUrl(posterPath, "w500"),
    backdropUrl: getTmdbImageUrl(backdropPath, "w1280"),
  };
}
