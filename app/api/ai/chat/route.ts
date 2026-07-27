import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { validateChatPayload } from "@/lib/ai/validation";
import { AIError, ConfigurationError, ValidationError } from "@/lib/ai/errors";
import { createCostPolicy, enforceCostPolicy } from "@/lib/ai/cost-policy";
import { loadExecutiveContext, resolveExecutiveProvider } from "@/lib/ai/router";
import { requiresApproval } from "@/lib/security/permissions";
import { createMemoryRetriever } from "@/lib/memory/retriever";
import { createMemorySaver } from "@/lib/memory/saver";
import { approvalService } from "@/lib/approvals/store";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const validated = validateChatPayload(payload);
    const config = getProviderConfig(process.env);
    const costPolicy = createCostPolicy();
    enforceCostPolicy(validated.message, 400, costPolicy);

    const executive = loadExecutiveContext(validated.executive);
    const provider = resolveExecutiveProvider(validated.executive, config);
    const retrieveMemory = createMemoryRetriever();
    const saveMemory = createMemorySaver();

    const approvalAction = detectApprovalAction(validated.message);
    if (approvalAction && requiresApproval(approvalAction)) {
      const approvalRequest = await approvalService.createApprovalRequest({
        executiveId: executive.id,
        action: approvalAction,
        reason: `The executive requested a sensitive action: ${approvalAction}`,
        riskLevel: approvalAction.includes("spend") || approvalAction.includes("paid") ? "high" : "medium",
        estimatedCost: approvalAction.includes("spend") || approvalAction.includes("paid") ? 100 : undefined,
        conversationId: validated.conversationId,
      });

      return NextResponse.json({
        success: true,
        approvalRequest,
        executive: {
          id: executive.id,
          name: executive.name,
          role: executive.role,
        },
      });
    }

    const shortTermMemory = await retrieveMemory(validated.executive, "short-term");
    const longTermMemory = await retrieveMemory(validated.executive, "long-term");
    const projectMemory = await retrieveMemory(validated.executive, "project");

    const response = await provider.send({
      message: `${executive.systemPrompt}\n\n${shortTermMemory.promptPrefix}\n\n${longTermMemory.promptPrefix}\n\n${projectMemory.promptPrefix}\n\n${validated.message}`,
      executive: validated.executive,
      mode: validated.mode === "deep" ? "deep" : "default",
      conversationId: validated.conversationId,
      maxOutputTokens: executive.maxOutputTokens,
    });

    const structuredProposal = tryParseStructuredProposal(response.text);
    if (structuredProposal) {
      await approvalService.createApprovalRequest({
        executiveId: structuredProposal.executiveId,
        action: structuredProposal.action,
        reason: structuredProposal.reason,
        riskLevel: structuredProposal.riskLevel,
        estimatedCost: structuredProposal.estimatedCost,
        conversationId: validated.conversationId,
      });
    }

    await saveMemory(validated.executive, "short-term", `${validated.message} -> ${response.text}`, "conversation");
    await saveMemory(validated.executive, "long-term", `${validated.message} -> ${response.text}`, "decision");

    return NextResponse.json({
      success: true,
      executive: {
        id: executive.id,
        name: executive.name,
        role: executive.role,
      },
      response,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof AIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

function detectApprovalAction(message: string): string | undefined {
  const normalized = message.toLowerCase();

  if (normalized.includes("publish")) return "publish";
  if (normalized.includes("deploy")) return "deploy";
  if (normalized.includes("delete") || normalized.includes("erase")) return "delete-data";
  if (normalized.includes("external message") || normalized.includes("send message")) return "send-external-message";
  if (normalized.includes("spend") || normalized.includes("budget") || normalized.includes("money")) return "spend-money";
  if (normalized.includes("paid resource") || normalized.includes("paid") || normalized.includes("subscription")) return "create-paid-resource";
  if (normalized.includes("production") || normalized.includes("modify system")) return "modify-production-system";
  if (normalized.includes("destructive")) return "destructive-action";

  return undefined;
}

function tryParseStructuredProposal(text: string): { executiveId: string; action: string; reason: string; riskLevel: "low" | "medium" | "high"; estimatedCost?: number } | undefined {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.type !== "approval_request") {
      return undefined;
    }

    return {
      executiveId: typeof parsed.executiveId === "string" ? parsed.executiveId : "orynth",
      action: typeof parsed.action === "string" ? parsed.action : "sensitive-action",
      reason: typeof parsed.reason === "string" ? parsed.reason : "Executive requested approval",
      riskLevel: parsed.riskLevel === "high" ? "high" : parsed.riskLevel === "low" ? "low" : "medium",
      estimatedCost: typeof parsed.estimatedCost === "number" ? parsed.estimatedCost : undefined,
    };
  } catch {
    return undefined;
  }
}
