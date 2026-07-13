const protectedRoutes = [
  "/discover",
  "/rate",
  "/recommendations",
  "/watchlist",
  "/history",
  "/settings",
] as const;

export function isProtectedPath(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/discover";
  }

  try {
    const url = new URL(value, "https://watchmind.local");
    return isProtectedPath(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : "/discover";
  } catch {
    return "/discover";
  }
}
