import { buildToolRouterPrompt, detectToolAction } from "@/lib/tools/router";

describe("AI tool router", () => {
  it("detects safe read-only tool actions", () => {
    const proposal = detectToolAction("Orynth, check Gmail for new customer replies", "orynth");

    expect(proposal).toMatchObject({
      tool: "gmail",
      action: "read-email",
      risk: "safe",
      executiveId: "orynth",
    });
  });

  it("requires approval for external sends", () => {
    const proposal = detectToolAction("Vyreel, send email to the client with this update", "vyreel");

    expect(proposal).toMatchObject({
      tool: "gmail",
      action: "send-external-message",
      risk: "approval_required",
    });
  });

  it("detects read-only calendar and GitHub inspections", () => {
    expect(detectToolAction("Orynth, check calendar today", "orynth")).toMatchObject({
      tool: "calendar",
      action: "read-calendar",
      risk: "safe",
    });

    expect(detectToolAction("Brayko, inspect repo status", "brayko")).toMatchObject({
      tool: "github",
      action: "inspect-repository",
      risk: "safe",
    });
  });

  it("routes broad app repair requests to repository inspection first", () => {
    expect(detectToolAction("Brayko, fix my Forge app and make it work like Jarvis", "brayko")).toMatchObject({
      tool: "github",
      action: "inspect-repository",
      risk: "safe",
    });
  });

  it("blocks executives from using tools outside their lane", () => {
    const proposal = detectToolAction("Kavro, push this to GitHub", "kavro");

    expect(proposal).toMatchObject({
      tool: "github",
      action: "commit-code",
      risk: "unsupported",
    });
    expect(proposal?.reason).toContain("Kavro");
  });

  it("builds a prompt that does not claim execution", () => {
    const proposal = detectToolAction("Brayko, run code in E2B", "brayko");

    expect(proposal?.risk).toBe("safe");
    expect(buildToolRouterPrompt(proposal!)).toContain("do not claim it ran");
  });
});