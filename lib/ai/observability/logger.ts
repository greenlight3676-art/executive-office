export interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export function logEvent(entry: LogEntry): void {
  if (process.env.NODE_ENV !== "test") {
    console.info(JSON.stringify(entry));
  }
}
