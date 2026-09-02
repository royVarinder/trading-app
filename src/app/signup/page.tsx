"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { EyeIcon, EyeOffIcon, IdIcon, LockIcon, MailIcon, ShieldIcon, UserIcon } from "@/components/icons";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "United States (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showTxnPassword, setShowTxnPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const sponsorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setReferredBy(ref);
      if (sponsorInputRef.current) {
        sponsorInputRef.current.value = ref;
      }
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      sponsorId: String(formData.get("sponsorId") ?? "").trim(),
      username: String(formData.get("username") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      countryCode: String(formData.get("countryCode") ?? ""),
      mobile: String(formData.get("mobile") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      transactionPassword: String(formData.get("transactionPassword") ?? ""),
      acceptedTerms,
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create account.");
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
      subtitle="To keep connected with us please sign up with your personal information by email address and password."
      footer={
        <span>
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-brand-purple hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <IdIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={sponsorInputRef}
            type="text"
            name="sponsorId"
            placeholder="Sponsor ID"
            className="input-pill w-full px-5 pl-11"
          />
        </div>
        {referredBy && (
          <p className="-mt-2 pl-1 text-xs font-medium text-emerald-600">Referred by {referredBy}</p>
        )}

        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="username"
            placeholder="Enter User Name"
            autoComplete="username"
            className="input-pill w-full px-5 pl-11"
            required
          />
        </div>

        <div className="relative">
          <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            autoComplete="email"
            className="input-pill w-full px-5 pl-11"
            required
          />
        </div>

        <div className="flex gap-2">
          <select
            name="countryCode"
            defaultValue="+91"
            className="input-pill w-[40%] shrink-0 appearance-none px-5"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            autoComplete="tel"
            className="input-pill flex-1 px-5"
            required
          />
        </div>

        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoComplete="new-password"
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

        <div className="relative">
          <ShieldIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showTxnPassword ? "text" : "password"}
            name="transactionPassword"
            placeholder="Transaction password"
            autoComplete="new-password"
            className="input-pill w-full px-5 pl-11 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowTxnPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showTxnPassword ? "Hide transaction password" : "Show transaction password"}
          >
            {showTxnPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>

        <label className="flex select-none items-start gap-2 pl-1 text-xs leading-relaxed text-gray-600">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-purple focus:ring-brand-purple-light"
            required
          />
          <span>
            I have read and accept the{" "}
            <Link href="#" className="font-semibold text-brand-purple hover:underline">
              terms &amp; conditions
            </Link>
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <button type="submit" className="btn-brand mt-2 disabled:opacity-70" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </AuthShell>
  );
}
