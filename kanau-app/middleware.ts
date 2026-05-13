import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SESSION_COOKIE_NAME = "kanau_session_expires_at";
const SESSION_MAX_AGE_SECONDS = 30 * 60;

const PUBLIC_PATHS = ["/login", "/signup"];
const PUBLIC_API_PATHS = ["/api/login", "/api/signup"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isPublicApiPath(pathname: string) {
  return PUBLIC_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const now = Date.now();

  if (!user) {
    response.cookies.delete(SESSION_COOKIE_NAME);

    if (isPublicPath(pathname) || isPublicApiPath(pathname)) {
      return response;
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const expiresAt = Number(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!expiresAt || Number.isNaN(expiresAt) || expiresAt <= now) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));

    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-") || name === SESSION_COOKIE_NAME) {
        redirectResponse.cookies.delete(name);
      }
    });

    return redirectResponse;
  }

  response.cookies.set(SESSION_COOKIE_NAME, String(now + SESSION_MAX_AGE_SECONDS * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  if (pathname.startsWith("/mentor")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role && profile.role !== "mentor") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  if (pathname.startsWith("/student")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role && profile.role !== "student") {
      return NextResponse.redirect(new URL("/mentor", request.url));
    }
  }

  if (isPublicPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const destination = profile?.role === "mentor" ? "/mentor" : "/student";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
