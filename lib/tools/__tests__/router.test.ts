import { buildToolRouterPrompt, detectToolAction } from "@/lib/tools/router";

describe("AI tool router", () => {
  it("detects safe read-only tool actions", () => {
    const proposal = detectToolAction("Orynth, check Gmail for new customer replies", "orynth");
    expect(proposal).toMatchObject({ tool: "gmail", action: "read-email", risk: "safe" });
  });

  it("requires approval for external sends and workspace writes", () => {
    expect(detectToolAction("Vyreel, send email to the client", "vyreel")).toMatchObject({
      tool: "gmail",
      action: "send-external-message",
      risk: "approval_required",
    });
    expect(detectToolAction("Orynth, add this lead to the Google Sheet", "orynth")).toMatchObject({
      tool: "google-sheets",
      action: "append-sheet-row",
      risk: "approval_required",
    });
  });

  it("routes GitHub changes into specific approval actions", () => {
    expect(detectToolAction("Brayko, create pull request for this", "brayko")).toMatchObject({
      action: "create-pull-request",
      risk: "approval_required",
    });
    expect(detectToolAction("Brayko, merge the PR", "brayko")).toMatchObject({
      action: "merge-pull-request",
      risk: "approval_required",
    });
  });

  it("detects safe database reads and gates database writes", () => {
    expect(detectToolAction("Orynth, check Supabase for active leads", "orynth")).toMatchObject({
      tool: "supabase",
      action: "read-database",
      risk: "safe",
    });
    expect(detectToolAction("Brayko, update database with this record", "brayko")).toMatchObject({
      action: "write-database",
      risk: "approval_required",
    });
  });

  it("blocks executives from using tools outside their lane", () => {
    const proposal = detectToolAction("Kavro, push this to GitHub", "kavro");
    expect(proposal).toMatchObject({ tool: "github", action: "commit-code", risk: "unsupported" });
  });

  it("builds a prompt that does not claim execution", () => {
    const proposal = detectToolAction("Brayko, run code in E2B", "brayko");
    expect(proposal?.risk).toBe("safe");
    expect(buildToolRouterPrompt(proposal!)).toContain("do not claim it ran");
  });
});
