import { ValidationError } from "./errors";

export interface CostPolicy {
  maxInputLength: number;
  maxOutputTokens: number;
  requestTimeoutMs: number;
  dailyRequestLimit: number;
  maxProvidersPerBoardroomRequest: number;
  maxProvidersPerNormalRequest: number;
}

export function createCostPolicy(): CostPolicy {
  return {
    maxInputLength: 8000,
    maxOutputTokens: 400,
    requestTimeoutMs: 15000,
    dailyRequestLimit: 250,
    maxProvidersPerBoardroomRequest: 2,
    maxProvidersPerNormalRequest: 1,
  };
}

export function enforceCostPolicy(
  message: string,
  maxOutputTokens: number,
  policy: CostPolicy = createCostPolicy(),
): void {
  if (message.trim().length > policy.maxInputLength) {
    throw new ValidationError("Input exceeds maximum allowed length.", {
      maxInputLength: policy.maxInputLength,
      providedLength: message.trim().length,
    });
  }

  if (maxOutputTokens > policy.maxOutputTokens) {
    throw new ValidationError("Requested output exceeds maximum allowed tokens.", {
      maxOutputTokens: policy.maxOutputTokens,
      requestedOutputTokens: maxOutputTokens,
    });
  }
}
