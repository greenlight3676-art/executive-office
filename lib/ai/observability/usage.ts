export interface UsageSnapshot {
  requestCount: number;
  lastRequestAt?: string;
}

const usageState = {
  requestCount: 0,
  lastRequestAt: undefined as string | undefined,
};

export function recordUsage(): UsageSnapshot {
  usageState.requestCount += 1;
  usageState.lastRequestAt = new Date().toISOString();
  return usageState;
}
