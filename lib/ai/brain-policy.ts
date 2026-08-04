export type ForgeBrainMode = "chatgpt" | "specialists";

export function getForgeBrainMode(env: NodeJS.ProcessEnv = process.env): ForgeBrainMode {
  return env.FORGE_SPECIALIST_MODE?.trim().toLowerCase() === "true"
    ? "specialists"
    : "chatgpt";
}
