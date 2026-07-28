jest.mock("e2b", () => ({
  Sandbox: {
    create: jest.fn(),
  },
}));

import { Sandbox } from "e2b";
import { isE2BConfigured, runE2BSandboxSmokeTest } from "@/lib/sandbox/e2b";

const mockedSandbox = Sandbox as jest.Mocked<typeof Sandbox>;

describe("E2B sandbox adapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports whether E2B is configured", () => {
    expect(isE2BConfigured({} as NodeJS.ProcessEnv)).toBe(false);
    expect(isE2BConfigured({ E2B_API_KEY: "e2b_key" } as NodeJS.ProcessEnv)).toBe(true);
  });

  it("runs a fixed smoke command and kills the sandbox", async () => {
    const kill = jest.fn().mockResolvedValue(true);
    const run = jest.fn().mockResolvedValue({
      exitCode: 0,
      stdout: "forge-sandbox-ready",
      stderr: "",
    });

    mockedSandbox.create.mockResolvedValue({
      sandboxId: "sbx_123",
      commands: { run },
      kill,
    } as Awaited<ReturnType<typeof Sandbox.create>>);

    const result = await runE2BSandboxSmokeTest({ E2B_API_KEY: "e2b_key" } as NodeJS.ProcessEnv);

    expect(mockedSandbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "e2b_key",
        allowInternetAccess: false,
        metadata: expect.objectContaining({ executive: "brayko" }),
      }),
    );
    expect(run).toHaveBeenCalledWith("printf forge-sandbox-ready", expect.any(Object));
    expect(kill).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.sandboxId).toBe("sbx_123");
  });

  it("rejects when the E2B key is missing", async () => {
    await expect(runE2BSandboxSmokeTest({} as NodeJS.ProcessEnv)).rejects.toThrow("E2B_API_KEY");
    expect(mockedSandbox.create).not.toHaveBeenCalled();
  });
});