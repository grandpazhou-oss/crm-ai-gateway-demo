import type { AiProviderStatus } from "../types";

export type ExternalAnalysisStatus =
  | "disabled"
  | "configuration_missing"
  | "ready"
  | "awaiting_confirmation"
  | "building_safe_context"
  | "calling_provider"
  | "validating_schema"
  | "validating_safety"
  | "validating_citations"
  | "completed"
  | "fallback_demo"
  | "blocked"
  | "failed";

const STATUS_LABELS: Record<ExternalAnalysisStatus, string> = {
  disabled: "外部模型未启用",
  configuration_missing: "Provider 配置不完整",
  ready: "外部模型已就绪",
  awaiting_confirmation: "等待用户确认",
  building_safe_context: "正在构建安全上下文",
  calling_provider: "正在进行深度分析",
  validating_schema: "正在校验输出结构",
  validating_safety: "正在执行安全校验",
  validating_citations: "正在校验外部来源",
  completed: "分析完成",
  fallback_demo: "外部模型不可用，已回退 Demo",
  blocked: "调用已被安全策略阻断",
  failed: "分析失败",
};

export function externalAnalysisStatus(status: AiProviderStatus | null): ExternalAnalysisStatus {
  if (!status) return "disabled";
  if (status.externalAiEnabled && status.configured) return "ready";
  if (status.providerRequested === "openai-compatible" && /missing external llm config/i.test(status.fallbackReason || "")) return "configuration_missing";
  return "disabled";
}

export function externalAnalysisStatusLabel(status: AiProviderStatus | null, prefixed = false) {
  const label = STATUS_LABELS[externalAnalysisStatus(status)];
  return prefixed ? `外部模型：${label.replace(/^外部模型/, "").trim()}` : label;
}

export function validationStatusLabel(value: string | undefined) {
  return value || "当前未执行";
}
