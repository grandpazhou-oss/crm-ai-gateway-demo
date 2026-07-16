import type { UnifiedAiOutput } from "./contract";
import type { DecisionView } from "./types";
import type { AuditEntry } from "../types";

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Monitor: 4 };

export function sortedRiskOpportunities(view: DecisionView) {
  return [...view.opportunities].sort((left, right) => {
    const priority = (PRIORITY_ORDER[left.priority] ?? 9) - (PRIORITY_ORDER[right.priority] ?? 9);
    return priority || left.opportunityToken.localeCompare(right.opportunityToken);
  });
}

export type ProductAction = {
  id: string;
  title: string;
  reason: string;
  owner: string;
  due: string;
  status: string;
  priority: string;
  evidenceCount: number;
  sourcePage: string;
};

export function productActions(view: DecisionView): ProductAction[] {
  const outputs: Array<[string, UnifiedAiOutput]> = [
    ["风险复核", view.pack.risk],
    ["行动建议", view.pack.action],
    ["会议准备", view.pack.meeting],
    ["组合洞察", view.pack.portfolio],
  ];
  const seen = new Set<string>();
  const actions: ProductAction[] = [];
  for (const [sourcePage, output] of outputs) {
    output.recommendedAction.forEach((action, index) => {
      const key = `${action.title}|${action.reason}`;
      if (seen.has(key)) return;
      seen.add(key);
      actions.push({
        id: `${output.id}:${index}`,
        title: action.title,
        reason: action.reason,
        owner: action.owner && action.owner !== "Owner token" ? action.owner : "待人工指定",
        due: action.due || "待人工确定",
        status: action.status || "待人工确定",
        priority: output.priority,
        evidenceCount: output.evidence.length,
        sourcePage,
      });
    });
  }
  return actions;
}

export function portfolioScope(view: DecisionView) {
  const isComplete = view.mode === "portfolio";
  return {
    modeLabel: isComplete ? "组合视图" : "场景聚焦",
    scenarioLabel: view.scenario?.title || "全部本地组合",
    scopeLabel: isComplete ? "Portfolio Scope" : "Scenario Scope",
    count: view.scopeSummary.scopeCount,
    completeLabel: isComplete ? "完整本地 Portfolio" : "场景筛选范围",
  };
}

export function priorityDistribution(view: DecisionView) {
  const counts = new Map<string, number>();
  for (const item of view.opportunities) counts.set(item.priority, (counts.get(item.priority) || 0) + 1);
  return ["Critical", "High", "Medium", "Low", "Monitor"].map((priority) => ({ priority, count: counts.get(priority) || 0 }));
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function sha256Fingerprint(value: unknown) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

export type SafeAuditRow = {
  id: string;
  time: string;
  requestId: string;
  page: string;
  provider: string;
  externalCalled: string;
  schemaStatus: string;
  safetyStatus: string;
  fallback: string;
};

export function safeAuditRows(entries: AuditEntry[]): SafeAuditRow[] {
  return entries.slice(0, 10).map((entry) => ({
    id: entry.id,
    time: entry.timestamp,
    requestId: entry.request_id || "未记录",
    page: auditPageLabel(entry.functionName, entry.type),
    provider: entry.provider_used || entry.provider || "demo",
    externalCalled: entry.external_model_called ? "是" : "否",
    schemaStatus: entry.response_format_requested === undefined ? "未记录" : entry.response_format_requested ? "已请求结构化输出" : "未请求",
    safetyStatus: entry.output_guard_status || entry.checklist_result || "未记录",
    fallback: entry.fallback_used ? entry.fallback_reason || "已回退" : "无",
  }));
}

export function auditCounts(entries: AuditEntry[]) {
  const latestTransform = entries.find((entry) => entry.type === "transform");
  return {
    safeFields: latestTransform?.safe_payload_keys?.length ?? null,
    removedFields: latestTransform?.removed_fields?.length ?? null,
    transformedFields: latestTransform?.transformed_fields?.length ?? null,
    amountBands: null,
  };
}

function auditPageLabel(functionName: string | undefined, type: AuditEntry["type"]) {
  if (type === "transform") return "安全转换";
  const labels: Record<string, string> = {
    "risk-analysis": "风险与优先级",
    "management-summary": "AI 驾驶舱",
    "meeting-copilot": "会议副驾",
    "customer-growth": "组合洞察",
    "opportunity-brief": "商机 360",
    "next-best-actions": "行动看板",
  };
  return labels[functionName || ""] || "安全 AI 请求";
}
