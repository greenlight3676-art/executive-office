import { isOwnerKeyConfigured, verifyOwnerKey } from "@/lib/auth/owner";

describe("Forge owner key", () => {
  it("requires an explicitly configured key", () => {
    expect(isOwnerKeyConfigured({} as NodeJS.ProcessEnv)).toBe(false);
    expect(isOwnerKeyConfigured({ FORGE_OWNER_KEY: "secret" } as NodeJS.ProcessEnv)).toBe(true);
  });

  it("uses exact constant-time key matching", () => {
    const env = { FORGE_OWNER_KEY: "owner-secret" } as NodeJS.ProcessEnv;
    expect(verifyOwnerKey("owner-secret", env)).toBe(true);
    expect(verifyOwnerKey("owner-wrong", env)).toBe(false);
    expect(verifyOwnerKey("short", env)).toBe(false);
  });
});
