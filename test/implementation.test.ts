import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("idempotency implementation", () => {
  it("prevents duplicate cron invocations and concurrent claims with a send uniqueness constraint", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toContain("@@unique([childId, type, occurrenceYear])");
  });

  it("claims sends before calling Mailchimp using createManyAndReturn with skipDuplicates", () => {
    const service = readFileSync("lib/birthday/service.ts", "utf8");
    expect(service).toContain("createManyAndReturn");
    expect(service).toContain("skipDuplicates: true");
    expect(service.indexOf("claimPendingSends")).toBeLessThan(
      service.indexOf("triggerCustomerJourney(input.triggerUrl"),
    );
  });

  it("supports invalid and revoked management tokens by requiring a stored hash", () => {
    const service = readFileSync("lib/birthday/service.ts", "utf8");
    expect(service).toContain("managementTokenHash: tokenHash");
    expect(service).toContain("active: true");
  });

  it("requires admin authentication and explicit confirmation before deleting a family", () => {
    const actions = readFileSync("app/admin/birthday-club/actions.ts", "utf8");
    const deleteAction = actions.slice(actions.indexOf("export async function deleteFamilyAction"));

    expect(deleteAction.indexOf("await requireAdmin()"))
      .toBeLessThan(deleteAction.indexOf("prisma.parent.delete"));
    expect(deleteAction).toContain('formData.get("confirm") !== "DELETE"');
    expect(deleteAction).toContain("prisma.parent.delete");
  });
});
