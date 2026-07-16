import { DecisionPageHeader, UnifiedDecisionCard } from "./DecisionUi";
import { booleanLabel, decisionText, maskOpportunityToken, priorityLabel, stageLabel } from "./display";
import type { AmountDisplayMode, DecisionView } from "./types";

export type DecisionPage = "cockpit" | "risk" | "detail" | "actionBoard" | "meeting" | "portfolio";

const PAGE_COPY: Record<DecisionPage, { title: string; description: string; output: keyof DecisionView["pack"] }> = {
  cockpit: { title: "AI 驾驶舱", description: "从脱敏本地数据识别组合风险、优先行动和管理层关注事项。", output: "cockpit" },
  risk: { title: "风险与优先级", description: "按等级、证据和置信度审阅当前范围内的风险队列。", output: "risk" },
  detail: { title: "商机 360", description: "查看单一脱敏商机的事实、推断、证据和建议行动。", output: "opportunity360" },
  actionBoard: { title: "行动看板", description: "只读展示建议行动；不会创建任务、发送邮件或写回 CRM。", output: "action" },
  meeting: { title: "会议副驾", description: "仅使用派生准备度信号，不读取或展示 Timeline 原文。", output: "meeting" },
  portfolio: { title: "组合洞察", description: "在授权范围内查看增长假设和数据质量信号。", output: "portfolio" },
};

export function DecisionWorkspace({ amountDisplayMode, page, view, loading, error, onRetry, onOpportunityChange }: {
  amountDisplayMode: AmountDisplayMode;
  page: DecisionPage;
  view: DecisionView | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onOpportunityChange: (token: string) => void;
}) {
  const copy = PAGE_COPY[page];
  if (loading) return <LoadingState />;
  if (error || !view) return <ErrorState message={error || "未返回本地决策视图。"} onRetry={onRetry} />;
  const output = view.pack[copy.output];
  return (
    <section className="decision-workspace" data-page={page}>
      <DecisionPageHeader title={copy.title} description={copy.description} />
      <div className="decision-scope-metrics" aria-label="当前分析范围">
        <Metric label="范围" value={view.scopeSummary.scopeCount} />
        <Metric label="严重" value={view.scopeSummary.criticalCount} tone="critical" />
        <Metric label="高风险" value={view.scopeSummary.highCount} tone="high" />
        <Metric label="待复核" value={view.scopeSummary.reviewRequiredCount} />
      </div>
      <div className="evidence-workspace-grid">
        <RiskQueue view={view} onOpportunityChange={onOpportunityChange} />
        <div className="decision-chain">
          <UnifiedDecisionCard output={output} showConfidence={false} />
          {page === "detail" ? <ContextAvailability /> : null}
          {page === "meeting" ? <MeetingSignals view={view} /> : null}
          {page === "portfolio" ? <AccountSignals view={view} /> : null}
          {page === "cockpit" ? <PrioritySummary view={view} /> : null}
        </div>
        <DecisionContextRail amountDisplayMode={amountDisplayMode} output={output} view={view} />
      </div>
    </section>
  );
}

function RiskQueue({ view, onOpportunityChange }: { view: DecisionView; onOpportunityChange: (token: string) => void }) {
  const selectedIndex = Math.max(0, view.opportunities.findIndex((item) => item.opportunityToken === view.selectedOpportunity));
  const start = Math.max(0, Math.min(selectedIndex - 2, view.opportunities.length - 7));
  const items = view.opportunities.slice(start, start + 7);
  return <aside className="risk-queue" aria-label="商机与风险队列">
    <header><div><strong>商机 / 风险队列</strong><span>{view.opportunities.length} 条脱敏商机</span></div></header>
    <div className="risk-queue-list">{items.map((item) => (
      <button key={item.opportunityToken} className={item.opportunityToken === view.selectedOpportunity ? "selected" : ""} onClick={() => onOpportunityChange(item.opportunityToken)}>
        <span className={`risk-level priority-${item.priority.toLowerCase()}`}>{priorityLabel(item.priority)}</span>
        <strong>{maskOpportunityToken(item.opportunityToken)}</strong>
        <small>{stageLabel(item.stage)}</small>
      </button>
    ))}</div>
    <footer>客户身份与 CRM ID 已脱敏</footer>
  </aside>;
}

function DecisionContextRail({ amountDisplayMode, output, view }: { amountDisplayMode: AmountDisplayMode; output: DecisionView["pack"][keyof DecisionView["pack"]]; view: DecisionView }) {
  return <aside className="decision-context-rail" aria-label="置信度和安全状态">
    <section className={`rail-card confidence-${output.confidence.level.toLowerCase()}`}><h3>置信度</h3><strong>{decisionText(output.confidence.level)}</strong><p>{decisionText(output.confidence.reason)}</p></section>
    <section className="rail-card"><h3>模型与安全</h3><dl><dt>模型提供方</dt><dd>{output.providerUsed}</dd><dt>安全上下文</dt><dd>{booleanLabel(output.safeContextUsed)}</dd><dt>外部模型调用</dt><dd>{booleanLabel(output.externalModelCalled)}</dd><dt>原始数据发送</dt><dd>{booleanLabel(output.rawDataSent)}</dd><dt>精确金额发送</dt><dd>否</dd></dl></section>
    <section className="rail-card"><h3>当前范围</h3><dl><dt>权限</dt><dd>演示全权限</dd><dt>部门</dt><dd>全部授权部门</dd><dt>金额显示</dt><dd>{amountDisplayMode === "range" ? "金额区间" : "精确金额（仅界面）"}</dd><dt>脱敏商机</dt><dd>{maskOpportunityToken(view.selectedOpportunity)}</dd></dl></section>
    <section className="rail-card intelligence-status"><h3>情报状态</h3><strong>仅基于 CRM 分析</strong><p>外部情报和来源引用尚未启用。</p></section>
  </aside>;
}

function ContextAvailability() {
  return <section className="context-availability"><article><span>客户历史事实</span><strong>尚未接入</strong><p>当前输出未使用客户历史原始记录。</p></article><article><span>外部事实</span><strong>情报不足</strong><p>本次仅基于 CRM 安全上下文分析。</p></article></section>;
}

function PrioritySummary({ view }: { view: DecisionView }) {
  return <section className="priority-summary"><h3>管理层当前范围</h3><p>优先处理 {view.scopeSummary.criticalCount} 条严重商机，并对 {view.scopeSummary.reviewRequiredCount} 条待复核记录完成证据检查。</p></section>;
}

function MeetingSignals({ view }: { view: DecisionView }) {
  const context = view.safeContext;
  return <section className="decision-signal-table"><h3>会议派生信号</h3><dl><dt>会议窗口</dt><dd>{context.meetingWindow}</dd><dt>关键人覆盖</dt><dd>{context.stakeholderCoverage}</dd><dt>待确认问题</dt><dd>{context.openQuestionCount}</dd><dt>决策准备度</dt><dd>{context.decisionReadiness}</dd></dl><p>未读取或展示 Timeline、邮件、电话及会议原文。</p></section>;
}

function AccountSignals({ view }: { view: DecisionView }) {
  const account = view.safeContext.accountAggregate;
  return <section className="decision-signal-table"><h3>客户级安全增长信号</h3><dl><dt>服务覆盖</dt><dd>{account.serviceCoverageBand}</dd><dt>服务空白</dt><dd>{account.whitespaceCategory}</dd><dt>商机趋势</dt><dd>{account.opportunityTrend}</dd><dt>关系成熟度</dt><dd>{account.relationshipMaturity}</dd></dl><p>增长结论仅为待验证假设，不包含客户身份和精确金额。</p></section>;
}

function LoadingState() { return <section className="decision-workspace-state" aria-live="polite"><div className="skeleton-line wide"/><div className="skeleton-line"/><div className="skeleton-panel"/><span>正在读取本地安全组合数据…</span></section>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <section className="decision-workspace-state error" role="alert"><strong>决策视图暂不可用</strong><span>{message}</span><button onClick={onRetry}>重试</button></section>; }
function Metric({ label, value, tone = "" }: { label: string; value: number; tone?: string }) { return <div className={tone}><span>{label}</span><strong>{value}</strong></div>; }
