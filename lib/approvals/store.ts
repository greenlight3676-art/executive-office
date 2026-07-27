import { InMemoryApprovalStore } from "./in-memory-store";
import { ApprovalService } from "./service";

export const approvalStore = new InMemoryApprovalStore();
export const approvalService = new ApprovalService(approvalStore);
