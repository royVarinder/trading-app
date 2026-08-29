"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";

export function TicketSubmit({ memberId }: { memberId: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const message = String(new FormData(form).get("description") ?? "").trim();

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create ticket.");
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
      <PageHeader title="Ticket Submit" subtitle="Open a support ticket with our team." />
      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">User ID</label>
            <input value={memberId} disabled className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="ticketDescription">
              Description
            </label>
            <textarea
              id="ticketDescription"
              name="description"
              rows={5}
              placeholder="Enter Description"
              className="field-input resize-none"
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {saved && <p className="text-sm font-medium text-emerald-600">Ticket created successfully.</p>}
          <button type="submit" className="btn-solid disabled:opacity-70" disabled={submitting}>
            {submitting ? "Submitting..." : "Create Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
