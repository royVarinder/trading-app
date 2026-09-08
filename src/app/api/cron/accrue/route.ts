import { NextResponse } from "next/server";
import { runAllAccruals } from "@/lib/accrual";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  await runAllAccruals();
  return NextResponse.json({ ok: true });
}
