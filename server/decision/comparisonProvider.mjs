import { containsForbiddenProviderContent } from "../ai/providers/promptBuilder.mjs";
import { UNIFIED_OUTPUT_SCHEMA_VERSION, unifiedOutputJsonSchema } from "./comparisonSchema.mjs";

const MAX_RESPONSE_BYTES = 64 * 1024;

export async function callComparisonProvider({ safeContext, accountAggregate, page, env = process.env, fetchImpl = globalThis.fetch, signal } = {}) {
  const timeoutMs = boundedNumber(env.LLM_TIMEOUT_MS, 20000, 100, 60000);
  const payload = buildComparisonPayload({ safeContext, accountAggregate, page });
  const payloadSafety = containsForbiddenProviderContent(payload.providerInput);
  if (!payloadSafety.ok) return { ok: false, called: false, reason: "safe_context_rejected", safetyStatus: "blocked" };
  const baseUrl = String(env.LLM_BASE_URL || "").replace(/\/$/, "");
  const body = {
    model: env.LLM_MODEL,
    messages: [{ role: "system", content: payload.instruction }, { role: "user", content: JSON.stringify(payload.providerInput) }],
    response_format: { type: "json_object" },
    max_tokens: boundedNumber(env.LLM_MAX_TOKENS, 1200, 100, 4000),
    temperature: 0,
    stream: false,
  };
  let lastReason = "provider_failed";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${env.LLM_API_KEY}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        lastReason = httpReason(response.status);
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) continue;
        return { ok: false, called: true, reason: lastReason, httpStatus: response.status, safetyStatus: "not-run" };
      }
      const raw = await response.text();
      if (Buffer.byteLength(raw) > MAX_RESPONSE_BYTES) return { ok: false, called: true, reason: "response_too_large", safetyStatus: "not-run" };
      let envelope;
      try { envelope = JSON.parse(raw); } catch { return { ok: false, called: true, reason: "provider_response_not_json", safetyStatus: "not-run" }; }
      const content = envelope?.choices?.[0]?.message?.content;
      if (typeof content !== "string") return { ok: false, called: true, reason: "provider_content_missing", safetyStatus: "not-run" };
      if (Buffer.byteLength(content) > MAX_RESPONSE_BYTES) return { ok: false, called: true, reason: "response_too_large", safetyStatus: "not-run" };
      let output;
      try { output = JSON.parse(content); } catch { return { ok: false, called: true, reason: "output_not_json", safetyStatus: "not-run" }; }
      const safety = containsForbiddenProviderContent(output);
      if (!safety.ok) return { ok: false, called: true, reason: "sensitive_output_rejected", safetyStatus: "blocked", blockedPatternKey: safety.blockedPatternKey || "" };
      return { ok: true, called: true, output, attempts: attempt + 1, safetyStatus: "pass", schemaVersion: UNIFIED_OUTPUT_SCHEMA_VERSION };
    } catch (error) {
      lastReason = error?.name === "AbortError" ? "provider_timeout" : "provider_network_error";
      if (signal?.aborted) return { ok: false, called: true, reason: "request_cancelled", safetyStatus: "not-run" };
      if (attempt === 0) continue;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  return { ok: false, called: true, reason: lastReason, safetyStatus: "not-run" };
}

export function buildComparisonPayload({ safeContext, accountAggregate, page }) {
  return {
    instruction: "Analyze only the supplied sanitized decision context. Return one JSON object matching the supplied schema. Separate facts, inference, evidence, confidence, and draft actions. Do not infer identities, exact amounts, communication content, route events, or external facts.",
    providerInput: {
      safeDecisionContext: safeContext,
      safeAccountAggregate: accountAggregate,
      requestedPage: page,
      outputSchemaVersion: UNIFIED_OUTPUT_SCHEMA_VERSION,
      outputSchema: unifiedOutputJsonSchema,
    },
  };
}

function httpReason(status) { return status === 401 ? "provider_unauthorized" : status === 429 ? "provider_rate_limited" : status >= 500 ? "provider_unavailable" : `provider_http_${status}`; }
function boundedNumber(value, fallback, min, max) { const number = Number(value || fallback); return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback; }
