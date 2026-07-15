import { DecisionPageHeader, UnifiedDecisionCard } from "./DecisionUi";
import type { DecisionView } from "./types";

export type DecisionPage = "cockpit" | "risk" | "detail" | "actionBoard" | "meeting" | "portfolio";

const PAGE_COPY: Record<DecisionPage, { title: string; description: string; output: keyof DecisionView["pack"] }> = {
  cockpit: { title: "AI Cockpit", description: "Portfolio facts, priority signals and decision actions from sanitized local data.", output: "cockpit" },
  risk: { title: "Risk & Priority", description: "Prioritized findings with evidence and explicit confidence.", output: "risk" },
  detail: { title: "Opportunity 360", description: "One safe opportunity context, separated into fact, inference and action.", output: "opportunity360" },
  actionBoard: { title: "Action Board", description: "Read-only recommended actions. Nothing is written back to CRM.", output: "action" },
  meeting: { title: "Meeting Copilot", description: "Preparation from derived readiness signals, never Timeline content.", output: "meeting" },
  portfolio: { title: "Portfolio Intelligence", description: "Growth and data-quality intelligence across the selected scope.", output: "portfolio" },
};

export function DecisionWorkspace({ page, view, loading, error, onRetry }: { page: DecisionPage; view: DecisionView | null; loading: boolean; error: string; onRetry: () => void }) {
  const copy = PAGE_COPY[page];
  if (loading) return <section className="decision-workspace-state" aria-live="polite"><strong>Loading decision portfolio...</strong><span>Reading committed local fixture and Safe Context only.</span></section>;
  if (error || !view) return <section className="decision-workspace-state error" role="alert"><strong>Decision view unavailable</strong><span>{error || "No local decision view was returned."}</span><button onClick={onRetry}>Retry</button></section>;
  const output = view.pack[copy.output];
  return (
    <section className="decision-workspace" data-page={page}>
      <DecisionPageHeader title={copy.title} description={copy.description} />
      <div className="decision-scope-metrics" aria-label="Selected decision scope summary">
        <Metric label="Scope" value={view.scopeSummary.scopeCount} />
        <Metric label="Critical" value={view.scopeSummary.criticalCount} />
        <Metric label="High" value={view.scopeSummary.highCount} />
        <Metric label="Needs review" value={view.scopeSummary.reviewRequiredCount} />
      </div>
      <UnifiedDecisionCard output={output} />
      {page === "detail" ? <SafeContextPanel view={view} /> : null}
      {page === "meeting" ? <MeetingSignals view={view} /> : null}
      {page === "portfolio" ? <AccountSignals view={view} /> : null}
    </section>
  );
}

function SafeContextPanel({ view }: { view: DecisionView }) {
  return <section className="safe-context-panel"><h3>Safe CRM facts</h3><div>{view.safeContextKeys.map((key) => <span key={key}>{key}</span>)}</div><p>Raw identity, exact monthly values, Timeline content and route master values are excluded.</p></section>;
}

function MeetingSignals({ view }: { view: DecisionView }) {
  const context = view.safeContext;
  return <section className="decision-signal-table"><h3>Derived meeting signals</h3><dl><dt>Window</dt><dd>{context.meetingWindow}</dd><dt>Stakeholder coverage</dt><dd>{context.stakeholderCoverage}</dd><dt>Open questions</dt><dd>{context.openQuestionCount}</dd><dt>Decision readiness</dt><dd>{context.decisionReadiness}</dd></dl><p>No Timeline text is read or displayed.</p></section>;
}

function AccountSignals({ view }: { view: DecisionView }) {
  const account = view.safeContext.accountAggregate;
  return <section className="decision-signal-table"><h3>Account-safe growth signals</h3><dl><dt>Service coverage</dt><dd>{account.serviceCoverageBand}</dd><dt>Whitespace</dt><dd>{account.whitespaceCategory}</dd><dt>Opportunity trend</dt><dd>{account.opportunityTrend}</dd><dt>Relationship maturity</dt><dd>{account.relationshipMaturity}</dd></dl><p>Growth findings are hypotheses and exclude account identity and exact value.</p></section>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
