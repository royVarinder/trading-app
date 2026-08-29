"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { MailIcon } from "@/components/icons";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const identifier = String(new FormData(e.currentTarget).get("identifier") ?? "").trim();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to process your request.");
        return;
      }

      setMessage(data.message ?? "If an account matches, we've sent a reset link.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your Member ID or the email address on your account and we'll send you a reset link."
      footer={
        <span>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-purple hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="identifier"
            placeholder="Member ID or Email Address"
            className="input-pill w-full px-5 pl-11"
            required
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">{error}</p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-600">
            {message}
          </p>
        )}

        <button type="submit" className="btn-brand mt-2 disabled:opacity-70" disabled={submitting}>
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </AuthShell>
  );
}
