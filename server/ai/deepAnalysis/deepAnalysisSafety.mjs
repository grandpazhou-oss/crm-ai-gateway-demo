import { safeDecisionContextKeys } from "../../decision/safeContext.mjs";

const FORBIDDEN_KEYS = new Set(["scenarioId", "scenarioTag", "primaryScenario", "secondarySignals", "rawOpportunity", "rawAccount", "rawContact", "timeline", "timelineText", "customerName", "contactName", "email", "phone", "address", "exactAmount", "location", "pol", "pod", "apiKey", "authorization"]);
const SAFE_TOP_LEVEL = new Set(["templateCode", "templateVersion", "safeDecisionContext", "safeAccountAggregate", "derivedSignals", "schemaVersion", "instruction"]);

export function validateDeepAnalysisProviderPayload(payload) {
  if (!isRecord(payload)) return fail("payload_not_object");
  if (Object.keys(payload).some((key) => !SAFE_TOP_LEVEL.has(key))) return fail("unexpected_top_level_key");
  if (!/^DA-0[1-9]$/.test(payload.templateCode) || typeof payload.templateVersion !== "string") return fail("invalid_template_identity");
  if (!isRecord(payload.safeDecisionContext) || !isRecord(payload.safeAccountAggregate)) return fail("missing_safe_context");
  if (Object.keys(payload.safeDecisionContext).some((key) => !safeDecisionContextKeys.includes(key))) return fail("unsafe_context_key");
  const unsafe = findForbidden(payload);
  if (unsafe) return fail(`forbidden_${unsafe}`);
  return { ok: true, status: "pass" };
}

export function sanitizeDeepAnalysisAudit(entry) {
  const allowed = ["requestId", "templateCode", "templateVersion", "opportunityToken", "accountToken", "role", "departmentScopeStatus", "safeContextHash", "dataCategories", "missingDependencies", "provider", "latencyMs", "schemaStatus", "safetyStatus", "status", "reason", "timestamp"];
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(entry, key)).map((key) => [key, entry[key]]));
}

function findForbidden(value, path = "") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) { const found = findForbidden(value[index], `${path}[${index}]`); if (found) return found; }
    return "";
  }
  if (!isRecord(value)) return "";
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) return path ? `${path}.${key}` : key;
    const found = findForbidden(child, path ? `${path}.${key}` : key);
    if (found) return found;
  }
  return "";
}

function isRecord(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function fail(reason) { return { ok: false, status: "blocked", reason }; }
