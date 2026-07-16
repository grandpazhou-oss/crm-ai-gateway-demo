export const DEEP_ANALYSIS_SCHEMA_VERSION = "deep-analysis-output-v1";

export const deepAnalysisOutputSchema = Object.freeze({
  version: DEEP_ANALYSIS_SCHEMA_VERSION,
  required: ["requestId", "templateCode", "templateVersion", "title", "executiveSummary", "crmFacts", "customerHistoryFacts", "externalFacts", "internalCapabilityFacts", "aiInferences", "risks", "opportunities", "scenarios", "recommendedActions", "confidence", "limitations", "sources", "provider", "safety"],
});

export function validateDeepAnalysisOutput(value) {
  if (!isRecord(value)) return fail("output_not_object");
  for (const key of deepAnalysisOutputSchema.required) if (!Object.hasOwn(value, key)) return fail(`missing_${key}`);
  if (!text(value.requestId) || !/^DA-0[1-9]$/.test(value.templateCode) || !text(value.templateVersion) || !text(value.title) || !text(value.executiveSummary)) return fail("invalid_identity");
  for (const key of ["crmFacts", "customerHistoryFacts", "externalFacts", "internalCapabilityFacts", "aiInferences", "risks", "opportunities", "scenarios", "recommendedActions", "limitations", "sources"]) if (!Array.isArray(value[key])) return fail(`invalid_${key}`);
  if (value.customerHistoryFacts.length || value.externalFacts.length || value.internalCapabilityFacts.length) return fail("unavailable_facts_must_be_empty");
  if (!value.crmFacts.every((item) => fact(item, "crm_current"))) return fail("invalid_crm_fact");
  if (!value.aiInferences.every((item) => isRecord(item) && item.label === "AI 推断，不是 CRM 事实" && text(item.statement) && Array.isArray(item.evidenceRefs))) return fail("invalid_ai_inference");
  if (!value.scenarios.every((item) => isRecord(item) && ["基准情景", "乐观情景", "风险情景"].includes(item.name) && ["低", "中", "中高", "高", "改善", "稳定", "恶化"].includes(item.direction) && text(item.summary))) return fail("invalid_scenario");
  if (!value.recommendedActions.every(action)) return fail("invalid_action");
  if (!isRecord(value.confidence) || !["高", "中", "低"].includes(value.confidence.level) || !text(value.confidence.reason)) return fail("invalid_confidence");
  if (!isRecord(value.provider) || value.provider.used !== "demo" || value.provider.externalModelCalled !== false) return fail("invalid_provider");
  if (!isRecord(value.safety) || value.safety.safeContextUsed !== true || value.safety.rawDataSent !== false || value.safety.exactAmountSentToModel !== false || value.safety.timelineRawTextSent !== false) return fail("invalid_safety");
  return { ok: true, status: "pass", schemaVersion: DEEP_ANALYSIS_SCHEMA_VERSION };
}

function fact(item, sourceType) { return isRecord(item) && text(item.label) && text(item.value) && text(item.source) && item.sourceType === sourceType; }
function action(item) { return isRecord(item) && text(item.action) && text(item.reason) && item.suggestedRole === "待人工指定" && text(item.suggestedHorizon) && item.suggestedHorizon.includes("模型建议，非 CRM 正式期限") && Array.isArray(item.evidenceRefs) && item.source === "AI 推断" && item.status === "仅草案"; }
function isRecord(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function text(value) { return typeof value === "string" && value.length > 0 && value.length <= 3000; }
function fail(reason) { return { ok: false, status: "invalid_schema", reason, schemaVersion: DEEP_ANALYSIS_SCHEMA_VERSION }; }
