import { getForgeBrainMode } from "@/lib/ai/brain-policy";

describe("Forge brain policy", () => {
  it("keeps ChatGPT as the default reasoning brain", () => {
    expect(getForgeBrainMode({})).toBe("chatgpt-first");
  });

  it("enables specialist providers only when explicitly requested", () => {
    expect(getForgeBrainMode({ FORGE_SPECIALIST_MODE: "true" })).toBe("specialists");
    expect(getForgeBrainMode({ FORGE_SPECIALIST_MODE: " TRUE " })).toBe("specialists");
  });

  it("does not accidentally enable specialist mode", () => {
    expect(getForgeBrainMode({ FORGE_SPECIALIST_MODE: "false" })).toBe("chatgpt-first");
    expect(getForgeBrainMode({ FORGE_SPECIALIST_MODE: "1" })).toBe("chatgpt-first");
  });
});
