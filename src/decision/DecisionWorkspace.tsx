import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getDecisionOpportunity } from "../api";
import type { UnifiedAiOutput } from "./contract";
import { DecisionPageHeader, EvidenceList, FactList, InferencePanel, TechnicalDetails } from "./DecisionUi";
import { booleanLabel, decisionText, maskOpportunityToken, priorityLabel, scenarioTitle, stageLabel } from "./display";
import { portfolioScope, priorityDistribution, productActions, sortedRiskOpportunities } from "./productModel";
import { RiskDetailPool, riskDetailKey } from "./riskDetailPool";
import type { AmountDisplayMode, DecisionOpportunityDetail, DecisionView } from "./types";

export type DecisionPage = "cockpit" | "risk" | "detail" | "actionBoard" | "meeting" | "portfolio";
type ProductPage = DecisionPage | "gateway";
type DetailState = { detail?: DecisionOpportunityDetail; error?: string };

const PAGE_COPY: Record<DecisionPage, { title: string; description: string }> = {
  cockpit: { title: "AI 驾驶舱", description: "管理当前范围内的重大风险、行动优先级和数据状态。" },
  risk: { title: "风险与优先级", description: "依据脱敏证据安排复核顺序，不替代人工业务判断。" },
  detail: { title: "商机 360", description: "聚合单一脱敏商机的 CRM 事实、AI 判断、证据和行动。" },
  actionBoard: { title: "行动看板", description: "只读整理已有建议；不会创建任务、分配人员或写回 CRM。" },
  meeting: { title: "会议副驾", description: "仅使用安全派生信号准备会议，不读取 Timeline 原文。" },
  portfolio: { title: "组合洞察", description: "明确统计口径后查看风险分布与客户级安全聚合。" },
};

export function DecisionWorkspace({ amountDisplayMode, page, view, loading, error, onRetry, onOpportunityChange, onNavigate = () => undefined, railExpanded = false, onToggleRail = () => undefined, scenarioId = "" }: {
  amountDisplayMode: AmountDisplayMode;
  page: DecisionPage;
  view: DecisionView | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onOpportunityChange: (token: string) => void;
  onNavigate?: (page: ProductPage) => void;
  railExpanded?: boolean;
  onToggleRail?: () => void;
  scenarioId?: string;
}) {
  const pool = useRef(new RiskDetailPool<DecisionOpportunityDetail>(3));
  const [detailVersion, setDetailVersion] = useState(0);
  const errors = useRef(new Map<string, string>());
  const scopeIdentity = view ? `${view.mode}|${view.scenario?.id || scenarioId}|${view.selectedOpportunity}` : "empty";

  useEffect(() => {
    pool.current.cancelStale();
    return () => pool.current.cancelStale();
  }, [scopeIdentity]);

  const requestDetail = useCallback((token: string, force = false) => {
    if (!view) return;
    const activeScenario = view.mode === "scenario" ? view.scenario?.id || scenarioId : "";
    const key = riskDetailKey(view.mode, activeScenario, token);
    if (!force && (pool.current.get(key) || errors.current.has(key))) return;
    if (force) errors.current.delete(key);
    pool.current.load(key, (signal) => getDecisionOpportunity(token, view.mode, activeScenario, signal).then((result) => result.data))
      .then(() => setDetailVersion((current) => current + 1))
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        errors.current.set(key, loadError instanceof Error ? loadError.message : "详情读取失败");
        setDetailVersion((current) => current + 1);
      });
  }, [scenarioId, view]);

  const detailFor = useCallback((token: string): DetailState => {
    if (!view) return {};
    if (token === view.selectedOpportunity) return { detail: { mode: view.mode, scenario: view.scenario, safeContext: view.safeContext, accountAggregate: view.safeContext.accountAggregate, opportunity360: view.pack.opportunity360 } };
    const activeScenario = view.mode === "scenario" ? view.scenario?.id || scenarioId : "";
    const key = riskDetailKey(view.mode, activeScenario, token);
    return { detail: pool.current.get(key), error: errors.current.get(key) };
  }, [detailVersion, scenarioId, view]);

  if (loading) return <LoadingState />;
  if (error || !view) return <ErrorState message={error || "未返回本地决策视图。"} onRetry={onRetry} />;
  const copy = PAGE_COPY[page];
  const rail = <DecisionContextRail amountDisplayMode={amountDisplayMode} output={view.pack[pageOutput(page)]} view={view} expanded={railExpanded} onToggle={onToggleRail} />;

  return <section className={`decision-workspace page-${page}`} data-page={page}>
    <DecisionPageHeader title={copy.title} description={copy.description} />
    {page === "cockpit" ? <CockpitPage view={view} detailFor={detailFor} requestDetail={requestDetail} onOpportunityChange={onOpportunityChange} onNavigate={onNavigate} rail={rail} /> : null}
    {page === "risk" ? <RiskPage view={view} detailFor={detailFor} requestDetail={requestDetail} onOpportunityChange={onOpportunityChange} rail={rail} /> : null}
    {page === "detail" ? <Opportunity360Page view={view} rail={rail} /> : null}
    {page === "actionBoard" ? <ActionBoardPage view={view} rail={rail} /> : null}
    {page === "meeting" ? <MeetingPage view={view} rail={rail} /> : null}
    {page === "portfolio" ? <PortfolioPage view={view} rail={rail} /> : null}
  </section>;
}

function CockpitPage({ view, detailFor, requestDetail, onOpportunityChange, onNavigate, rail }: PageWithQueueProps & { onNavigate: (page: ProductPage) => void }) {
  const actions = productActions(view).slice(0, 3);
  const topRisks = sortedRiskOpportunities(view).slice(0, 5);
  return <>
    <ScopeMetrics view={view} />
    <div className="cockpit-layout product-three-column">
      <section className="top-risk-panel product-panel"><header><div><h3>Top 风险商机</h3><p>按当前安全优先级排序</p></div><button onClick={() => onNavigate("risk")}>查看完整队列</button></header>{topRisks.map((item, index) => <RiskRow key={item.opportunityToken} item={item} rank={index + 1} selected={item.opportunityToken === view.selectedOpportunity} state={detailFor(item.opportunityToken)} onVisible={() => requestDetail(item.opportunityToken)} onSelect={() => onOpportunityChange(item.opportunityToken)} />)}</section>
      <div className="cockpit-main">
        <section className="management-summary product-panel"><span className={`decision-priority priority-${view.pack.cockpit.priority.toLowerCase()}`}>{priorityLabel(view.pack.cockpit.priority)}</span><h3>当前管理摘要</h3><p>{decisionText(view.pack.cockpit.inference)}</p><div className="selected-summary"><strong>{maskOpportunityToken(view.selectedOpportunity)}</strong><span>{stageLabel(view.safeContext.stage)} · {decisionText(view.safeContext.stagnationBand)}</span></div></section>
        <section className="top-actions product-panel"><header><div><h3>Top 建议行动</h3><p>仅展示 Provider 已提供的建议</p></div><button onClick={() => onNavigate("actionBoard")}>进入行动看板</button></header>{actions.map((action) => <article key={action.id}><strong>{decisionText(action.title)}</strong><p>{decisionText(action.reason)}</p><small>{action.owner} · {decisionText(action.due)}</small></article>)}</section>
        <section className="scenario-status product-panel"><h3>场景与数据状态</h3><dl><dt>当前模式</dt><dd>{view.mode === "portfolio" ? "组合视图" : "场景聚焦"}</dd><dt>当前场景</dt><dd>{view.scenario ? scenarioTitle(view.scenario.id, view.scenario.title) : "全部本地组合"}</dd><dt>数据范围</dt><dd>{view.scopeSummary.scopeCount} 条脱敏商机</dd><dt>情报状态</dt><dd>仅基于 CRM Safe Context</dd></dl></section>
      </div>{rail}
    </div>
  </>;
}

function RiskPage({ view, detailFor, requestDetail, onOpportunityChange, rail }: PageWithQueueProps) {
  return <div className="risk-product-layout product-three-column"><RiskQueue view={view} detailFor={detailFor} requestDetail={requestDetail} onOpportunityChange={onOpportunityChange} /><section className="risk-detail product-panel"><header><span className={`decision-priority priority-${view.pack.risk.priority.toLowerCase()}`}>{priorityLabel(view.pack.risk.priority)}</span><div><h3>{maskOpportunityToken(view.selectedOpportunity)}</h3><p>建议复核顺序：当前队列优先级内按 Token 稳定排序</p></div></header><div className="risk-decision-grid"><FactList output={view.pack.risk} /><InferencePanel output={view.pack.risk} /><EvidenceList output={view.pack.risk} /></div><section className="review-order"><h3>建议复核步骤</h3>{view.pack.risk.recommendedAction.map((item) => <article key={item.title}><strong>{decisionText(item.title)}</strong><p>{decisionText(item.reason)}</p></article>)}</section><TechnicalDetails output={view.pack.risk} /></section>{rail}</div>;
}

function Opportunity360Page({ view, rail }: { view: DecisionView; rail: ReactNode }) {
  const output = view.pack.opportunity360;
  return <div className="detail-product-layout product-two-column"><main className="opportunity-360-main"><section className="opportunity-overview product-panel"><div><span>脱敏商机</span><strong>{maskOpportunityToken(view.selectedOpportunity)}</strong></div><div><span>当前阶段</span><strong>{stageLabel(view.safeContext.stage)}</strong></div><div><span>优先级</span><strong>{priorityLabel(output.priority)}</strong></div><div><span>决策准备度</span><strong>{decisionText(view.safeContext.decisionReadiness)}</strong></div></section><div className="opportunity-decision-grid"><FactList output={output} /><InferencePanel output={output} /><EvidenceList output={output} /><section className="product-action-summary"><h3>建议行动</h3>{output.recommendedAction.map((item) => <article key={item.title}><strong>{decisionText(item.title)}</strong><p>{decisionText(item.reason)}</p></article>)}</section></div><section className="context-availability"><article><h3>客户历史</h3><strong>客户历史尚未接入</strong><p>当前仅基于 CRM Safe Context 分析。</p></article><article><h3>外部事实</h3><strong>外部行业与市场情报尚未启用</strong><p>当前没有外部来源可供引用。</p></article></section><TechnicalDetails output={output} /></main>{rail}</div>;
}

function ActionBoardPage({ view, rail }: { view: DecisionView; rail: ReactNode }) {
  const actions = productActions(view);
  const [open, setOpen] = useState<{ id: string; mode: "detail" | "evidence" | "draft" } | null>(null);
  return <div className="action-product-layout product-two-column"><main className="action-board-list"><header className="product-section-heading"><div><h3>建议行动列表</h3><p>{maskOpportunityToken(view.selectedOpportunity)} · 只读草案</p></div><span>{actions.length} 项</span></header>{actions.map((action) => <article className="action-row" key={action.id}><div className="action-row-main"><span className={`decision-priority priority-${action.priority.toLowerCase()}`}>{priorityLabel(action.priority)}</span><div><h3>{decisionText(action.title)}</h3><p>{decisionText(action.reason)}</p></div></div><dl><dt>建议角色</dt><dd>{decisionText(action.owner)}</dd><dt>建议期限</dt><dd>{decisionText(action.due)}</dd><dt>状态</dt><dd>{decisionText(action.status)}</dd><dt>证据</dt><dd>{action.evidenceCount} 项</dd></dl><div className="action-row-buttons"><button onClick={() => setOpen({ id: action.id, mode: "detail" })}>查看行动详情</button><button onClick={() => setOpen({ id: action.id, mode: "evidence" })}>查看支持证据</button><button onClick={() => setOpen({ id: action.id, mode: "draft" })}>生成行动草案</button></div>{open?.id === action.id ? <section className="local-action-preview"><strong>{open.mode === "detail" ? "行动详情" : open.mode === "evidence" ? "支持证据" : "本地草案预览"}</strong><p>{open.mode === "evidence" ? view.pack.action.evidence.map((item) => `${decisionText(item.label)}：${decisionText(item.value)}`).join("；") || "当前没有更多证据。" : `${decisionText(action.title)}：${decisionText(action.reason)}`}</p><small>仅在当前页面组织已有内容，未调用模型或写回 CRM。</small></section> : null}</article>)}{!actions.length ? <EmptyPanel title="当前没有建议行动" body="当前 Decision Pack 未提供可展示的行动。" /> : null}<TechnicalDetails output={view.pack.action} /></main>{rail}</div>;
}

function MeetingPage({ view, rail }: { view: DecisionView; rail: ReactNode }) {
  const output = view.pack.meeting;
  return <div className="meeting-product-layout product-two-column"><main className="meeting-main"><section className="meeting-signal-grid"><Signal label="会议窗口" value={view.safeContext.meetingWindow} /><Signal label="关键角色覆盖" value={view.safeContext.stakeholderCoverage} /><Signal label="待确认问题" value={`${view.safeContext.openQuestionCount} 项`} /><Signal label="决策准备度" value={view.safeContext.decisionReadiness} /></section><div className="meeting-agenda-grid"><section className="product-panel"><h3>会议目标</h3><p>{output.recommendedAction[0] ? decisionText(output.recommendedAction[0].title) : "当前没有可用目标。"}</p></section><section className="product-panel"><h3>建议提问</h3><p>{view.safeContext.openQuestionCount ? `围绕 ${view.safeContext.openQuestionCount} 项待确认问题逐项核实决策条件。` : "当前没有安全信号支持新增问题。"}</p></section><section className="product-panel"><h3>必须确认事项</h3>{output.evidence.map((item) => <p key={item.source}>{decisionText(item.label)}：{decisionText(item.value)}</p>)}</section><section className="product-panel"><h3>潜在异议</h3><p>当前 Safe Context 未提供可验证的异议内容。</p></section><section className="product-panel meeting-followup"><h3>会后行动建议</h3><p>{output.recommendedAction[0] ? decisionText(output.recommendedAction[0].reason) : "待人工确定。"}</p></section></div><p className="timeline-disclaimer">当前未读取或展示 Timeline 原文，仅使用安全派生信号。</p><TechnicalDetails output={output} /></main>{rail}</div>;
}

function PortfolioPage({ view, rail }: { view: DecisionView; rail: ReactNode }) {
  const scope = portfolioScope(view);
  const distribution = priorityDistribution(view);
  const account = view.safeContext.accountAggregate;
  const max = Math.max(...distribution.map((item) => item.count), 1);
  return <div className="portfolio-product-layout product-two-column"><main className="portfolio-main"><section className="portfolio-scope product-panel"><h3>统计口径</h3><dl><dt>当前模式</dt><dd>{scope.modeLabel}</dd><dt>当前场景</dt><dd>{scope.scenarioLabel}</dd><dt>当前范围</dt><dd>{scope.count} 条</dd><dt>Scope</dt><dd>{scope.scopeLabel}</dd><dt>完整范围</dt><dd>{scope.completeLabel}</dd></dl></section><section className="portfolio-distribution product-panel"><h3>风险等级分布</h3>{distribution.map((item) => <div key={item.priority}><span>{priorityLabel(item.priority)}</span><div><i style={{ width: `${(item.count / max) * 100}%` }} /></div><strong>{item.count}</strong></div>)}</section><section className="portfolio-kpis"><Metric label="当前范围" value={view.scopeSummary.scopeCount} /><Metric label="待复核" value={view.scopeSummary.reviewRequiredCount} /><Metric label="升级处理" value={view.scopeSummary.criticalCount + view.scopeSummary.highCount} /></section><section className="account-aggregate product-panel"><header><div><h3>当前选中客户级安全聚合</h3><p>不代表完整 Portfolio 的客户分布</p></div></header><dl><dt>服务覆盖</dt><dd>{decisionText(account.serviceCoverageBand)}</dd><dt>服务空白</dt><dd>{decisionText(account.whitespaceCategory)}</dd><dt>商机趋势</dt><dd>{decisionText(account.opportunityTrend)}</dd><dt>关系成熟度</dt><dd>{decisionText(account.relationshipMaturity)}</dd></dl></section><section className="portfolio-empty-grid"><EmptyPanel title="部门比较" body="部门比较将在 CRM 部门字段接入后启用。" /><EmptyPanel title="行业分布" body="行业分布将在客户行业字段接入后启用。" /><EmptyPanel title="客户历史趋势" body="客户历史趋势将在历史聚合 API 接入后启用。" /></section><TechnicalDetails output={view.pack.portfolio} /></main>{rail}</div>;
}

type PageWithQueueProps = { view: DecisionView; detailFor: (token: string) => DetailState; requestDetail: (token: string, force?: boolean) => void; onOpportunityChange: (token: string) => void; rail: ReactNode };

function RiskQueue({ view, detailFor, requestDetail, onOpportunityChange }: Omit<PageWithQueueProps, "rail">) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = sortedRiskOpportunities(view);
  return <aside className={`risk-queue product-panel${mobileOpen ? " mobile-open" : ""}`} aria-label="商机与风险队列"><header><div><h3>风险复核队列</h3><p>{items.length} 条脱敏商机</p></div><button className="mobile-queue-toggle" onClick={() => setMobileOpen((current) => !current)}>{mobileOpen ? "收起队列" : "打开队列"}</button></header><div className="risk-queue-list">{items.map((item, index) => <RiskRow key={item.opportunityToken} item={item} rank={index + 1} selected={item.opportunityToken === view.selectedOpportunity} state={detailFor(item.opportunityToken)} onVisible={() => requestDetail(item.opportunityToken)} onSelect={() => onOpportunityChange(item.opportunityToken)} onRetry={() => requestDetail(item.opportunityToken, true)} />)}</div><footer>客户身份与 CRM ID 已脱敏</footer></aside>;
}

function RiskRow({ item, rank, selected, state, onVisible, onSelect, onRetry }: { item: DecisionView["opportunities"][number]; rank: number; selected: boolean; state: DetailState; onVisible: () => void; onSelect: () => void; onRetry?: () => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) { onVisible(); return; }
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) onVisible(); }, { rootMargin: "80px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible]);
  useEffect(() => { if (selected) rowRef.current?.scrollIntoView({ block: "nearest" }); }, [selected]);
  const detail = state.detail;
  return <div ref={rowRef} className={`risk-row${selected ? " selected" : ""}`}><button onClick={onSelect} aria-current={selected ? "true" : undefined}><span className="risk-rank">#{rank}</span><span className={`risk-level priority-${item.priority.toLowerCase()}`}>{priorityLabel(item.priority)}</span><strong>{maskOpportunityToken(item.opportunityToken)}</strong><small>{stageLabel(item.stage)} · {detail ? decisionText(detail.safeContext.stagnationBand) : "正在读取推进状态"}</small><p>{detail ? decisionText(detail.opportunity360.inference) : state.error ? "安全详情暂不可用" : "正在读取安全原因…"}</p><em>{detail ? `${detail.opportunity360.evidence.length} 项证据` : "证据读取中"}</em></button>{state.error && onRetry ? <button className="risk-retry" onClick={onRetry}>重试详情</button> : null}</div>;
}

function DecisionContextRail({ amountDisplayMode, output, view, expanded, onToggle }: { amountDisplayMode: AmountDisplayMode; output: UnifiedAiOutput; view: DecisionView; expanded: boolean; onToggle: () => void }) {
  return <aside className={`decision-context-rail${expanded ? " expanded" : " compact"}`} aria-label="置信度和安全状态"><header><h3>判断与安全</h3><button aria-expanded={expanded} onClick={onToggle}>{expanded ? "收起" : "展开"}</button></header><section className={`rail-confidence confidence-${output.confidence.level.toLowerCase()}`}><span>置信度</span><strong>{decisionText(output.confidence.level)}</strong>{expanded ? <p>{decisionText(output.confidence.reason)}</p> : null}</section><dl><dt>当前模型</dt><dd>{output.providerUsed}</dd><dt>Safe Context</dt><dd>{booleanLabel(output.safeContextUsed)}</dd><dt>外部模型调用</dt><dd>{booleanLabel(output.externalModelCalled)}</dd><dt>金额显示</dt><dd>{amountDisplayMode === "range" ? "金额区间" : "精确金额（仅界面）"}</dd>{expanded ? <><dt>Fallback</dt><dd>{output.fallbackReason || "无"}</dd><dt>原始数据外发</dt><dd>{booleanLabel(output.rawDataSent)}</dd><dt>精确金额发送模型</dt><dd>否</dd><dt>当前权限</dt><dd>演示全权限</dd><dt>当前部门范围</dt><dd>字段待接入</dd><dt>当前商机 Token</dt><dd>{maskOpportunityToken(view.selectedOpportunity)}</dd><dt>情报状态</dt><dd>仅基于 CRM 分析</dd></> : null}</dl></aside>;
}

function ScopeMetrics({ view }: { view: DecisionView }) { return <section className="decision-scope-metrics" aria-label="当前分析范围"><Metric label="当前范围" value={view.scopeSummary.scopeCount} /><Metric label="严重风险" value={view.scopeSummary.criticalCount} tone="critical" /><Metric label="高风险" value={view.scopeSummary.highCount} tone="high" /><Metric label="待复核" value={view.scopeSummary.reviewRequiredCount} /></section>; }
function Signal({ label, value }: { label: string; value: string }) { return <article><span>{label}</span><strong>{decisionText(value)}</strong></article>; }
function EmptyPanel({ title, body }: { title: string; body: string }) { return <article className="formal-empty-state"><div className="empty-skeleton" /><h3>{title}</h3><p>{body}</p></article>; }
function LoadingState() { return <section className="decision-workspace-state" aria-live="polite"><div className="skeleton-line wide"/><div className="skeleton-line"/><div className="skeleton-panel"/><span>正在读取本地安全组合数据…</span></section>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <section className="decision-workspace-state error" role="alert"><strong>决策视图暂不可用</strong><span>{message}</span><button onClick={onRetry}>重试</button></section>; }
function Metric({ label, value, tone = "" }: { label: string; value: number; tone?: string }) { return <article className={tone}><span>{label}</span><strong>{value}</strong></article>; }
function pageOutput(page: DecisionPage): keyof DecisionView["pack"] { return page === "detail" ? "opportunity360" : page === "actionBoard" ? "action" : page; }
