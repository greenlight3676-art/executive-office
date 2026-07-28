import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { listExecutiveAgents, resolveExecutiveProvider } from "@/lib/ai/router";
import { createCostPolicy, enforceCostPolicy } from "@/lib/ai/cost-policy";
import { conversationStore } from "@/lib/conversations/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mission =
      typeof body?.mission === "string"
        ? body.mission.trim()
        : typeof body?.message === "string"
          ? body.message.trim()
          : "";

    if (!mission) {
      return NextResponse.json({ error: "A mission is required." }, { status: 400 });
    }

    enforceCostPolicy(mission, 400, createCostPolicy());
    const config = getProviderConfig(process.env);
    const executives = listExecutiveAgents();

    const responses = await Promise.all(
      executives.map(async (executive) => {
        try {
          const memories = await conversationStore.listMemories(executive.id, 6);
          const provider = resolveExecutiveProvider(executive.id, config);
          const result = await provider.send({
            executive: executive.id,
            mode: "default",
            maxOutputTokens: 320,
            message: [
              executive.systemPrompt,
              "",
              "RELEVANT EXECUTIVE MEMORY",
              memories.length > 0
                ? memories.map((memory) => `- ${memory.content}`).join("\n")
                : "No saved memory is relevant yet.",
              "",
              `Mission from TJ: ${mission}`,
              "",
              "Give an independent boardroom position using exactly these headings:",
              "POSITION",
              "TOP RISK",
              "NEXT 3 ACTIONS",
              "VOTE: APPROVE or REVISE",
              "Be specific and concise. Challenge weak assumptions. Do not pretend work has already been completed.",
            ].join("\n"),
          });

          await conversationStore.createMemory({
            executiveId: executive.id,
            scope: "project",
            content: `Board mission: ${mission.slice(0, 500)}\n${executive.name}'s position: ${result.text.slice(0, 900)}`,
            kind: "boardroom-position",
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
    const outcome =
      completed.length === 0 ? "blocked" : approved >= 3 ? "approved" : "revise";

    let synthesis: string | null = null;
    if (completed.length > 0) {
      try {
        const orynth = executives.find((executive) => executive.id === "orynth");
        if (!orynth) throw new Error("Orynth is not registered.");

        const synthesisProvider = resolveExecutiveProvider("orynth", config);
        const synthesisResponse = await synthesisProvider.send({
          executive: "orynth",
          mode: "default",
          maxOutputTokens: 500,
          message: [
            orynth.systemPrompt,
            "",
            `TJ'S BOARD MISSION: ${mission}`,
            `BOARD OUTCOME: ${outcome.toUpperCase()} (${approved} approve, ${revised} revise, ${completed.length}/${executives.length} responded)`,
            "",
            "EXECUTIVE POSITIONS",
            completed
              .map((response) => `${response.executive} — ${response.role}\n${response.text}`)
              .join("\n\n"),
            "",
            "Synthesize one practical plan using exactly these headings:",
            "CEO BRIEF",
            "DECISION",
            "ORDERED PLAN",
            "OWNERS",
            "OPEN QUESTION FOR TJ",
            "Resolve disagreements explicitly. Do not claim any work has been executed.",
          ].join("\n"),
        });
        synthesis = synthesisResponse.text;

        await conversationStore.createMemory({
          executiveId: "orynth",
          scope: "project",
          content: `Board synthesis for: ${mission.slice(0, 500)}\n${synthesis.slice(0, 1200)}`,
          kind: "boardroom-synthesis",
        });
      } catch {
        synthesis = "The executive positions are available, but the final Chief-of-Staff synthesis could not be generated.";
      }
    }

    return NextResponse.json({
      success: true,
      mission,
      responses,
      synthesis,
      persistence: conversationStore.persistence,
      decision: {
        outcome,
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
