import {
  getApiAuthStatus,
  isApiAuthConfigured,
  isApiAuthMisconfiguredForProduction,
} from "@/lib/auth/api";
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

  it("fails closed when production auth is not configured", () => {
    const productionEnv = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
    expect(isApiAuthConfigured(productionEnv)).toBe(false);
    expect(isApiAuthMisconfiguredForProduction(productionEnv)).toBe(true);
    expect(getApiAuthStatus(productionEnv).localMode).toBe(false);
  });

  it("permits explicit owner-key auth in production", () => {
    const productionEnv = {
      NODE_ENV: "production",
      FORGE_OWNER_KEY: "owner-secret",
    } as NodeJS.ProcessEnv;
    expect(isApiAuthConfigured(productionEnv)).toBe(true);
    expect(isApiAuthMisconfiguredForProduction(productionEnv)).toBe(false);
  });

  it("requires a CEO allowlist for Supabase sign-in fallback", () => {
    const incompleteEnv = {
      NODE_ENV: "production",
      SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    } as NodeJS.ProcessEnv;
    expect(isApiAuthConfigured(incompleteEnv)).toBe(false);

    const secureEnv = {
      ...incompleteEnv,
      FORGE_CEO_EMAIL: "ceo@example.com",
    } as NodeJS.ProcessEnv;
    expect(isApiAuthConfigured(secureEnv)).toBe(true);
    expect(isApiAuthMisconfiguredForProduction(secureEnv)).toBe(false);
  });
});
