import { createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function requestIp() {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

export async function assertRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  const now = new Date();
  const key = `${scope}:${hashKey(identifier)}`;
  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      },
      update: {
        count: 1,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      },
    });
    return;
  }

  if (existing.count >= limit) {
    throw new Error("RATE_LIMITED");
  }

  await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
}
