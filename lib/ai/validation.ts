import { ValidationError } from "./errors";

const allowedExecutives = new Set(["orynth", "brayko", "lunexa", "vyreel", "kavro"]);

export interface ChatRequestPayload {
  message: string;
  executive: string;
  mode?: string;
  conversationId?: string;
}

export interface BoardroomRequestPayload {
  message: string;
  executives: string[];
  synthesize?: boolean;
}

export function validateChatPayload(payload: unknown): ChatRequestPayload {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("Request body must be a JSON object.");
  }

  const candidate = payload as Record<string, unknown>;
  const message = candidate.message;
  const executive = candidate.executive;
  const mode = candidate.mode ?? "default";

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new ValidationError("The message field must be a non-empty string.");
  }

  if (typeof executive !== "string" || executive.trim().length === 0) {
    throw new ValidationError("The executive field must be a non-empty string.");
  }

  const normalizedExecutive = executive.trim().toLowerCase();
  if (!allowedExecutives.has(normalizedExecutive)) {
    throw new ValidationError("The executive field must be one of: orynth, brayko, lunexa, vyreel, kavro.");
  }

  if (typeof mode !== "string" || !["auto", "default", "deep"].includes(mode)) {
    throw new ValidationError("The mode field must be one of: auto, default, deep.");
  }

  if (candidate.conversationId !== undefined && typeof candidate.conversationId !== "string") {
    throw new ValidationError("The conversationId field must be a string when provided.");
  }

  return {
    message: message.trim(),
    executive: normalizedExecutive,
    mode,
    conversationId: typeof candidate.conversationId === "string" ? candidate.conversationId : undefined,
  };
}

export function validateBoardroomPayload(payload: unknown): BoardroomRequestPayload {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("Request body must be a JSON object.");
  }

  const candidate = payload as Record<string, unknown>;
  const message = candidate.message;
  const executives = candidate.executives;
  const synthesize = candidate.synthesize ?? true;

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new ValidationError("The message field must be a non-empty string.");
  }

  if (!Array.isArray(executives) || executives.length === 0 || executives.some((item) => typeof item !== "string")) {
    throw new ValidationError("The executives field must be a non-empty array of strings.");
  }

  if (executives.length > 2) {
    throw new ValidationError("Boardroom mode supports a maximum of two executives for this milestone.");
  }

  const normalizedExecutives = executives.map((item) => item.trim().toLowerCase());
  const uniqueExecutives = new Set(normalizedExecutives);
  if (uniqueExecutives.size !== normalizedExecutives.length) {
    throw new ValidationError("Boardroom executives must be unique.");
  }

  for (const executive of normalizedExecutives) {
    if (!allowedExecutives.has(executive)) {
      throw new ValidationError("Boardroom executives must be one of: orynth, brayko, lunexa, vyreel, kavro.");
    }
  }

  if (typeof synthesize !== "boolean") {
    throw new ValidationError("The synthesize field must be a boolean.");
  }

  return {
    message: message.trim(),
    executives: normalizedExecutives,
    synthesize,
  };
}
