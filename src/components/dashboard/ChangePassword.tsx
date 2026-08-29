"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function ChangePassword() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to change password.");
        return;
      }

      setSaved(true);
      form.reset();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Change Password" subtitle="Update the password used to sign in." />
      <div className="max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="currentPassword">
              Current Password
            </label>
            <input id="currentPassword" name="currentPassword" type="password" className="field-input" required />
          </div>
          <div>
            <label className="field-label" htmlFor="newPassword">
              New Password
            </label>
            <input id="newPassword" name="newPassword" type="password" className="field-input" required />
          </div>
          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" className="field-input" required />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {saved && <p className="text-sm font-medium text-emerald-600">Password updated successfully.</p>}
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
              {submitting ? "Updating..." : "Change Password"}
            </button>
            <button type="reset" className="btn-outline" disabled={submitting}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
