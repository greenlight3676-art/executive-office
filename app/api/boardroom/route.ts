import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { resolveExecutiveProvider } from "@/lib/ai/router";

const executives = [
  { id: "brayko", name: "Brayko", role: "Chief Builder", focus: "technical plan, architecture, milestones, and implementation risks" },
  { id: "lunexa", name: "Lunexa", role: "Creative Director", focus: "user experience, visual direction, product clarity, and brand" },
  { id: "vyreel", name: "Vyreel", role: "Growth Executive", focus: "launch, audience, acquisition, positioning, and distribution" },
  { id: "orynth", name: "Orynth", role: "Operations Executive", focus: "sequence, ownership, blockers, deadlines, and execution" },
  { id: "kavro", name: "Kavro", role: "Finance Executive", focus: "budget, cost control, tradeoffs, revenue, and runway" },
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mission = typeof body?.mission === "string" ? body.mission.trim() : "";

    if (!mission) {
      return NextResponse.json({ error: "A mission is required." }, { status: 400 });
    }

    const config = getProviderConfig(process.env);

    const responses = await Promise.all(
      executives.map(async (executive) => {
        try {
          const provider = resolveExecutiveProvider(executive.id, config);
          const result = await provider.send({
            executive: executive.id,
            mode: "default",
            maxOutputTokens: 320,
            message: [
              `You are ${executive.name}, Forge's ${executive.role}.`,
              `Your responsibility is ${executive.focus}.`,
              `Mission from TJ: ${mission}`,
              "Give a direct boardroom response using exactly these headings:",
              "POSITION",
              "TOP RISK",
              "NEXT 3 ACTIONS",
              "VOTE: APPROVE or REVISE",
              "Be specific, practical, and concise. Do not pretend work has already been completed.",
            ].join("\n"),
          });

          return {
            executive: executive.name,
            role: executive.role,
            provider: result.provider,
            model: result.model,
            text: result.text,
            status: "complete" as const,
          };
        } catch (error) {
          return {
            executive: executive.name,
            role: executive.role,
            provider: null,
            model: null,
            text: error instanceof Error ? error.message : "Executive response failed.",
            status: "failed" as const,
          };
        }
      }),
    );

    const completed = responses.filter((response) => response.status === "complete");
    const approved = completed.filter((response) => /VOTE:\s*APPROVE/i.test(response.text)).length;
    const revised = completed.filter((response) => /VOTE:\s*REVISE/i.test(response.text)).length;

    return NextResponse.json({
      mission,
      responses,
      decision: {
        outcome: completed.length === 0 ? "blocked" : approved >= revised ? "approved" : "revise",
        approved,
        revise: revised,
        completed: completed.length,
        total: executives.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run the boardroom." },
      { status: 500 },
    );
  }
}
