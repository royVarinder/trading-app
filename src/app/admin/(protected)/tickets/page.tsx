"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { CardSkeleton } from "@/components/dashboard/shared/Skeleton";

type Ticket = {
  id: string;
  memberId: string;
  username: string;
  message: string;
  reply: string | null;
  repliedBy: string | null;
  status: string;
  createdAt: string;
};

const TABS = ["Open", "Replied", "Closed", "All"];

export default function AdminTicketsPage() {
  const [tab, setTab] = useState("Open");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  // Replying awaits a real SMTP send server-side and can resolve after the
  // admin has already switched tabs — see the deposits page for the same
  // pattern. Guard against a stale response overwriting fresh data.
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  function load() {
    const requestedTab = tab;
    fetch(`/api/admin/tickets?status=${requestedTab}`)
      .then((res) => res.json())
      .then((data) => {
        if (tabRef.current !== requestedTab) return;
        if (data.error) setError(data.error);
        else setTickets(data.tickets);
      })
      .catch(() => {
        if (tabRef.current === requestedTab) setError("Unable to load tickets.");
      });
  }

  useEffect(load, [tab]);

  async function sendReply(id: string) {
    const reply = (replyDrafts[id] ?? "").trim();
    if (!reply) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", reply }),
      });
      if (res.ok) {
        setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
        load();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function closeTicket(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (res.ok) load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Inbox of every member's support requests." />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === t ? "bg-brand-purple text-white" : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {tickets === null ? (
        error ? null : (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )
      ) : tickets.length === 0 ? (
        <p className="rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-400">
          No tickets in this view.
        </p>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#1f2430]">{t.memberId}</span>
                  <span className="ml-2 text-xs text-gray-400">{t.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-700">{t.message}</p>

              {t.reply && (
                <div className="mt-3 rounded-xl bg-brand-purple/5 px-4 py-3 text-sm text-gray-700">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-brand-purple">
                    Reply {t.repliedBy ? `by ${t.repliedBy}` : ""}
                  </span>
                  {t.reply}
                </div>
              )}

              {t.status !== "Closed" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={replyDrafts[t.id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="Write a reply..."
                    className="field-input flex-1"
                  />
                  <button
                    type="button"
                    className="btn-solid disabled:opacity-70"
                    disabled={busyId === t.id}
                    onClick={() => sendReply(t.id)}
                  >
                    Send Reply
                  </button>
                  <button
                    type="button"
                    className="btn-outline disabled:opacity-70"
                    disabled={busyId === t.id}
                    onClick={() => closeTicket(t.id)}
                  >
                    Close Ticket
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
