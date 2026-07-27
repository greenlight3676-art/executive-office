export type MissionStatus = "draft" | "planned" | "active" | "blocked" | "waiting_approval" | "completed" | "cancelled" | "failed";
export type TaskStatus = "todo" | "assigned" | "working" | "blocked" | "waiting_approval" | "completed" | "cancelled" | "failed";
export type RepositoryStatus = MissionStatus | TaskStatus;

export interface ApprovalRecord {
  id: string;
  executiveId: string;
  action: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  estimatedCost?: number;
  projectId?: string;
  conversationId?: string;
  payloadSummary?: string;
  status: "pending" | "approved" | "rejected" | "expired" | "cancelled" | "executed" | "failed";
  createdAt: string;
  expiresAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  executionStatus: "pending" | "ready" | "blocked" | "executed" | "failed";
}

export interface ApprovalEventRecord {
  id: string;
  approvalRequestId: string;
  eventType: string;
  actorId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  safeMetadata?: Record<string, unknown>;
}

export interface MissionRecord {
  id: string;
  title: string;
  description: string;
  projectId: string;
  createdBy: string;
  assignedExecutives: string[];
  status: MissionStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskRecord {
  id: string;
  missionId: string;
  title: string;
  description: string;
  assignedExecutive: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dependencyIds: string[];
  requiresApproval: boolean;
  approvalRequestId?: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationRecord {
  id: string;
  executiveId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryRecord {
  id: string;
  executiveId: string;
  scope: "short-term" | "long-term" | "project";
  content: string;
  kind: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalRepository {
  create(record: ApprovalRecord): Promise<ApprovalRecord>;
  get(id: string): Promise<ApprovalRecord | null>;
  list(filters?: { executiveId?: string; status?: string; projectId?: string; riskLevel?: string }): Promise<ApprovalRecord[]>;
  update(id: string, update: Partial<ApprovalRecord>): Promise<ApprovalRecord>;
}

export interface ApprovalEventRepository {
  create(record: ApprovalEventRecord): Promise<ApprovalEventRecord>;
  listByApprovalRequest(approvalRequestId: string): Promise<ApprovalEventRecord[]>;
}

export interface MissionRepository {
  create(record: MissionRecord): Promise<MissionRecord>;
  get(id: string): Promise<MissionRecord | null>;
  list(): Promise<MissionRecord[]>;
  update(id: string, update: Partial<MissionRecord>): Promise<MissionRecord>;
}

export interface TaskRepository {
  create(record: TaskRecord): Promise<TaskRecord>;
  get(id: string): Promise<TaskRecord | null>;
  listByMission(missionId: string): Promise<TaskRecord[]>;
  update(id: string, update: Partial<TaskRecord>): Promise<TaskRecord>;
}

export interface ConversationRepository {
  create(record: ConversationRecord): Promise<ConversationRecord>;
  get(id: string): Promise<ConversationRecord | null>;
  list(): Promise<ConversationRecord[]>;
}

export interface MessageRepository {
  create(record: MessageRecord): Promise<MessageRecord>;
  listByConversation(conversationId: string): Promise<MessageRecord[]>;
}

export interface MemoryRepository {
  create(record: MemoryRecord): Promise<MemoryRecord>;
  listByExecutive(executiveId: string): Promise<MemoryRecord[]>;
}
