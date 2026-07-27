export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export class ConfigurationError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFIGURATION_ERROR", 500, details);
  }
}

export class ValidationError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class ProviderError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PROVIDER_ERROR", 502, details);
  }
}

export class RateLimitError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "RATE_LIMIT_ERROR", 429, details);
  }
}
