import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "kanau_session_expires_at";
const SESSION_MAX_AGE_SECONDS = 30 * 60;

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "ログインに失敗しました" },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "プロフィールが見つかりません" },
      { status: 404 }
    );
  }

  if (!["student", "mentor"].includes(profile.role)) {
    return NextResponse.json(
      { error: "プロフィールの role が不正です" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    user: data.user,
    role: profile.role,
  });

  response.cookies.set(SESSION_COOKIE_NAME, String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}