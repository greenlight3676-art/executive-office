import { getForgeBrainMode } from "@/lib/ai/brain-policy";

describe("Forge brain policy", () => {
  it("keeps ChatGPT as the default reasoning brain", () => {
    expect(getForgeBrainMode({} as NodeJS.ProcessEnv)).toBe("chatgpt");
  });

  it("only enables specialist routing through an explicit opt-in", () => {
    expect(
      getForgeBrainMode({ FORGE_SPECIALIST_MODE: "true" } as NodeJS.ProcessEnv),
    ).toBe("specialists");
  });
});
