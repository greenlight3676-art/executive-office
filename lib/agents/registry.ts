import { ExecutiveAgent } from "./types";
import { orynthPrompt } from "./prompts/orynth";
import { braykoPrompt } from "./prompts/brayko";
import { lunexaPrompt } from "./prompts/lunexa";
import { vyreelPrompt } from "./prompts/vyreel";
import { kavroPrompt } from "./prompts/kavro";

const executiveRegistry: Record<string, ExecutiveAgent> = {
  orynth: {
    id: "orynth",
    name: "Orynth",
    symbol: "O",
    role: "Chief of Staff and Operations",
    description: "Coordinates execution, mission planning, and operational clarity.",
    defaultProvider: "openai",
    defaultModelTier: "default",
    systemPrompt: orynthPrompt,
    allowedCapabilities: ["planning", "coordination", "operations"],
    prohibitedCapabilities: ["publishing", "destructive-actions"],
    requiresApprovalFor: ["publish", "delete-data", "send-external-message", "modify-production-system"],
    maxOutputTokens: 350,
    costPriority: 1,
  },
  brayko: {
    id: "brayko",
    name: "Brayko",
    symbol: "B",
    role: "Chief Builder",
    description: "Owns architecture, implementation quality, and technical execution.",
    defaultProvider: "anthropic",
    defaultModelTier: "default",
    systemPrompt: braykoPrompt,
    allowedCapabilities: ["coding", "architecture", "debugging"],
    prohibitedCapabilities: ["deploy", "destructive-actions"],
    requiresApprovalFor: ["publish", "deploy", "delete-data", "modify-production-system"],
    maxOutputTokens: 400,
    costPriority: 1,
  },
  lunexa: {
    id: "lunexa",
    name: "Lunexa",
    symbol: "L",
    role: "Creative Director",
    description: "Shapes brand, storytelling, and product experience.",
    defaultProvider: "anthropic",
    defaultModelTier: "default",
    systemPrompt: lunexaPrompt,
    allowedCapabilities: ["branding", "design", "copy"],
    prohibitedCapabilities: ["spend-money", "external-messaging"],
    requiresApprovalFor: ["publish", "send-external-message", "spend-money"],
    maxOutputTokens: 350,
    costPriority: 2,
  },
  vyreel: {
    id: "vyreel",
    name: "Vyreel",
    symbol: "V",
    role: "Growth Executive",
    description: "Drives marketing, growth, and customer acquisition.",
    defaultProvider: "openai",
    defaultModelTier: "default",
    systemPrompt: vyreelPrompt,
    allowedCapabilities: ["marketing", "campaigns", "growth"],
    prohibitedCapabilities: ["spend-money", "deploy"],
    requiresApprovalFor: ["spend-money", "create-paid-resource", "send-external-message"],
    maxOutputTokens: 350,
    costPriority: 2,
  },
  kavro: {
    id: "kavro",
    name: "Kavro",
    symbol: "K",
    role: "Finance Executive",
    description: "Owns pricing, budgets, and financial planning.",
    defaultProvider: "openai",
    defaultModelTier: "default",
    systemPrompt: kavroPrompt,
    allowedCapabilities: ["budgeting", "forecasting", "pricing"],
    prohibitedCapabilities: ["spend-money", "create-paid-resource"],
    requiresApprovalFor: ["spend-money", "create-paid-resource", "delete-data"],
    maxOutputTokens: 300,
    costPriority: 1,
  },
};

export function getExecutiveRegistry(): Record<string, ExecutiveAgent> {
  return executiveRegistry;
}

export function getExecutiveAgent(id: string): ExecutiveAgent {
  const executive = executiveRegistry[id];
  if (!executive) {
    throw new Error(`Unknown executive: ${id}`);
  }
  return executive;
}
