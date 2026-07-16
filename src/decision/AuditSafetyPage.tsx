import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AiProviderStatus, AuditEntry } from "../types";
import { PRODUCT_FEATURES } from "../config/features";
import { getDecisionView, resetDecisionComparison, runDecisionComparison } from "../api";
import { DecisionPageHeader, ProductStatusPanel, UnifiedDecisionCard } from "./DecisionUi";
import { fallbackReasonLabel, maskOpportunityToken, scenarioTitle } from "./display";
import { externalAnalysisStatusLabel } from "./externalModelUi";
import { auditCounts, safeAuditRows, sha256Fingerprint } from "./productModel";
import type { ComparisonPage, ComparisonResult } from "./comparisonTypes";
import type { AmountDisplayMode, DecisionScenarioCatalog, DecisionView } from "./types";

export function AuditSafetyPage({ amountDisplayMode, auditLog, catalog, providerStatus, view }: { amountDisplayMode: AmountDisplayMode; auditLog: AuditEntry[]; catalog: DecisionScenarioCatalog | null; providerStatus: AiProviderStatus | null; view: DecisionView | null }) {
  const [fingerprint, setFingerprint] = useState("正在计算…");
  const rows = useMemo(() => safeAuditRows(auditLog), [auditLog]);
  const counts = useMemo(() => auditCounts(auditLog), [auditLog]);

  useEffect(() => {
    let active = true;
    if (!view) { setFingerprint("当前上下文不可用"); return; }
    sha256Fingerprint(view.safeContext).then((value) => { if (active) setFingerprint(value); }).catch(() => { if (active) setFingerprint("指纹计算不可用"); });
    return () => { active = false; };
  }, [view]);

  return <section className="audit-safety-page" data-page="gateway">
    <DecisionPageHeader title="审计与安全" description="查看当前访问边界、模型提供方状态和不含业务原文的安全审计元数据。" />
    <div className="audit-status-grid">
      <AuditSection title="当前访问范围"><dl><dt>当前角色</dt><dd>演示全权限</dd><dt>当前部门范围</dt><dd>CRM 部门字段待接入</dd><dt>当前商机 Token</dt><dd>{view ? maskOpportunityToken(view.selectedOpportunity) : "不可用"}</dd><dt>金额显示模式</dt><dd>{amountDisplayMode === "range" ? "金额区间" : "精确金额（仅界面）"}</dd><dt>客户身份</dt><dd>已脱敏</dd></dl></AuditSection>
      <AuditSection title="数据安全状态"><dl><dt>Safe Context</dt><dd className="safe">已启用</dd><dt>原始 CRM 数据外发</dt><dd className="safe">否</dd><dt>精确金额发送给模型</dt><dd className="safe">否</dd><dt>Timeline 原文发送给模型</dt><dd className="safe">否</dd><dt>客户身份发送给模型</dt><dd className="safe">否</dd><dt>CRM 自动写回</dt><dd className="safe">禁用</dd></dl></AuditSection>
      <AuditSection title="运行时校验"><dl><dt>外部模型状态</dt><dd>{externalAnalysisStatusLabel(providerStatus)}</dd><dt>是否调用外部模型</dt><dd>否</dd><dt>回退原因</dt><dd>{fallbackReasonLabel(providerStatus?.fallbackReason || "")}</dd><dt>输出结构校验</dt><dd>{rows[0]?.schemaStatus || "当前审计源未提供"}</dd><dt>安全校验</dt><dd>{rows[0]?.safetyStatus || "当前审计源未提供"}</dd><dt>引用校验</dt><dd>{rows[0]?.citationStatus || "当前审计源未提供"}</dd></dl></AuditSection>
    </div>

    <ProviderConfigurationStatus status={providerStatus} />

    <section className="audit-transform-summary product-panel"><header><div><h3>安全转换摘要</h3><p>仅展示聚合数量，不展示 Safe Context Payload 或字段值。</p></div></header><div><AuditCount label="Safe Context 字段" value={view?.safeContextKeys.length ?? counts.safeFields} /><AuditCount label="已脱敏或移除字段" value={counts.removedFields} /><AuditCount label="已执行安全转换字段" value={counts.transformedFields} /><AuditCount label="金额区间化字段" value={counts.amountBands} /></div><section className="client-fingerprint"><span>客户端上下文指纹（非服务端审计凭证）</span><code>{fingerprint}</code><p>基于当前 Safe Context 的 canonical JSON 在浏览器内计算；不会替代历史服务端审计 Hash。</p></section></section>

    <section className="safe-audit-log product-panel"><header><div><h3>安全审计记录</h3><p>仅保留请求和安全校验元数据。</p></div><span>{rows.length} 条</span></header>{rows.length ? <div className="safe-audit-table" role="table" aria-label="安全审计记录"><div className="safe-audit-head" role="row"><span>时间</span><span>请求 ID</span><span>页面</span><span>模型提供方</span><span>是否调用外部模型</span><span>响应耗时</span><span>输出结构校验</span><span>安全校验</span><span>引用校验</span><span>回退原因</span><span>历史审计 Hash</span></div>{rows.map((row) => <article role="row" key={row.id}><span data-label="时间">{formatTime(row.time)}</span><span data-label="请求 ID">{row.requestId}</span><span data-label="页面">{row.page}</span><span data-label="模型提供方">{row.provider}</span><span data-label="是否调用外部模型">{row.externalCalled}</span><span data-label="响应耗时">{row.latency}</span><span data-label="输出结构校验">{row.schemaStatus}</span><span data-label="安全校验">{row.safetyStatus}</span><span data-label="引用校验">{row.citationStatus}</span><span data-label="回退原因">{row.fallback}</span><span data-label="历史审计 Hash">当前审计源未提供</span></article>)}</div> : <div className="formal-empty-state"><div className="empty-skeleton" /><h3>暂无安全审计元数据</h3><p>正式页面不会为展示效果创建审计事件。</p></div>}</section>

    <ModelComparison catalog={catalog} providerStatus={providerStatus} view={view} />
  </section>;
}

const COMPARISON_PAGE_OPTIONS: Array<{ value: ComparisonPage; label: string }> = [
  { value: "cockpit", label: "AI 驾驶舱" }, { value: "risk", label: "风险与优先级" },
  { value: "opportunity360", label: "商机 360" }, { value: "action", label: "行动看板" },
  { value: "meeting", label: "会议副驾" }, { value: "portfolio", label: "组合洞察" },
];

function ModelComparison({ catalog, providerStatus, view }: { catalog: DecisionScenarioCatalog | null; providerStatus: AiProviderStatus | null; view: DecisionView | null }) {
  const available = PRODUCT_FEATURES.modelComparison && providerStatus?.comparisonAvailable === true;
  const initialScenario = view?.scenario?.id || "multi-risk-priority";
  const [scenarioId, setScenarioId] = useState(initialScenario);
  const [scopeView, setScopeView] = useState<DecisionView | null>(view?.mode === "scenario" ? view : null);
  const [opportunityToken, setOpportunityToken] = useState(view?.selectedOpportunity || "");
  const [page, setPage] = useState<ComparisonPage>("risk");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!available) return;
    let active = true;
    getDecisionView("scenario", scenarioId).then((response) => {
      if (!active) return;
      setScopeView(response.data);
      setOpportunityToken(response.data.defaultOpportunity);
      setResult(null);
    }).catch(() => { if (active) setMessage("场景范围暂不可用。"); });
    return () => { active = false; };
  }, [available, scenarioId]);

  async function startComparison() {
    if (!available || !opportunityToken) return;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setState("loading"); setMessage(""); setResult(null);
    try {
      const response = await runDecisionComparison({ scenarioId, opportunityToken, page }, next.signal);
      setResult(response.data);
      setState("idle");
    } catch (error) {
      if (next.signal.aborted) { setMessage("已取消本次安全对比。"); setState("idle"); return; }
      setMessage(error instanceof Error ? error.message : "安全对比暂不可用。");
      setState("error");
    }
  }

  async function resetComparison() {
    controller.current?.abort();
    setResult(null); setMessage(""); setState("idle");
    if (available) await resetDecisionComparison().catch(() => undefined);
  }

  return <section className="model-comparison-placeholder product-panel"><header><div><h3>模型对比</h3><p>使用同一 Safe Context 比较 Demo 与已批准外部模型。</p></div><span>{available ? "可用" : "未启用"}</span></header>
    <div className="comparison-reservation-controls">
      <label><span>分析场景</span><select disabled={!available} value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>{(catalog?.scenarios || []).map((item) => <option key={item.id} value={item.id}>{scenarioTitle(item.id, item.title)}</option>)}</select></label>
      <label><span>脱敏商机</span><select disabled={!available || !scopeView} value={opportunityToken} onChange={(event) => { setOpportunityToken(event.target.value); setResult(null); }}>{(scopeView?.opportunities || []).map((item) => <option key={item.opportunityToken} value={item.opportunityToken}>{maskOpportunityToken(item.opportunityToken)}</option>)}</select></label>
      <label><span>对比页面</span><select disabled={!available} value={page} onChange={(event) => { setPage(event.target.value as ComparisonPage); setResult(null); }}>{COMPARISON_PAGE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label><span>上下文模式</span><select disabled><option>仅 CRM Safe Context</option></select></label>
    </div>
    {!available ? <ProductStatusPanel kind="blocked" title="外部模型对比尚未启用" message="外部模型对比尚未启用，完成安全授权和 Provider 配置后开放。" /> : null}
    {available ? <div className="comparison-actions"><button disabled={state === "loading" || !opportunityToken} onClick={startComparison}>开始安全对比</button><button disabled={state !== "loading"} onClick={() => controller.current?.abort()}>取消</button><button onClick={resetComparison}>重置</button></div> : null}
    {state === "loading" ? <ProductStatusPanel kind="loading" title="正在执行安全对比" message="仅向已批准 Provider 发送当前 Safe Context；页面不会自动重复调用。" /> : null}
    {message ? <ProductStatusPanel kind={state === "error" ? "error" : "fallback"} title={state === "error" ? "模型对比失败" : "模型对比状态"} message={message} /> : null}
    {result ? <ComparisonResultView result={result} /> : null}
    <p className="comparison-boundary">页面加载、导航和筛选变化均不会自动调用模型。默认结果继续来自 Demo Provider。</p>
  </section>;
}

function ComparisonResultView({ result }: { result: ComparisonResult }) {
  if (result.status !== "completed" || !result.externalOutput || !result.demoOutput) return <ProductStatusPanel kind="fallback" title="已安全回退 Demo" message={result.fallbackReason || "外部模型对比未完成。"} />;
  return <div className="comparison-results"><section className="comparison-metadata"><dl><dt>请求 ID</dt><dd>{result.requestId}</dd><dt>模型提供方 / 模型</dt><dd>{result.provider} / {result.model}</dd><dt>响应耗时</dt><dd>{result.latencyMs} ms</dd><dt>输出结构校验</dt><dd>{result.schemaStatus}</dd><dt>安全校验</dt><dd>{result.safetyStatus}</dd><dt>引用校验</dt><dd>{result.citationStatus}</dd><dt>回退原因</dt><dd>{result.fallbackReason || "无"}</dd><dt>综合评分</dt><dd>{result.evaluation?.total ?? "未记录"}</dd></dl></section><div className="comparison-output-grid"><section><h3>Demo Provider</h3><UnifiedDecisionCard compact output={result.demoOutput} /></section><section><h3>External Provider</h3><UnifiedDecisionCard compact output={result.externalOutput} /></section></div>{result.evaluation ? <section className="comparison-score-grid">{Object.entries(result.evaluation.scores).map(([key, value]) => <article key={key}><span>{scoreLabel(key)}</span><strong>{value === null ? "待复测" : value}</strong></article>)}</section> : null}</div>;
}

function scoreLabel(key: string) { return ({ factAccuracy: "事实准确性", evidenceCoverage: "证据覆盖", requiredActionCoverage: "行动覆盖", claimSafety: "禁止结论", priorityAlignment: "优先级一致性", confidenceAlignment: "置信度一致性", contractCompliance: "契约合规", safetyCompliance: "安全合规", stability: "稳定性" } as Record<string, string>)[key] || key; }

function ProviderConfigurationStatus({ status }: { status: AiProviderStatus | null }) {
  return <section className="provider-configuration product-panel"><header><div><h3>模型与模型提供方</h3><p>仅展示服务端配置状态，不展示密钥、服务地址、Prompt 或 Payload。</p></div><span>{PRODUCT_FEATURES.externalModelStatus ? "状态可见" : "状态隐藏"}</span></header><dl><dt>模型提供方类型</dt><dd>{status?.providerRequested || "demo"}</dd><dt>当前模型</dt><dd>{status?.modelName || "未配置"}</dd><dt>服务地址配置</dt><dd>{configuredLabel(status?.baseUrlConfigured)}</dd><dt>访问密钥配置</dt><dd>{configuredLabel(status?.apiKeyConfigured)}</dd><dt>模型配置</dt><dd>{configuredLabel(status?.modelConfigured)}</dd><dt>外部调用授权</dt><dd>{status?.externalAiEnabled ? "已启用" : "未启用"}</dd><dt>请求超时</dt><dd>{status?.timeoutMs ? `${status.timeoutMs} ms` : "未记录"}</dd><dt>重试策略</dt><dd>{status?.retryPolicy === "response-format-once" ? "仅结构格式兼容重试 1 次" : "未记录"}</dd><dt>最大响应</dt><dd>{status?.maxResponseTokens ? `${status.maxResponseTokens} tokens` : "未记录"}</dd><dt>输出结构版本</dt><dd>{status?.schemaVersion || "未记录"}</dd><dt>最近连接检查</dt><dd>{status?.lastConnectionCheckAt || "未执行"}</dd><dt>连接检查结果</dt><dd>{status?.lastConnectionCheckResult === "not-run" ? "未执行" : status?.lastConnectionCheckResult || "未记录"}</dd></dl></section>;
}

function AuditSection({ title, children }: { title: string; children: ReactNode }) { return <section className="audit-status-section product-panel"><h3>{title}</h3>{children}</section>; }
function AuditCount({ label, value }: { label: string; value: number | null | undefined }) { return <article><span>{label}</span><strong>{value === null || value === undefined ? "未记录" : value}</strong></article>; }
function configuredLabel(value: boolean | undefined) { return value ? "已配置" : "未配置"; }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false }); }
