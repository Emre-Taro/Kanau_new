import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "kanau_session_expires_at";
const SESSION_MAX_AGE_SECONDS = 30 * 60;

export async function POST(request: Request) {
  const { email, password, role } = await request.json();

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "email, password, role は必須です" },
      { status: 400 }
    );
  }

  if (!["student", "mentor"].includes(role)) {
    return NextResponse.json(
      { error: "role が不正です" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "ユーザー作成に失敗しました" },
      { status: 400 }
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      role,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ user: data.user, role });

  response.cookies.set(SESSION_COOKIE_NAME, String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}