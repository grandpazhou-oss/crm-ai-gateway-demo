import type { AiActionName, AiActionResult, AiDemoChatResult, AiProviderStatus, AiResult, AuditEntry, DashboardFilters, DynamicsStatus, ManagementDashboard, Opportunity, Role, TransformResult } from "./types";
import { DEFAULT_LANGUAGE } from "./config/language";

async function json<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed: ${response.status}`);
  return body;
}

export function getOpportunities() {
  return json<{ data: Opportunity[] }>("/api/opportunities");
}

export function getManagementDashboard(filters: DashboardFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return json<{ data: ManagementDashboard }>(`/api/management-dashboard${query ? `?${query}` : ""}`);
}

export function getDynamicsStatus() {
  return json<{ data: DynamicsStatus }>("/api/dynamics/status");
}

export function getAiProviderStatus() {
  return json<{ data: AiProviderStatus }>("/api/ai/provider-status");
}

export function testDynamicsConnection() {
  return json<{ ok: boolean; data?: unknown; status?: DynamicsStatus }>("/api/dynamics/test-connection", { method: "POST" });
}

export function syncDynamics() {
  return json<{ ok: boolean; data?: { count: number; syncedDemoCount?: number; excludedNonDemoCount?: number; localTotalAfterSync?: number; scope?: string; lastRefreshTime: string; lastSyncStatus: string }; status?: DynamicsStatus }>("/api/dynamics/sync", { method: "POST" });
}

export function transformOpportunity(role: Role, opportunityId: string) {
  return json<TransformResult>("/api/gateway/transform", {
    method: "POST",
    body: JSON.stringify({ role, opportunity_id: opportunityId }),
  });
}

export function runAi(functionName: string, role: Role, opportunityId: string, safePayload: Record<string, unknown>, language = DEFAULT_LANGUAGE) {
  return json<AiResult>(`/api/ai/${functionName}`, {
    method: "POST",
    body: JSON.stringify({ role, opportunity_id: opportunityId, safePayload, language: language || DEFAULT_LANGUAGE }),
  });
}

export function chatWithAiDemo(question: string, filters: DashboardFilters, role = "management") {
  return json<AiDemoChatResult>("/api/ai-demo/chat", {
    method: "POST",
    body: JSON.stringify({ question, filters, role, language: DEFAULT_LANGUAGE }),
  });
}

export function runAiAction(actionName: AiActionName, body: Record<string, unknown>) {
  return json<AiActionResult>(`/api/ai-actions/${actionName}`, {
    method: "POST",
    body: JSON.stringify({ ...body, language: DEFAULT_LANGUAGE }),
  });
}

export function getSafeOpportunityContext(opportunityId: string) {
  return json<{ data: Record<string, unknown>; context_summary: unknown; safe_payload_keys: string[] }>(`/api/ai-context/opportunity/${opportunityId}`);
}

export function getAuditLog() {
  return json<{ data: AuditEntry[] }>("/api/audit-log");
}

export function resetAuditLog() {
  return json<{ ok: boolean }>("/api/audit-log/reset", { method: "POST" });
}
