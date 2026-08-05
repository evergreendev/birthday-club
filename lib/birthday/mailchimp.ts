import "server-only";

import { createHash } from "crypto";

export type MailchimpResult =
  | {
      ok: true;
      status: number;
      response: Record<string, unknown> | null;
    }
  | {
      ok: false;
      status: number | null;
      retryable: boolean;
      errorMessage: string;
      response: Record<string, unknown> | null;
    };

export type AudienceResult =
  | { ok: true; skipped: false; status: string }
  | { ok: true; skipped: true; status: string; reason: string }
  | { ok: false; errorMessage: string; status: number | null };

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const PROTECTED_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function apiHost() {
  const prefix = process.env.MAILCHIMP_SERVER_PREFIX || "us10";
  return `${prefix}.api.mailchimp.com`;
}

export function validateMailchimpTriggerUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Mailchimp trigger URL is invalid.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Mailchimp trigger URL must use HTTPS.");
  }

  if (url.username || url.password || PROTECTED_HOSTS.has(url.hostname)) {
    throw new Error("Mailchimp trigger URL host is not allowed.");
  }

  if (url.hostname !== apiHost()) {
    throw new Error(`Mailchimp trigger URL must use ${apiHost()}.`);
  }

  if (!url.pathname.startsWith("/3.0/customer-journeys/")) {
    throw new Error("Mailchimp trigger URL must be a Customer Journey trigger.");
  }

  return url.toString();
}

function authHeader() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  if (!apiKey) throw new Error("MAILCHIMP_API_KEY is not configured.");
  return `Basic ${Buffer.from(`birthday-club:${apiKey}`).toString("base64")}`;
}

async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  const json = (await response.json().catch(() => null)) as unknown;
  return sanitizeProviderPayload(json);
}

export function sanitizeProviderPayload(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const allowed = ["type", "title", "status", "detail", "instance"];
  return Object.fromEntries(
    allowed
      .filter((key) => key in source)
      .map((key) => [key, String(source[key]).slice(0, 500)]),
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function triggerCustomerJourney(
  triggerUrl: string,
  email: string,
  options: { retries?: number; timeoutMs?: number } = {},
): Promise<MailchimpResult> {
  const url = validateMailchimpTriggerUrl(triggerUrl);
  const retries = options.retries ?? 2;
  const timeoutMs = options.timeoutMs ?? 8000;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email_address: email }),
        },
        timeoutMs,
      );
      const body = await safeJson(response);

      if (response.ok) {
        return { ok: true, status: response.status, response: body };
      }

      const retryable = RETRYABLE_STATUSES.has(response.status);
      if (retryable && attempt < retries) {
        await sleep(250 * 2 ** attempt);
        continue;
      }

      return {
        ok: false,
        status: response.status,
        retryable,
        errorMessage: [
          `Mailchimp returned ${response.status}.`,
          typeof body?.detail === "string"
            ? body.detail
            : typeof body?.title === "string"
              ? body.title
              : null,
        ]
          .filter(Boolean)
          .join(" "),
        response: body,
      };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (attempt < retries) {
        await sleep(250 * 2 ** attempt);
        continue;
      }
      return {
        ok: false,
        status: null,
        retryable: true,
        errorMessage: isAbort ? "Mailchimp request timed out." : "Mailchimp request failed.",
        response: null,
      };
    }
  }

  return {
    ok: false,
    status: null,
    retryable: true,
    errorMessage: "Mailchimp request failed.",
    response: null,
  };
}

function subscriberHash(email: string) {
  return createHash("md5").update(email.toLowerCase()).digest("hex");
}

export async function ensureAudienceMember(
  audienceId: string,
  contact: { email: string; firstName: string; lastName: string },
): Promise<AudienceResult> {
  if (!audienceId) return { ok: true, skipped: false, status: "not_configured" };
  const host = apiHost();
  const memberUrl = `https://${host}/3.0/lists/${encodeURIComponent(
    audienceId,
  )}/members/${subscriberHash(contact.email)}`;

  const headers = {
    Authorization: authHeader(),
    "Content-Type": "application/json",
  };

  const existing = await fetchWithTimeout(memberUrl, { headers }, 8000);
  if (existing.ok) {
    const body = (await existing.json().catch(() => ({}))) as { status?: string };
    const status = body.status ?? "unknown";
    if (["unsubscribed", "cleaned", "pending"].includes(status)) {
      return {
        ok: true,
        skipped: true,
        status,
        reason: "Existing Mailchimp status is not resubscribed by this app.",
      };
    }

    const updated = await fetchWithTimeout(
      memberUrl,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          email_address: contact.email,
          merge_fields: {
            FNAME: contact.firstName,
            LNAME: contact.lastName,
          },
        }),
      },
      8000,
    );
    if (!updated.ok) {
      return {
        ok: false,
        status: updated.status,
        errorMessage: `Mailchimp audience update returned ${updated.status}.`,
      };
    }
    return { ok: true, skipped: false, status };
  }

  if (existing.status !== 404) {
    return {
      ok: false,
      status: existing.status,
      errorMessage: `Mailchimp audience lookup returned ${existing.status}.`,
    };
  }

  const created = await fetchWithTimeout(
    memberUrl,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        email_address: contact.email,
        status_if_new: "subscribed",
        merge_fields: {
          FNAME: contact.firstName,
          LNAME: contact.lastName,
        },
      }),
    },
    8000,
  );

  if (!created.ok) {
    return {
      ok: false,
      status: created.status,
      errorMessage: `Mailchimp audience update returned ${created.status}.`,
    };
  }

  return { ok: true, skipped: false, status: "subscribed" };
}
