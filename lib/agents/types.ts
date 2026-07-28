export type ExecutiveId = "orynth" | "brayko" | "lunexa" | "vyreel" | "kavro";

export type ModelTier = "default" | "deep";

export type ApprovalRiskLevel = "low" | "medium" | "high";

export interface ApprovalRequest {
  requiresApproval: true;
  action: string;
  reason: string;
  riskLevel: ApprovalRiskLevel;
  estimatedCost?: number;
  proposedBy: ExecutiveId;
}

export interface ExecutiveAgent {
  id: ExecutiveId;
  name: string;
  symbol: string;
  role: string;
  mandate: string;
  motto: string;
  communicationStyle: string;
  accent: string;
  description: string;
  defaultProvider: "openai" | "anthropic";
  defaultModelTier: ModelTier;
  systemPrompt: string;
  allowedCapabilities: string[];
  prohibitedCapabilities: string[];
  requiresApprovalFor: string[];
  maxOutputTokens: number;
  costPriority: number;
}
