import type { DecisionMode } from "../decision/types";

export type DeepAnalysisTemplate = {
  code: string; title: string; description: string; targetRole: string; requiredData: string[]; optionalData: string[]; unavailableDependencies: string[]; providerPolicy: string; estimatedDuration: string; enabled: boolean; runtimeEnabled: boolean; blockedReason: string; outputSections: string[]; version: string; status: "可执行" | "受限" | "依赖未接入" | "外部情报未启用";
};

export type DeepAnalysisCatalog = { featureEnabled: boolean; role: "demo-full-access"; templates: DeepAnalysisTemplate[] };

export type DeepAnalysisPreview = {
  templateCode: string; templateVersion: string; opportunityToken: string; accountToken: string; role: string; departmentScopeStatus: string; mode: DecisionMode; dataTimeRange: string; amountMode: string; availableData: string[]; missingDependencies: string[]; providerPolicy: string; provider: "demo"; externalModelCalled: false; safeContextUsed: true; rawDataSent: false; exactAmountSentToModel: false; timelineRawTextSent: false; safeContextHash: string; neverSent: string[]; currentLimitations: string[];
};

export type DeepAnalysisFact = { label: string; value: string; source: string; sourceType: "crm_current" };
export type DeepAnalysisOutput = {
  requestId: string; templateCode: string; templateVersion: string; title: string; executiveSummary: string; crmFacts: DeepAnalysisFact[]; customerHistoryFacts: DeepAnalysisFact[]; externalFacts: DeepAnalysisFact[]; internalCapabilityFacts: DeepAnalysisFact[]; aiInferences: Array<{ label: string; statement: string; evidenceRefs: string[] }>; risks: string[]; opportunities: string[]; scenarios: Array<{ name: string; direction: string; summary: string }>; recommendedActions: Array<{ action: string; reason: string; suggestedRole: string; suggestedHorizon: string; evidenceRefs: string[]; source: string; status: string }>; confidence: { level: string; reason: string }; limitations: string[]; sources: Array<{ type: string; ref: string }>; provider: { used: "demo"; policy: string; externalModelCalled: false }; safety: { safeContextUsed: true; rawDataSent: false; exactAmountSentToModel: false; timelineRawTextSent: false; customerIdentitySent: false };
};

export type DeepAnalysisResult = { requestId: string; status: string; progress: string[]; preview: DeepAnalysisPreview; output: DeepAnalysisOutput | null; schemaStatus: string; safetyStatus: string; citationStatus: string; latencyMs: number };
export type DeepAnalysisPhase = "未开始" | "等待确认" | "构建 Safe Context" | "安全检查" | "Demo 分析中" | "输出结构校验" | "安全校验" | "完成" | "已取消" | "已阻断" | "失败";
