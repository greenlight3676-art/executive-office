import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers/config";
import { validateChatPayload } from "@/lib/ai/validation";
import { AIError, ConfigurationError, ValidationError } from "@/lib/ai/errors";
import { createCostPolicy, enforceCostPolicy } from "@/lib/ai/cost-policy";
import { loadExecutiveContext, resolveExecutiveProvider } from "@/lib/ai/router";
import { requiresApproval } from "@/lib/security/permissions";
import { approvalService } from "@/lib/approvals/store";
import { conversationStore } from "@/lib/conversations/store";
import {
  buildExecutivePrompt,
  createConversationTitle,
  shouldSaveLongTermMemory,
} from "@/lib/conversations/context";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const validated = validateChatPayload({
      ...payload,
      message: payload?.message ?? payload?.prompt,
    });
    const config = getProviderConfig(process.env);
    const costPolicy = createCostPolicy();
    enforceCostPolicy(validated.message, 400, costPolicy);

    const executive = loadExecutiveContext(validated.executive);
    const existingConversation = validated.conversationId
      ? await conversationStore.getConversation(validated.conversationId)
      : null;

    if (validated.conversationId && !existingConversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (existingConversation && existingConversation.executiveId !== executive.id) {
      return NextResponse.json(
        { error: "This conversation belongs to a different executive." },
        { status: 409 },
      );
    }

    const conversation =
      existingConversation ??
      (await conversationStore.createConversation({
        executiveId: executive.id,
        title: createConversationTitle(validated.message),
      }));

    const userMessage = await conversationStore.createMessage({
      conversationId: conversation.id,
      role: "user",
      content: validated.message,
    });

    const approvalAction = detectApprovalAction(validated.message);
    if (approvalAction && requiresApproval(approvalAction)) {
      const approvalRequest = await approvalService.createApprovalRequest({
        executiveId: executive.id,
        action: approvalAction,
        reason: `The executive requested a sensitive action: ${approvalAction}`,
        riskLevel: approvalAction.includes("spend") || approvalAction.includes("paid") ? "high" : "medium",
        estimatedCost: approvalAction.includes("spend") || approvalAction.includes("paid") ? 100 : undefined,
        conversationId: conversation.id,
      });

      const assistantMessage = await conversationStore.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: `I prepared an approval request for “${approvalAction}.” TJ must approve it before execution.`,
        metadata: { approvalRequestId: approvalRequest.id },
      });

      return NextResponse.json({
        success: true,
        approvalRequest,
        conversation,
        userMessage,
        message: assistantMessage,
        executive: {
          id: executive.id,
          name: executive.name,
          role: executive.role,
        },
      });
    }

    const [history, memories] = await Promise.all([
      conversationStore.listMessages(conversation.id, 14),
      conversationStore.listMemories(executive.id, 12),
    ]);

    const provider = resolveExecutiveProvider(validated.executive, config);
    const response = await provider.send({
      message: buildExecutivePrompt({
        executive,
        message: validated.message,
        history,
        memories,
      }),
      executive: validated.executive,
      mode: validated.mode === "deep" ? "deep" : "default",
      conversationId: conversation.id,
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
        conversationId: conversation.id,
      });
    }

    const assistantMessage = await conversationStore.createMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: response.text,
      metadata: {
        provider: response.provider,
        model: response.model,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    });

    const memoryContent = `TJ: ${validated.message.slice(0, 500)}\n${executive.name}: ${response.text.slice(0, 900)}`;
    const memoryWrites = [
      conversationStore.createMemory({
        executiveId: executive.id,
        scope: "short-term",
        content: memoryContent,
        kind: "conversation",
        metadata: { conversationId: conversation.id },
      }),
    ];

    if (shouldSaveLongTermMemory(validated.message)) {
      memoryWrites.push(
        conversationStore.createMemory({
          executiveId: executive.id,
          scope: "long-term",
          content: memoryContent,
          kind: "user-directed-memory",
          metadata: { conversationId: conversation.id },
        }),
      );
    }

    await Promise.all(memoryWrites);

    return NextResponse.json({
      success: true,
      conversation,
      userMessage,
      message: assistantMessage,
      persistence: conversationStore.persistence,
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
