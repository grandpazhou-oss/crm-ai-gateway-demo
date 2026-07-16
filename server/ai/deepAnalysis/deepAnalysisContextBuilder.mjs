import { safeContextHash } from "../../decision/comparisonEvaluation.mjs";
import { getDecisionView } from "../../decision/decisionService.mjs";
import { DEEP_ANALYSIS_SCHEMA_VERSION } from "./deepAnalysisSchema.mjs";

const NEVER_SENT = ["客户名称", "联系人姓名", "电话和邮箱", "CRM GUID", "精确地址", "精确金额", "Timeline 原文", "合同原文", "报价原文", "Location/POL/POD 原值", "Scenario ID", "Golden metadata", "Raw fixture"];
const CURRENT_LIMITATIONS = ["客户历史尚未接入", "外部行业与市场情报尚未启用", "公司内部能力知识尚未接入", "本次仅基于 CRM Safe Context"];

export function buildDeepAnalysisPreview({ template, mode, scenarioId, opportunityToken, role = "demo-full-access" }) {
  const view = getDecisionView({ mode, scenarioId, opportunityToken });
  if (!view) throw new TypeError("Deep analysis opportunity not found in scope");
  const availableData = availableCategories(template.code, view.safeContext);
  const input = {
    templateCode: template.code,
    templateVersion: template.version,
    safeDecisionContext: view.safeContext,
    safeAccountAggregate: view.safeContext.accountAggregate,
    derivedSignals: derivedSignals(template.code, view.safeContext),
    schemaVersion: DEEP_ANALYSIS_SCHEMA_VERSION,
    instruction: "Analyze only supplied safe categorical signals. Separate CRM facts from AI inference. Do not create precise predictions or CRM actions.",
  };
  return {
    templateCode: template.code,
    templateVersion: template.version,
    opportunityToken: view.safeContext.opportunityToken,
    accountToken: view.safeContext.accountToken,
    role,
    departmentScopeStatus: "CRM 部门字段待接入",
    mode: view.mode,
    dataTimeRange: view.safeContext.elapsedPeriodCategory === "pipeline" ? "当前 Pipeline 快照" : "当前安全快照与 12 个月聚合类别",
    amountMode: "仅金额区间",
    availableData,
    missingDependencies: [...template.unavailableDependencies],
    providerPolicy: template.providerPolicy,
    provider: "demo",
    externalModelCalled: false,
    safeContextUsed: true,
    rawDataSent: false,
    exactAmountSentToModel: false,
    timelineRawTextSent: false,
    safeContextHash: safeContextHash({ safeContext: view.safeContext, accountAggregate: view.safeContext.accountAggregate }),
    neverSent: NEVER_SENT,
    currentLimitations: CURRENT_LIMITATIONS,
    providerInput: input,
  };
}

export function publicDeepAnalysisPreview(preview) {
  const { providerInput: _providerInput, ...publicPreview } = preview;
  return publicPreview;
}

function availableCategories(code, context) {
  const categories = ["当前 Opportunity Safe Context", "Safe Account Aggregate", "金额区间", "预算/实绩偏差类别"];
  if (["DA-02", "DA-03"].includes(code)) categories.push("毛利率区间", "当前阶段");
  if (code === "DA-06") categories.push("安全路线一致性派生信号");
  if (code === "DA-07") categories.push("Meeting 安全派生信号");
  return categories.filter((item) => item !== "预算/实绩偏差类别" || context.varianceCategory);
}

function derivedSignals(code, context) {
  if (code === "DA-07") return { meetingWindow: context.meetingWindow, stakeholderCoverage: context.stakeholderCoverage, openQuestionCount: context.openQuestionCount, decisionReadiness: context.decisionReadiness };
  if (code === "DA-06") return { transportMode: context.transportMode, routeConsistency: context.routeConsistency };
  return { stage: context.stage, priority: context.priority, stagnationBand: context.stagnationBand, amountBand: context.revenueBand, varianceCategory: context.varianceCategory, marginBand: context.marginBand, ratioBucket: context.marginBand };
}
