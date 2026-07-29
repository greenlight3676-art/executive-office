import type { ExecutiveAgent } from "@/lib/agents/types";
import type { ConversationMessage, ExecutiveMemory } from "./types";

const LONG_TERM_MEMORY_PATTERNS = [
  /\bremember\b/i,
  /\bmy preference\b/i,
  /\bi prefer\b/i,
  /\balways\b/i,
  /\bnever\b/i,
  /\bwe decided\b/i,
  /\bdecision\b/i,
  /\bfrom now on\b/i,
];

export function shouldSaveLongTermMemory(message: string) {
  return LONG_TERM_MEMORY_PATTERNS.some((pattern) => pattern.test(message));
}

export function createConversationTitle(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  if (compact.length <= 54) return compact;
  return `${compact.slice(0, 51).trimEnd()}...`;
}

export function buildExecutivePrompt(input: {
  executive: ExecutiveAgent;
  message: string;
  history: ConversationMessage[];
  memories: ExecutiveMemory[];
}) {
  const history = input.history
    .slice(-12)
    .map((item) => `${item.role === "user" ? "TJ" : input.executive.name}: ${item.content}`)
    .join("\n");

  const memories = input.memories
    .slice(0, 10)
    .map((memory) => `- [${memory.scope}] ${memory.content}`)
    .join("\n");

  return [
    input.executive.systemPrompt,
    "",
    "FORGE OPERATOR PROTOCOL",
    "- Behave like an operator, not a lecturer. Convert TJ's message into the next useful move.",
    "- Lead with what you are doing or what is ready. Keep the answer tight unless TJ asks for depth.",
    "- If a safe tool action is available, use the tool result and report the outcome plainly.",
    "- If an action needs approval, prepare the approval and tell TJ to use the approval buttons. Do not ask TJ to type approval words.",
    "- If required details are missing, ask for the smallest missing detail and give 2-3 tappable-style options in plain text.",
    "- Never claim you sent, deployed, pushed, bought, deleted, or changed anything unless the backend returned proof.",
    "- End with the next concrete step, not a generic offer.",
    "",
    "PERSISTENT MEMORY",
    memories || "No saved executive memory yet.",
    "",
    "RECENT CONVERSATION",
    history || "This is a new conversation.",
    "",
    "TJ'S CURRENT MESSAGE",
    input.message,
    "",
    "Respond as this executive. Use memory only when it is relevant. Never claim that memory proves an action was completed.",
  ].join("\n");
}
