import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAiDemoContext, buildProviderContext } from "./ai/contextBuilder.mjs";
import { runAiAction } from "./ai/actionService.mjs";
import { runAi, runAiDemoChat } from "./ai/aiService.mjs";
import { resolveProviderStatus } from "./ai/providers/providerRouter.mjs";
import { createDynamicsClient } from "./dynamicsClient.mjs";
import { createJsonStore, createOpportunityStore } from "./store.mjs";
import { generateSyntheticOpportunities } from "./data/syntheticOpportunityGenerator.mjs";
import { getDecisionOpportunity, getDecisionView, listDecisionScenarios } from "./decision/decisionService.mjs";
import { transformOpportunity } from "./gateway.mjs";
import { buildManagementDashboard } from "./management.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const mockStore = createJsonStore({
  opportunitiesPath: path.join(__dirname, "data", "opportunities.example.json"),
  auditPath: path.join(__dirname, "data", "audit-log.json"),
  transformOpportunities: (templates) => generateSyntheticOpportunities(templates, {
    count: Number(process.env.MOCK_OPPORTUNITY_COUNT || 54),
  }),
});

export function createApp({
  store = createOpportunityStore({
    mockStore,
    dynamicsClient: createDynamicsClient(),
    dataSource: process.env.DATA_SOURCE || "mock",
  }),
  now = () => new Date(),
} = {}) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/opportunities", async (_request, response) => {
    response.json({ data: aiDemoScope(await store.listOpportunities()) });
  });

  app.get("/api/opportunities/:id", async (request, response) => {
    const opportunity = aiDemoScope(await store.listOpportunities()).find((item) => item.id === request.params.id) || null;
    if (!opportunity) return response.status(404).json({ error: "Opportunity not found" });
    return response.json({ data: opportunity });
  });

  app.get("/api/management-dashboard", async (request, response) => {
    const opportunities = aiDemoScope(await store.listOpportunities());
    const filters = Object.fromEntries(Object.entries(request.query).filter(([, value]) => value !== ""));
    response.json({ data: buildManagementDashboard(opportunities, filters, now()) });
  });

  app.get("/api/decision-scenarios", (_request, response) => {
    response.json({ data: listDecisionScenarios() });
  });

  app.get("/api/decision-view", (request, response) => {
    try {
      const mode = String(request.query.mode || "");
      const scenarioId = String(request.query.scenarioId || "");
      const opportunityToken = String(request.query.opportunityToken || "");
      const data = getDecisionView({ mode, scenarioId, opportunityToken });
      if (!data) return response.status(404).json({ error: "Decision opportunity not found in scope" });
      return response.json({ data });
    } catch (error) {
      return response.status(400).json({ error: error instanceof Error ? error.message : "Invalid decision scope" });
    }
  });

  app.get("/api/decision-opportunities/:opportunityToken", (request, response) => {
    try {
      const mode = String(request.query.mode || "");
      const scenarioId = String(request.query.scenarioId || "");
      const data = getDecisionOpportunity({ mode, scenarioId, opportunityToken: request.params.opportunityToken });
      if (!data) return response.status(404).json({ error: "Decision opportunity not found in scope" });
      return response.json({ data });
    } catch (error) {
      return response.status(400).json({ error: error instanceof Error ? error.message : "Invalid decision scope" });
    }
  });

  app.get("/api/dynamics/status", (_request, response) => {
    response.json({ data: store.getDynamicsStatus?.() || { dataSource: "mock", isConfigured: false, canRefresh: false } });
  });

  app.post("/api/dynamics/test-connection", async (_request, response) => {
    try {
      const result = await store.testDynamicsConnection();
      response.json({ ok: true, data: result, status: store.getDynamicsStatus?.() });
    } catch (error) {
      response.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "Dynamics connection failed",
        status: store.getDynamicsStatus?.(),
      });
    }
  });

  app.post("/api/dynamics/sync", async (_request, response) => {
    try {
      const result = await store.syncDynamics();
      response.json({ ok: true, data: result, status: store.getDynamicsStatus?.() });
    } catch (error) {
      response.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "Dynamics sync failed",
        status: store.getDynamicsStatus?.(),
      });
    }
  });

  app.post("/api/gateway/transform", async (request, response) => {
    const { role = "Sales Owner", opportunity_id } = request.body || {};
    const opportunity = aiDemoScope(await store.listOpportunities()).find((item) => item.id === opportunity_id) || null;
    if (!opportunity) return response.status(404).json({ error: "Opportunity not found" });
    try {
      const result = transformOpportunity(opportunity, role, now());
      await store.appendAudit({
        timestamp: new Date().toISOString(),
        type: "transform",
        role,
        opportunity_id,
        removed_fields: result.removedFields,
        transformed_fields: result.transformedFields,
        safe_payload_keys: Object.keys(result.safePayload),
        checklist_result: result.checklist.every((item) => item.pass) ? "pass" : "fail",
        raw_data_sent: false,
        safe_context_used: true,
        provider: "demo",
        external_model_called: false,
      });
      return response.json(result);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }
  });

  app.post("/api/ai/:functionName", async (request, response) => {
    const { role = "Sales Owner", opportunity_id, safePayload, language, minimalJson = false } = request.body || {};
    const { result, audit } = await runAi({
      functionName: request.params.functionName,
      safePayload: safePayload || {},
      role,
      opportunity_id,
      language,
      minimalJson,
    });
    await store.appendAudit({
      timestamp: new Date().toISOString(),
      ...audit,
    });
    const body = { ...result, audit: aiResponseAuditSummary(audit) };
    if (result.blocked) return response.status(400).json(body);
    return response.json(body);
  });

  app.post("/api/ai-demo/chat", async (request, response) => {
    const { question = "", filters = {}, role = "management", language = "zh-CN", minimalJson = false } = request.body || {};
    const opportunities = aiDemoScope(await store.listOpportunities());
    const dynamicsStatus = store.getDynamicsStatus?.() || { dataSource: "mock", recordCount: 0, lastRefreshTime: "" };
    const context = buildAiDemoContext({ opportunities, filters, dynamicsStatus, now: now() });
    const { result, audit } = await runAiDemoChat({ question, context, role, language, minimalJson });
    const entry = await store.appendAudit({
      timestamp: new Date().toISOString(),
      ...audit,
      removed_fields: ["customer_name", "contact_name", "contact_email", "phone", "address", "detailed_address", "exact_revenue", "exact_margin", "supplier_cost", "contract_text", "contract_price", "meeting_transcript"],
    });
    const body = {
      blocked: Boolean(result.blocked),
      answer: result.answer || result.error || "",
      error: result.error || "",
      provider: result.provider || "demo",
      external_model_called: Boolean(result.external_model_called),
      intent: result.intent || audit.intent,
      context_summary: context.contextSummary,
      audit: entry,
    };
    if (result.blocked) return response.status(400).json(body);
    return response.json(body);
  });

  app.get("/api/ai/provider-status", (_request, response) => {
    const status = resolveProviderStatus(process.env);
    response.json({
      data: {
        provider: status.provider,
        providerRequested: status.providerRequested,
        externalAiEnabled: status.externalAiEnabled,
        configured: status.configured,
        safeContextOnly: true,
        rawDataSent: false,
        fallbackReason: status.fallbackReason || "",
        baseUrlConfigured: Boolean(process.env.LLM_BASE_URL),
        apiKeyConfigured: Boolean(process.env.LLM_API_KEY),
        modelConfigured: Boolean(process.env.LLM_MODEL),
        modelName: process.env.LLM_MODEL || "",
        timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 20000),
        retryPolicy: "response-format-once",
        maxResponseTokens: Number(process.env.LLM_MAX_TOKENS || 1200),
        schemaVersion: "unified-ai-output-v1",
        lastConnectionCheckAt: "",
        lastConnectionCheckResult: "not-run",
      },
    });
  });

  app.get("/api/ai-context/opportunity/:id", async (request, response) => {
    const opportunities = aiDemoScope(await store.listOpportunities());
    const dynamicsStatus = store.getDynamicsStatus?.() || { dataSource: "mock", recordCount: 0, lastRefreshTime: "" };
    const context = buildAiDemoContext({ opportunities, filters: {}, dynamicsStatus, now: now() });
    const providerContext = buildProviderContext(context);
    const item = providerContext.safeOpportunityContext.find((entry) => entry.opportunity_token === request.params.id);
    if (!item) return response.status(404).json({ error: "Safe context not found" });
    return response.json({
      data: item,
      context_summary: context.contextSummary,
      safe_payload_keys: ["safeOpportunityContext"],
    });
  });

  app.post("/api/ai-actions/:actionName", async (request, response) => {
    const allowed = new Set(["opportunity-brief", "next-best-actions", "risk-summary", "data-doctor", "meeting-copilot", "customer-growth", "draft-pack"]);
    if (!allowed.has(request.params.actionName)) return response.status(404).json({ error: "AI action not found" });
    const opportunities = aiDemoScope(await store.listOpportunities());
    const dynamicsStatus = store.getDynamicsStatus?.() || { dataSource: "mock", recordCount: 0, lastRefreshTime: "" };
    const body = runAiAction({
      actionName: request.params.actionName,
      opportunities,
      dynamicsStatus,
      params: request.body || {},
      now: now(),
    });
    const entry = await store.appendAudit({
      timestamp: new Date().toISOString(),
      ...body.audit,
    });
    const result = { ...body, audit: entry };
    if (result.blocked) return response.status(400).json(result);
    return response.json(result);
  });

  app.get("/api/audit-log", async (_request, response) => {
    response.json({ data: await store.getAuditLog() });
  });

  app.post("/api/audit-log/reset", async (_request, response) => {
    await store.resetAuditLog();
    response.json({ ok: true });
  });

  app.use(express.static(path.join(rootDir, "dist")));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(rootDir, "dist", "index.html"));
  });

  return app;
}

function aiResponseAuditSummary(audit = {}) {
  return Object.fromEntries([
    "provider_used",
    "external_model_called",
    "fallback_used",
    "fallback_reason",
    "output_guard_status",
    "response_format_requested",
    "response_format_retry_used",
    "safe_context_used",
    "raw_data_sent",
    "blocked_pattern_key",
  ].map((key) => [key, audit[key] ?? ""]));
}

function aiDemoScope(opportunities) {
  const source = Array.isArray(opportunities) ? opportunities : [];
  const demo = source.filter((item) => item.is_ai_demo || String(item.opportunity_name || item.name || "").startsWith("[AI-DEMO]"));
  return demo.length > 0 ? demo : source;
}
