import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // 未ログイン → loginへ
  if (!user && !["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // role取得
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // role が取得できたときだけ、他ロール画面へのアクセスを制限する
    if (pathname.startsWith("/mentor") && role && role !== "mentor") {
      return NextResponse.redirect(new URL("/student", request.url));
    }

    if (pathname.startsWith("/student") && role && role !== "student") {
      return NextResponse.redirect(new URL("/mentor", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};