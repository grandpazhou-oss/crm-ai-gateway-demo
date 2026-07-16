import { randomUUID } from "node:crypto";
import { buildDeepAnalysisPreview, publicDeepAnalysisPreview } from "./deepAnalysisContextBuilder.mjs";
import { runDeepAnalysisDemo } from "./deepAnalysisDemoProvider.mjs";
import { createDeepAnalysisAuditStore } from "./deepAnalysisAudit.mjs";
import { validateDeepAnalysisOutput } from "./deepAnalysisSchema.mjs";
import { validateDeepAnalysisProviderPayload } from "./deepAnalysisSafety.mjs";
import { getDeepAnalysisTemplate, listDeepAnalysisTemplates } from "./templateRegistry.mjs";

const ALLOWED_ROLE = "demo-full-access";

export function createDeepAnalysisService({ env = process.env, now = () => new Date() } = {}) {
  const results = new Map();
  const running = new Map();
  const audit = createDeepAnalysisAuditStore({ now });
  const featureEnabled = () => String(env.FEATURE_DEEP_ANALYSIS).toLowerCase() === "true";

  function templates() { return { featureEnabled: featureEnabled(), role: ALLOWED_ROLE, templates: listDeepAnalysisTemplates({ featureEnabled: featureEnabled() }) }; }

  function preview(input = {}) {
    assertFeature();
    assertRole(input.role);
    const template = assertTemplate(input.templateCode);
    const built = buildDeepAnalysisPreview({ template, mode: input.mode, scenarioId: input.scenarioId, opportunityToken: input.opportunityToken, role: input.role });
    const safety = validateDeepAnalysisProviderPayload(built.providerInput);
    if (!safety.ok) throw serviceError(400, "Deep analysis Safe Context blocked");
    return publicDeepAnalysisPreview(built);
  }

  async function run(input = {}) {
    assertFeature();
    assertRole(input.role);
    if (input.confirmed !== true) throw serviceError(400, "Explicit confirmation required");
    if (String(env.ALLOW_EXTERNAL_AI).toLowerCase() === "true") throw serviceError(403, "Deep analysis requires ALLOW_EXTERNAL_AI=false");
    if (String(env.AI_PROVIDER || "demo") !== "demo") throw serviceError(403, "Deep analysis requires deterministic Demo Provider");
    const template = assertTemplate(input.templateCode);
    const built = buildDeepAnalysisPreview({ template, mode: input.mode, scenarioId: input.scenarioId, opportunityToken: input.opportunityToken, role: input.role });
    const safety = validateDeepAnalysisProviderPayload(built.providerInput);
    if (!safety.ok) throw serviceError(400, "Deep analysis Safe Context blocked");
    const requestId = typeof input.requestId === "string" && /^[a-zA-Z0-9-]{8,80}$/.test(input.requestId) ? input.requestId : randomUUID();
    const controller = new AbortController();
    const started = Date.now();
    running.set(requestId, controller);
    try {
      const output = await runDeepAnalysisDemo({ payload: built.providerInput, requestId, signal: controller.signal });
      const schema = validateDeepAnalysisOutput(output);
      if (!schema.ok) throw serviceError(500, "Deep analysis output validation failed");
      const result = { requestId, status: "完成", progress: ["构建 Safe Context", "安全检查", "Demo 分析中", "输出结构校验", "安全校验", "完成"], preview: publicDeepAnalysisPreview(built), output, schemaStatus: "pass", safetyStatus: "pass", citationStatus: "pass", latencyMs: Date.now() - started };
      results.set(requestId, result);
      audit.push(auditEntry(result, built, "completed", ""));
      return result;
    } catch (error) {
      if (error?.name === "AbortError") {
        const result = { requestId, status: "已取消", progress: ["已取消"], preview: publicDeepAnalysisPreview(built), output: null, schemaStatus: "not-run", safetyStatus: "pass", citationStatus: "not-run", latencyMs: Date.now() - started };
        results.set(requestId, result);
        audit.push(auditEntry(result, built, "cancelled", "user_cancelled"));
        return result;
      }
      audit.push({ requestId, templateCode: template.code, templateVersion: template.version, opportunityToken: built.opportunityToken, accountToken: built.accountToken, role: built.role, departmentScopeStatus: built.departmentScopeStatus, safeContextHash: built.safeContextHash, dataCategories: built.availableData, missingDependencies: built.missingDependencies, provider: "demo", latencyMs: Date.now() - started, schemaStatus: "fail", safetyStatus: safety.status, status: "failed", reason: "validation_failed" });
      throw error;
    } finally { running.delete(requestId); }
  }

  function cancel(requestId) { const controller = running.get(requestId); if (!controller) return false; controller.abort(); return true; }
  function reset() { for (const controller of running.values()) controller.abort(); running.clear(); results.clear(); audit.clear(); }
  function assertFeature() { if (!featureEnabled()) throw serviceError(403, "Deep analysis feature is disabled"); }
  function assertRole(role) { if (role !== ALLOWED_ROLE) throw serviceError(403, "Deep analysis role is not authorized"); }
  function assertTemplate(code) { const template = getDeepAnalysisTemplate(code); if (!template) throw serviceError(404, "Deep analysis template not found"); if (!template.enabled) throw serviceError(409, template.blockedReason || "Deep analysis template is blocked"); return template; }

  return { templates, preview, run, cancel, reset, listAudit: audit.list, getResult: (requestId) => results.get(requestId) || null };
}

function auditEntry(result, built, status, reason) { return { requestId: result.requestId, templateCode: built.templateCode, templateVersion: built.templateVersion, opportunityToken: built.opportunityToken, accountToken: built.accountToken, role: built.role, departmentScopeStatus: built.departmentScopeStatus, safeContextHash: built.safeContextHash, dataCategories: built.availableData, missingDependencies: built.missingDependencies, provider: "demo", latencyMs: result.latencyMs, schemaStatus: result.schemaStatus, safetyStatus: result.safetyStatus, status, reason }; }
function serviceError(status, message) { const error = new Error(message); error.status = status; return error; }
