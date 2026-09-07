"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { InfoCard } from "@/components/dashboard/shared/InfoCard";
import { CardSkeleton } from "@/components/dashboard/shared/Skeleton";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { COUNTRY_CODES } from "@/lib/countryCodes";

type ProfileData = {
  memberId: string;
  username: string;
  email: string;
  countryCode: string;
  mobile: string;
  sponsorId: string | null;
  createdAt: string;
  canRefer: boolean;
};

export function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    loadProfile();
  }, []);

  function loadProfile() {
    let cancelled = false;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
        } else {
          setProfile(data.profile);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Unable to load profile.");
      });
    return () => {
      cancelled = true;
    };
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      username: String(formData.get("username") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      countryCode: String(formData.get("countryCode") ?? ""),
      mobile: String(formData.get("mobile") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? "Unable to update profile.");
        return;
      }

      setProfile(data.profile);
      setEditing(false);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const referralLink = profile && origin ? `${origin}/signup?ref=${profile.memberId}` : "";

  async function copyReferralLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore silently
    }
  }

  let body: React.ReactNode;
  if (loadError) {
    body = (
      <p className="max-w-md rounded-2xl border border-red-100 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
        {loadError}
      </p>
    );
  } else if (!profile) {
    body = (
      <div className="max-w-md space-y-6">
        <CardSkeleton lines={6} />
        <CardSkeleton lines={2} />
      </div>
    );
  } else if (editing) {
    body = (
      <div className="max-w-md space-y-6">
        <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[color:var(--fincept-text)]">Edit Profile</h2>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="field-label" htmlFor="editUsername">
                Name
              </label>
              <input
                id="editUsername"
                name="username"
                type="text"
                defaultValue={profile.username}
                className="field-input"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="editEmail">
                Email
              </label>
              <input
                id="editEmail"
                name="email"
                type="email"
                defaultValue={profile.email}
                className="field-input"
                required
              />
            </div>
            <div className="flex gap-2">
              <select name="countryCode" defaultValue={profile.countryCode} className="field-input w-[40%] shrink-0">
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                name="mobile"
                type="tel"
                defaultValue={profile.mobile}
                className="field-input flex-1"
                required
              />
            </div>
            {saveError && <p className="text-sm font-medium text-red-500">{saveError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-solid disabled:opacity-70" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveError(null);
                  setEditing(false);
                }}
                className="btn-outline"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="max-w-md space-y-6">
        <InfoCard
          rows={[
            { label: "Sponsor ID", value: profile.sponsorId ?? "—" },
            { label: "My User ID", value: profile.memberId },
            { label: "Name", value: profile.username },
            { label: "Email", value: profile.email },
            { label: "Mobile", value: `${profile.countryCode} ${profile.mobile}` },
            { label: "Member Since", value: new Date(profile.createdAt).toLocaleDateString() },
          ]}
          footer={
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditing(true)} className="btn-solid">
                Edit
              </button>
              {saved && (
                <span className="text-sm font-medium text-emerald-300">
                  Profile updated — confirmation emailed to you.
                </span>
              )}
            </div>
          }
        />

        {profile.canRefer ? (
          <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Your Referral Link</h2>
            <p className="mt-1 text-xs text-[color:var(--fincept-text-muted)]">
              Share this link — anyone who signs up through it is added under you as their sponsor.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate rounded-xl bg-[color:var(--fincept-bg-soft)] px-3 py-2.5 text-left font-mono text-xs text-[color:var(--fincept-text-muted)]">
                {copied ? "Copied to clipboard!" : referralLink}
              </p>
              <button
                type="button"
                onClick={copyReferralLink}
                aria-label={copied ? "Link copied" : "Copy referral link"}
                title={copied ? "Copied!" : "Copy referral link"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-bg-soft)] text-[color:var(--fincept-text-muted)] transition hover:border-[color:var(--fincept-green)] hover:text-[color:var(--fincept-text)]"
              >
                {copied ? <CheckIcon className="h-4 w-4 text-emerald-300" /> : <CopyIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:var(--fincept-border)] bg-[color:var(--fincept-card)] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[color:var(--fincept-text)]">Your Referral Link</h2>
            <p className="mt-1 text-xs text-[color:var(--fincept-text-muted)]">
              Deposit $50 or more (and get it approved) to unlock your referral link and start sponsoring
              new members.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account details." />
      {body}
    </div>
  );
}
