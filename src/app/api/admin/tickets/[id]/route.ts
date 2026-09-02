import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminGuard";
import { logAdminAction } from "@/lib/audit";
import { sendMail } from "@/lib/mailer";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { session } = guard;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ticket id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;

  const db = await getDb();
  const ticket = await db.collection("tickets").findOne({ _id: new ObjectId(id) });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  if (action === "reply") {
    const reply = typeof body?.reply === "string" ? body.reply.trim() : "";
    if (!reply) {
      return NextResponse.json({ error: "Enter a reply message." }, { status: 400 });
    }

    await db.collection("tickets").updateOne(
      { _id: ticket._id },
      { $set: { reply, status: "Replied", repliedBy: session.username, repliedAt: new Date() } }
    );

    await logAdminAction(db, {
      actor: session.username,
      action: "ticket.reply",
      target: ticket.memberId,
      details: { ticketId: id },
    });

    const user = await db.collection("users").findOne({ memberId: ticket.memberId });
    if (user?.email) {
      await sendMail(
        user.email,
        "Support ticket reply — PRIMEFX",
        [`Your support ticket has a new reply:`, "", reply].join("\n")
      );
    }

    return NextResponse.json({ id, status: "Replied" });
  }

  if (action === "close") {
    await db.collection("tickets").updateOne({ _id: ticket._id }, { $set: { status: "Closed" } });
    await logAdminAction(db, {
      actor: session.username,
      action: "ticket.close",
      target: ticket.memberId,
      details: { ticketId: id },
    });
    return NextResponse.json({ id, status: "Closed" });
  }

  return NextResponse.json({ error: "action must be 'reply' or 'close'." }, { status: 400 });
}
