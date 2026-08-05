import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureAudienceMember,
  triggerCustomerJourney,
  validateMailchimpTriggerUrl,
} from "@/lib/birthday/mailchimp";

const goodUrl =
  "https://us10.api.mailchimp.com/3.0/customer-journeys/journeys/172/steps/1260/actions/trigger";

describe("Mailchimp URL validation", () => {
  beforeEach(() => {
    process.env.MAILCHIMP_API_KEY = "test-key";
    process.env.MAILCHIMP_SERVER_PREFIX = "us10";
  });

  it("permits only HTTPS Customer Journey URLs on the expected Mailchimp host", () => {
    expect(validateMailchimpTriggerUrl(goodUrl)).toBe(goodUrl);
    expect(() => validateMailchimpTriggerUrl("http://us10.api.mailchimp.com/3.0/customer-journeys/x")).toThrow();
    expect(() => validateMailchimpTriggerUrl("https://127.0.0.1/3.0/customer-journeys/x")).toThrow();
    expect(() => validateMailchimpTriggerUrl("https://example.com/3.0/customer-journeys/x")).toThrow();
  });
});

describe("Mailchimp responses", () => {
  beforeEach(() => {
    process.env.MAILCHIMP_API_KEY = "test-key";
    process.env.MAILCHIMP_SERVER_PREFIX = "us10";
    vi.restoreAllMocks();
  });

  it.each([400, 401, 404])("does not retry non-retryable %i responses", async (status) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ title: "Bad request", status }), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await triggerCustomerJourney(goodUrl, "parent@example.com");
    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("includes Mailchimp's sanitized error detail in failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Invalid Resource",
          detail: "The contact must be in the journey audience.",
          status: 400,
          secret: "not exposed",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const result = await triggerCustomerJourney(goodUrl, "parent@example.com");

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errorMessage:
        "Mailchimp returned 400. The contact must be in the journey audience.",
      response: {
        title: "Invalid Resource",
        detail: "The contact must be in the journey audience.",
      },
    });
  });

  it.each([429, 500])("retries transient %i responses", async (status) => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await triggerCustomerJourney(goodUrl, "parent@example.com");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports timeouts as retryable failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
    const result = await triggerCustomerJourney(goodUrl, "parent@example.com", { retries: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryable).toBe(true);
  });

  it("does not silently resubscribe unsubscribed contacts", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "unsubscribed" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await ensureAudienceMember("audience", {
      email: "parent@example.com",
      firstName: "Pat",
      lastName: "Parent",
    });
    expect(result).toMatchObject({ ok: true, skipped: true, status: "unsubscribed" });
  });

  it("adds all required guardian fields for a new audience member", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const result = await ensureAudienceMember("audience", {
      email: "guardian@example.com",
      firstName: "Grace",
      lastName: "Guardian",
    });

    expect(result).toMatchObject({ ok: true, status: "subscribed" });
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          email_address: "guardian@example.com",
          status_if_new: "subscribed",
          merge_fields: { FNAME: "Grace", LNAME: "Guardian" },
        }),
      }),
    );
  });
});
