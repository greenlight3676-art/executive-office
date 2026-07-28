import { Sandbox } from "e2b";

export type E2BSandboxSmokeResult = {
  ok: boolean;
  sandboxId?: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

const SMOKE_COMMAND = "printf forge-sandbox-ready";
const SANDBOX_TIMEOUT_MS = 60_000;
const COMMAND_TIMEOUT_MS = 15_000;

export function isE2BConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.E2B_API_KEY);
}

export async function runE2BSandboxSmokeTest(
  env: NodeJS.ProcessEnv = process.env,
): Promise<E2BSandboxSmokeResult> {
  if (!isE2BConfigured(env)) {
    throw new Error("E2B_API_KEY is not configured.");
  }

  const startedAt = Date.now();
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;

  try {
    sandbox = await Sandbox.create({
      apiKey: env.E2B_API_KEY,
      timeoutMs: SANDBOX_TIMEOUT_MS,
      requestTimeoutMs: COMMAND_TIMEOUT_MS,
      allowInternetAccess: false,
      metadata: {
        app: "forge",
        action: "sandbox-smoke-test",
        executive: "brayko",
      },
    });

    const result = await sandbox.commands.run(SMOKE_COMMAND, {
      requestTimeoutMs: COMMAND_TIMEOUT_MS,
    });

    return {
      ok: result.exitCode === 0 && result.stdout.trim() === "forge-sandbox-ready",
      sandboxId: sandbox.sandboxId,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    await sandbox?.kill().catch(() => false);
  }
}