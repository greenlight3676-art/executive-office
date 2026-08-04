import { timingSafeEqual } from "crypto";
import { FORGE_OWNER_HEADER } from "@/lib/auth/constants";

export { FORGE_OWNER_HEADER };

export function isOwnerKeyConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.FORGE_OWNER_KEY?.trim());
}

export function verifyOwnerKey(
  candidate: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
) {
  const expected = env.FORGE_OWNER_KEY?.trim();
  const supplied = candidate?.trim();
  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}
