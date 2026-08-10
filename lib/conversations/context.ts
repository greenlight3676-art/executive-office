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
  /\bmy goal\b/i,
  /\bour goal\b/i,
  /\bpriority\b/i,
  /\bfocus(?:ing)? on\b/i,
  /\bproject\b/i,
  /\bclient\b/i,
  /\bbusiness\b/i,
  /\bprice(?:d|ing)?\b/i,
  /\bcharge\b/i,
  /\bdeadline\b/i,
  /\bneed to\b/i,
  /\bnext step\b/i,
  /\bfinished\b/i,
  /\bcompleted\b/i,
  /\bfailed\b/i,
  /\bdidn['’]?t work\b/i,
];

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "been", "before", "being", "could", "from", "have", "into", "just",
  "more", "need", "that", "their", "them", "then", "there", "these", "they", "this", "those", "through",
  "want", "what", "when", "where", "which", "with", "would", "your", "forge", "current", "message",
]);

export function shouldSaveLongTermMemory(message: string) {
  return LONG_TERM_MEMORY_PATTERNS.some((pattern) => pattern.test(message));
}

export function createConversationTitle(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  if (compact.length <= 54) return compact;
  return `${compact.slice(0, 51).trimEnd()}...`;
}

function terms(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length >= 4 && !STOP_WORDS.has(term)),
  );
}

function memoryScore(memory: ExecutiveMemory, message: string) {
  const queryTerms = terms(message);
  const memoryTerms = terms(memory.content);
  let overlap = 0;
  for (const term of queryTerms) if (memoryTerms.has(term)) overlap += 1;

  const scopeBoost = memory.scope === "long-term" ? 3 : memory.scope === "project" ? 2 : 0;
  const kindBoost = /decision|preference|goal|project|client|mission|outcome/i.test(memory.kind) ? 2 : 0;
  const ageDays = Math.max(0, (Date.now() - Date.parse(memory.createdAt)) / 86_400_000);
  const recency = Math.max(0, 2 - ageDays / 30);
  return overlap * 5 + scopeBoost + kindBoost + recency;
}

export function selectRelevantMemories(memories: ExecutiveMemory[], message: string, limit = 10) {
  return memories
    .map((memory) => ({ memory, score: memoryScore(memory, message) }))
    .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt))
    .slice(0, limit)
    .map(({ memory }) => memory);
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

  const relevantMemories = selectRelevantMemories(input.memories, input.message, 10);
  const memories = relevantMemories
    .map((memory) => `- [${memory.scope}/${memory.kind}] ${memory.content}`)
    .join("\n");

  return [
    input.executive.systemPrompt,
    "",
    "PERSISTENT MEMORY — ranked for relevance to TJ's current request",
    memories || "No relevant saved executive memory yet.",
    "",
    "RECENT CONVERSATION",
    history || "This is a new conversation.",
    "",
    "TJ'S CURRENT MESSAGE",
    input.message,
    "",
    "Use saved memory proactively when relevant so TJ does not have to repeat decisions, goals, project context, clients, preferences, or past outcomes. Prefer newer explicit long-term decisions when memories conflict. Never claim memory proves an external action was completed; verify actions through tools or mission state.",
  ].join("\n");
}
