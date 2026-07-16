import type { AiProviderStatus } from "../types";
import { PRODUCT_FEATURES } from "../config/features";
import type { UnifiedAiOutput } from "./contract";
import { booleanLabel, decisionText, fallbackReasonLabel, maskOpportunityToken, priorityLabel, scenarioTitle, stageLabel } from "./display";
import { externalAnalysisStatus, externalAnalysisStatusLabel } from "./externalModelUi";
import type { AmountDisplayMode, DecisionMode, DecisionScenarioCatalog, DecisionView } from "./types";

export function ProviderSafetyStrip({ status, operationStatus = "" }: { status: AiProviderStatus | null; operationStatus?: string }) {
  const externalStatus = externalAnalysisStatus(status);
  return (
    <section className="provider-safety-strip compact" aria-label="模型和安全状态">
      <strong>{status?.provider || "demo"} Provider</strong><span aria-hidden="true">·</span>
      <span>Safe Context 已启用</span><span aria-hidden="true">·</span>
      <span className={`external-status status-${externalStatus}`}>{externalAnalysisStatusLabel(status, true)}</span><span aria-hidden="true">·</span>
      <span>原始数据{status?.rawDataSent ? "已阻断" : "未外发"}</span><span aria-hidden="true">·</span>
      <span>只读</span><span className="operation-status" aria-live="polite">{operationStatus}</span>
    </section>
  );
}

export function DecisionContextBar({ catalog, amountDisplayMode, onAmountDisplayModeChange, mode, onModeChange, onOpportunityChange, onReset, onScenarioChange, scenarioId, view }: {
  catalog: DecisionScenarioCatalog | null;
  amountDisplayMode: AmountDisplayMode;
  mode: DecisionMode;
  onModeChange: (mode: DecisionMode) => void;
  onAmountDisplayModeChange: (mode: AmountDisplayMode) => void;
  onOpportunityChange: (token: string) => void;
  onReset: () => void;
  onScenarioChange: (scenarioId: string) => void;
  scenarioId: string;
  status?: string;
  view: DecisionView | null;
}) {
  return (
    <section className="decision-context-bar" aria-label="全局分析筛选">
      <label className="department-filter blocked" title="当前 Decision Portfolio 未提供经 CRM 字段验证的部门维度"><span>部门</span><select disabled value="pending"><option value="pending">CRM 部门字段待接入</option></select></label>
      <label><span>分析视角</span><select value={mode} onChange={(event) => onModeChange(event.target.value as DecisionMode)}><option value="portfolio">组合视图</option><option value="scenario">场景聚焦</option></select></label>
      <label><span>分析场景</span><select disabled={mode !== "scenario" || !catalog} value={scenarioId} onChange={(event) => onScenarioChange(event.target.value)}>{(catalog?.scenarios || []).map((item) => <option key={item.id} value={item.id}>{scenarioTitle(item.id, item.title)} ({item.count})</option>)}</select></label>
      <label className="decision-opportunity-select"><span>脱敏商机</span><select disabled={!view?.opportunities.length} value={view?.selectedOpportunity || ""} onChange={(event) => onOpportunityChange(event.target.value)}>{!view?.opportunities.length ? <option value="">本地安全数据不可用</option> : null}{(view?.opportunities || []).map((item) => <option key={item.opportunityToken} value={item.opportunityToken}>{maskOpportunityToken(item.opportunityToken)} · {stageLabel(item.stage)} · {priorityLabel(item.priority)}</option>)}</select></label>
      <fieldset className="amount-display-toggle"><legend>金额显示</legend><button className={amountDisplayMode === "range" ? "active" : ""} onClick={() => onAmountDisplayModeChange("range")}>金额区间</button><button className={amountDisplayMode === "exact" ? "active" : ""} onClick={() => onAmountDisplayModeChange("exact")}>精确金额</button></fieldset>
      <button className="decision-reset" onClick={onReset}>重置</button>
    </section>
  );
}

export function DecisionPageHeader({ title, description }: { title: string; description: string }) {
  return <header className="decision-page-header"><div><h2>{title}</h2><p>{description}</p></div><span>只读决策支持</span></header>;
}

export function ExternalModelReadiness({ status, latestAnalysis = "当前审计源未提供" }: { status: AiProviderStatus | null; latestAnalysis?: string }) {
  const state = externalAnalysisStatus(status);
  return <section className={`external-readiness-banner status-${state}`} aria-label="外部模型可用性"><div><span>外部模型可用性</span><strong>{externalAnalysisStatusLabel(status)}</strong></div><dl><dt>最近深度分析</dt><dd>{latestAnalysis}</dd><dt>自动调用</dt><dd>禁用</dd></dl></section>;
}

export function DeepAnalysisReservation({ status, templateId, title }: { status: AiProviderStatus | null; templateId: string; title: string }) {
  const state = externalAnalysisStatus(status);
  const descriptionId = `deep-analysis-${templateId.toLowerCase()}`;
  return <section className={`deep-analysis-reservation status-${state}`} aria-label={`${title}深度分析预留`}><div><span>{templateId}</span><h3>{title}</h3><p id={descriptionId}>深度分析尚未启用。完成外部模型授权、客户历史安全聚合和调用确认流程后开放。</p></div><button disabled={!PRODUCT_FEATURES.deepAnalysis} aria-describedby={descriptionId}>进行深度分析</button></section>;
}

export function ProductStatusPanel({ kind, title, message }: { kind: "loading" | "empty" | "error" | "blocked" | "fallback"; title: string; message: string }) {
  return <section className={`product-status-panel status-${kind}`} role={kind === "error" || kind === "blocked" ? "status" : undefined}><span>{kind === "blocked" ? "受控阻断" : kind === "fallback" ? "安全回退" : "状态"}</span><h3>{title}</h3><p>{message}</p></section>;
}

export function FactList({ output }: { output: UnifiedAiOutput }) {
  return <section className="product-fact-list"><h3>当前 CRM 事实</h3>{output.fact.map((item) => <dl key={`${item.label}-${item.value}`}><dt>{decisionText(item.label)}</dt><dd>{decisionText(item.value)}</dd></dl>)}{!output.fact.length ? <p className="empty-copy">当前范围没有可用的安全事实。</p> : null}</section>;
}

export function EvidenceList({ output }: { output: UnifiedAiOutput }) {
  return <section className="product-evidence-list"><h3>核心证据</h3>{output.evidence.map((item) => <div key={`${item.label}-${item.value}`}><span>{decisionText(item.label)}</span><strong>{decisionText(item.value)}</strong></div>)}{!output.evidence.length ? <p className="empty-copy">当前没有可追溯证据。</p> : null}</section>;
}

export function InferencePanel({ output }: { output: UnifiedAiOutput }) {
  return <section className="product-inference"><h3>AI 综合判断</h3><p>{decisionText(output.inference)}</p><small>AI 推断不是 CRM 事实。</small></section>;
}

export function TechnicalDetails({ output }: { output: UnifiedAiOutput }) {
  return <details className="technical-details"><summary>查看技术详情</summary><dl><dt>当前模型</dt><dd>{output.providerUsed}</dd><dt>回退原因</dt><dd>{fallbackReasonLabel(output.fallbackReason)}</dd><dt>Safe Context</dt><dd>{booleanLabel(output.safeContextUsed)}</dd><dt>外部模型调用</dt><dd>{booleanLabel(output.externalModelCalled)}</dd><dt>原始 CRM 数据外发</dt><dd>{booleanLabel(output.rawDataSent)}</dd></dl><div>{output.fact.map((item) => <code key={item.source}>{item.source}</code>)}{output.evidence.map((item) => <code key={item.source}>{item.source}</code>)}</div></details>;
}

export function UnifiedDecisionCard({ output, compact = false, showConfidence = true }: { output: UnifiedAiOutput; compact?: boolean; showConfidence?: boolean }) {
  return <article className={`unified-decision-card${compact ? " compact" : ""}`}><header><div><span className={`decision-priority priority-${output.priority.toLowerCase()}`}>{priorityLabel(output.priority)}</span><h3>{decisionText(output.title)}</h3></div>{showConfidence ? <div className={`decision-confidence confidence-${output.confidence.level.toLowerCase()}`}><span>置信度</span><strong>{decisionText(output.confidence.level)}</strong></div> : null}</header><div className="decision-contract-grid"><FactList output={output} /><InferencePanel output={output} /><section className="decision-actions"><h3>建议行动</h3>{output.recommendedAction.map((item) => <div key={`${item.title}-${item.reason}`}><strong>{decisionText(item.title)}</strong><p>{decisionText(item.reason)}</p></div>)}</section></div><EvidenceList output={output} /><TechnicalDetails output={output} /></article>;
}
