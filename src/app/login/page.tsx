"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const memberId = String(formData.get("memberId") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to sign in.");
        setSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome to PRIMEFX"
      subtitle="To keep connected with us please login with your personal information by user ID and password."
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
          <Link href="/forgot-password" className="font-semibold text-brand-purple hover:underline">
            Forgot Password?
          </Link>
          <span className="text-gray-300">·</span>
          <span>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-brand-purple hover:underline">
              Sign up
            </Link>
          </span>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="memberId"
            placeholder="Enter Member ID"
            autoComplete="username"
            className="input-pill w-full px-5 pl-11"
            required
          />
        </div>

        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            className="input-pill w-full px-5 pl-11 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>

        <label className="flex select-none items-center gap-2 pl-1 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple-light"
          />
          Remember Me
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <button type="submit" className="btn-brand mt-2 disabled:opacity-70" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
