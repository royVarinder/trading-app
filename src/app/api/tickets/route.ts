import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { sendAdminEmail } from "@/lib/mailer";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = await getDb();
  const tickets = await db
    .collection("tickets")
    .find({ memberId: session.memberId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t._id.toString(),
      message: t.message,
      reply: t.reply ?? null,
      status: t.status,
      createdAt: t.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Please enter a description." }, { status: 400 });
  }

  const db = await getDb();
  const doc = {
    memberId: session.memberId,
    username: session.username,
    message,
    reply: null as string | null,
    status: "Open",
    createdAt: new Date(),
  };
  const result = await db.collection("tickets").insertOne(doc);

  await sendAdminEmail(
    "New support ticket — PRIMEFX",
    [
      "A new support ticket was submitted.",
      "",
      `Member ID: ${session.memberId}`,
      `Username: ${session.username}`,
      `Message: ${message}`,
    ].join("\n")
  );

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      message: doc.message,
      reply: doc.reply,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    { status: 201 }
  );
}
