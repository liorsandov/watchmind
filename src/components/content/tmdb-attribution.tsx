import Image from "next/image";

const TMDB_LOGO_URL =
  "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg";

export function TmdbAttribution() {
  return (
    <aside className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
      <a
        aria-label="Visit The Movie Database"
        className="shrink-0"
        href="https://www.themoviedb.org"
        rel="noreferrer"
        target="_blank"
      >
        <Image alt="TMDB" height={44} src={TMDB_LOGO_URL} width={44} />
      </a>
      <p>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
        Metadata and images remain subject to TMDB&apos;s terms.
      </p>
    </aside>
  );
}
