import { NextRequest, NextResponse } from "next/server";
import { processBirthdayCron } from "@/lib/birthday/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await processBirthdayCron();
  return NextResponse.json(summary);
}
