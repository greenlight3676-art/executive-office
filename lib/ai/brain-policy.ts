export type ForgeBrainMode = "chatgpt-first" | "specialists";

type ForgeBrainEnvironment = Record<string, string | undefined>;

/**
 * Forge stays lightweight by default: ChatGPT/OpenAI handles reasoning while
 * Forge owns memory, approvals, missions, and tool execution.
 *
 * Set FORGE_SPECIALIST_MODE=true to restore executive-specific providers.
 */
export function getForgeBrainMode(
  environment: ForgeBrainEnvironment = process.env,
): ForgeBrainMode {
  return environment.FORGE_SPECIALIST_MODE?.trim().toLowerCase() === "true"
    ? "specialists"
    : "chatgpt-first";
}
