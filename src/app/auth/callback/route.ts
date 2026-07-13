import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/config/public-env";
import { getSafeNextPath } from "@/lib/auth/redirect";
import type { Database } from "@/types/database";

const otpTypes = new Set<EmailOtpType>([
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const destination = new URL(
    getSafeNextPath(requestUrl.searchParams.get("next")),
    request.url,
  );
  let response = NextResponse.redirect(destination);
  const env = getPublicEnv();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          response = NextResponse.redirect(destination);
          cookiesToSet.forEach(
            ({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  let error: Error | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type && otpTypes.has(type)) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = new Error("Missing authentication code.");
  }

  if (error) {
    return NextResponse.redirect(new URL("/login?error=callback", request.url));
  }

  return response;
}
