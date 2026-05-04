"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.error ?? "ログインに失敗しました");
      setIsSubmitting(false);
      return;
    }

    if (data.role !== "mentor" && data.role !== "student") {
      setErrorMessage("role が取得できませんでした。プロフィールを確認してください。");
      setIsSubmitting(false);
      return;
    }

    router.push(data.role === "mentor" ? "/mentor" : "/student");
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          メールアドレスとパスワードを入力してください。
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                {showPassword ? "隠す" : "表示"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "ログイン中..." : "Login"}
          </button>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          アカウントをお持ちでないですか？{" "}
          <Link href="/signup/" className="font-medium text-blue-600 hover:underline">
            Signup
          </Link>
        </p>
      </section>
    </main>
  );
}