import type { AiProviderStatus } from "../types";
import type { UnifiedAiOutput } from "./contract";

export function ProviderSafetyStrip({ status }: { status: AiProviderStatus | null }) {
  const provider = status?.provider || "demo";
  const fallback = status?.fallbackReason || "None";
  return (
    <section className="provider-safety-strip" aria-label="Provider and AI safety status">
      <StatusItem label="Provider used" value={provider} />
      <StatusItem label="Fallback" value={fallback} muted={!status?.fallbackReason} />
      <StatusItem label="Safe Context" value={status?.safeContextOnly === false ? "Blocked" : "Enabled"} />
      <StatusItem label="External model" value={status?.externalAiEnabled ? "Enabled" : "Not called"} />
      <StatusItem label="Raw CRM sent" value={status?.rawDataSent ? "Blocked" : "No"} danger={Boolean(status?.rawDataSent)} />
      <span className="demo-boundary">Synthetic / Test Only</span>
    </section>
  );
}

export function DecisionContextBar({
  opportunityId,
  opportunities,
  onOpportunityChange,
  status,
}: {
  opportunityId: string;
  opportunities: Array<{ id: string; customer_code: string }>;
  onOpportunityChange: (id: string) => void;
  status: string;
}) {
  return (
    <section className="decision-context-bar">
      <label>
        <span>Decision context</span>
        <select disabled={!opportunities.length} value={opportunityId} onChange={(event) => onOpportunityChange(event.target.value)}>
          {!opportunities.length ? <option value="">Local placeholder</option> : null}
          {opportunities.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.customer_code}</option>)}
        </select>
      </label>
      <p>{status}</p>
      <span>No automatic CRM write-back</span>
    </section>
  );
}

export function UnifiedDecisionCard({ output, compact = false }: { output: UnifiedAiOutput; compact?: boolean }) {
  return (
    <article className={`unified-decision-card${compact ? " compact" : ""}`}>
      <header>
        <div>
          <span className={`decision-priority priority-${output.priority.toLowerCase()}`}>{output.priority}</span>
          <h3>{output.title}</h3>
        </div>
        <Confidence value={output.confidence.level} reason={output.confidence.reason} />
      </header>

      <div className="decision-contract-grid">
        <section className="decision-facts">
          <h4>CRM Fact</h4>
          {output.fact.length ? output.fact.map((item) => (
            <dl key={`${item.label}-${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd><small>{item.source}</small></dl>
          )) : <p className="muted">No safe facts available.</p>}
        </section>
        <section className="decision-inference">
          <h4>AI Inference</h4>
          <p>{output.inference}</p>
          <small>Inference is not a CRM fact.</small>
        </section>
        <section className="decision-actions">
          <h4>Recommended Action</h4>
          {output.recommendedAction.length ? output.recommendedAction.map((item) => (
            <div key={`${item.title}-${item.owner}`}>
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
              <small>{item.owner} · {item.due} · {item.status}</small>
            </div>
          )) : <p className="muted">No action generated.</p>}
        </section>
      </div>

      <section className="decision-evidence">
        <h4>Evidence</h4>
        <div>{output.evidence.length ? output.evidence.map((item) => <span title={item.source} key={`${item.label}-${item.value}`}>{item.value}</span>) : <span>No evidence generated</span>}</div>
      </section>

      <footer>
        <span>Provider: {output.providerUsed}</span>
        <span>Fallback: {output.fallbackReason || "None"}</span>
        <span>Safe Context: {String(output.safeContextUsed)}</span>
        <span>External model called: {String(output.externalModelCalled)}</span>
        <span>Raw data sent: {String(output.rawDataSent)}</span>
      </footer>
    </article>
  );
}

export function DecisionPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="decision-page-header">
      <div><h2>{title}</h2><p>{description}</p></div>
      <span>Read-only decision support</span>
    </header>
  );
}

function Confidence({ value, reason }: { value: string; reason: string }) {
  return <div className={`decision-confidence confidence-${value.toLowerCase()}`} title={reason}><span>Confidence</span><strong>{value}</strong><small>{reason}</small></div>;
}

function StatusItem({ label, value, danger = false, muted = false }: { label: string; value: string; danger?: boolean; muted?: boolean }) {
  return <div className={`${danger ? "danger" : ""}${muted ? " muted" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}
