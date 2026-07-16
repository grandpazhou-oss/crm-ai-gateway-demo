import type { AiProviderStatus } from "../types";
import type { UnifiedAiOutput } from "./contract";
import { booleanLabel, decisionText, fallbackReasonLabel, maskOpportunityToken, priorityLabel, scenarioTitle, stageLabel } from "./display";
import type { AmountDisplayMode, DecisionMode, DecisionScenarioCatalog, DecisionView } from "./types";

export function ProviderSafetyStrip({ status }: { status: AiProviderStatus | null }) {
  const provider = status?.provider || "demo";
  const fallback = status?.fallbackReason || "None";
  return (
    <section className="provider-safety-strip" aria-label="Provider and AI safety status">
      <StatusItem label="模型提供方" value={provider} />
      <StatusItem label="回退状态" value={fallbackReasonLabel(fallback)} muted={!status?.fallbackReason} />
      <StatusItem label="安全上下文" value={status?.safeContextOnly === false ? "已阻断" : "已启用"} />
      <StatusItem label="外部模型" value={status?.externalAiEnabled ? "已授权" : "未调用"} />
      <StatusItem label="原始 CRM 数据" value={status?.rawDataSent ? "已阻断" : "未发送"} danger={Boolean(status?.rawDataSent)} />
      <span className="demo-boundary">演示全权限 · 仅测试数据</span>
    </section>
  );
}

export function DecisionContextBar({
  catalog,
  amountDisplayMode,
  onAmountDisplayModeChange,
  mode,
  onModeChange,
  onOpportunityChange,
  onReset,
  onScenarioChange,
  scenarioId,
  status,
  view,
}: {
  catalog: DecisionScenarioCatalog | null;
  amountDisplayMode: AmountDisplayMode;
  mode: DecisionMode;
  onModeChange: (mode: DecisionMode) => void;
  onAmountDisplayModeChange: (mode: AmountDisplayMode) => void;
  onOpportunityChange: (token: string) => void;
  onReset: () => void;
  onScenarioChange: (scenarioId: string) => void;
  scenarioId: string;
  status: string;
  view: DecisionView | null;
}) {
  return (
    <section className="decision-context-bar">
      <label className="department-filter blocked" title="当前 Decision Portfolio 未提供经 CRM 字段验证的部门维度">
        <span>部门</span>
        <select disabled value="all-authorized"><option value="all-authorized">全部授权部门</option></select>
        <small>CRM 部门字段待接入</small>
      </label>
      <label>
        <span>分析视角</span>
        <select value={mode} onChange={(event) => onModeChange(event.target.value as DecisionMode)}>
          <option value="portfolio">组合视图</option>
          <option value="scenario">场景聚焦</option>
        </select>
      </label>
      <label>
        <span>分析场景</span>
        <select disabled={mode !== "scenario" || !catalog} value={scenarioId} onChange={(event) => onScenarioChange(event.target.value)}>
          {(catalog?.scenarios || []).map((item) => <option key={item.id} value={item.id}>{scenarioTitle(item.id, item.title)} ({item.count})</option>)}
        </select>
      </label>
      <label className="decision-opportunity-select">
        <span>脱敏商机</span>
        <select disabled={!view?.opportunities.length} value={view?.selectedOpportunity || ""} onChange={(event) => onOpportunityChange(event.target.value)}>
          {!view?.opportunities.length ? <option value="">本地安全数据不可用</option> : null}
          {(view?.opportunities || []).map((item) => <option key={item.opportunityToken} value={item.opportunityToken}>{maskOpportunityToken(item.opportunityToken)} · {stageLabel(item.stage)} · {priorityLabel(item.priority)}</option>)}
        </select>
      </label>
      <fieldset className="amount-display-toggle">
        <legend>金额显示</legend>
        <button className={amountDisplayMode === "range" ? "active" : ""} onClick={() => onAmountDisplayModeChange("range")}>金额区间</button>
        <button className={amountDisplayMode === "exact" ? "active" : ""} onClick={() => onAmountDisplayModeChange("exact")}>精确金额</button>
      </fieldset>
      <button className="decision-reset" onClick={onReset}>重置组合视图</button>
      <p>{status}</p>
      <span className="decision-writeback-boundary">只读 · 不自动写回 CRM</span>
    </section>
  );
}

export function UnifiedDecisionCard({ output, compact = false, showConfidence = true }: { output: UnifiedAiOutput; compact?: boolean; showConfidence?: boolean }) {
  return (
    <article className={`unified-decision-card${compact ? " compact" : ""}`}>
      <header>
        <div>
          <span className={`decision-priority priority-${output.priority.toLowerCase()}`}>{priorityLabel(output.priority)}</span>
          <h3>{decisionText(output.title)}</h3>
        </div>
        {showConfidence ? <Confidence value={output.confidence.level} reason={output.confidence.reason} /> : null}
      </header>

      <div className="decision-contract-grid">
        <section className="decision-facts">
          <h4>当前 CRM 事实</h4>
          {output.fact.length ? output.fact.map((item) => (
            <dl key={`${item.label}-${item.value}`}><dt>{decisionText(item.label)}</dt><dd>{decisionText(item.value)}</dd><small>{item.source}</small></dl>
          )) : <p className="muted">当前范围没有可用的安全事实。</p>}
        </section>
        <section className="decision-inference">
          <h4>AI 综合推断</h4>
          <p>{decisionText(output.inference)}</p>
          <small>AI 推断不是 CRM 事实。</small>
        </section>
        <section className="decision-actions">
          <h4>建议行动</h4>
          {output.recommendedAction.length ? output.recommendedAction.map((item) => (
            <div key={`${item.title}-${item.owner}`}>
              <strong>{decisionText(item.title)}</strong>
              <p>{decisionText(item.reason)}</p>
              <small>{decisionText(item.owner)} · {decisionText(item.due)} · {decisionText(item.status)}</small>
            </div>
          )) : <p className="muted">当前没有生成行动建议。</p>}
        </section>
      </div>

      <section className="decision-evidence">
        <h4>证据</h4>
        <div>{output.evidence.length ? output.evidence.map((item) => <span title={item.source} key={`${item.label}-${item.value}`}>{decisionText(item.value)}</span>) : <span>当前没有可追溯证据</span>}</div>
      </section>

      <footer>
        <span>模型提供方：{output.providerUsed}</span>
        <span>回退：{output.fallbackReason || "无"}</span>
        <span>安全上下文：{booleanLabel(output.safeContextUsed)}</span>
        <span>外部模型调用：{booleanLabel(output.externalModelCalled)}</span>
        <span>原始数据发送：{booleanLabel(output.rawDataSent)}</span>
      </footer>
    </article>
  );
}

export function DecisionPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="decision-page-header">
      <div><h2>{title}</h2><p>{description}</p></div>
      <span>只读决策支持</span>
    </header>
  );
}

function Confidence({ value, reason }: { value: string; reason: string }) {
  return <div className={`decision-confidence confidence-${value.toLowerCase()}`} title={reason}><span>置信度</span><strong>{value === "High" ? "高" : value === "Medium" ? "中等" : "低"}</strong><small>{reason}</small></div>;
}

function StatusItem({ label, value, danger = false, muted = false }: { label: string; value: string; danger?: boolean; muted?: boolean }) {
  return <div className={`${danger ? "danger" : ""}${muted ? " muted" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}
