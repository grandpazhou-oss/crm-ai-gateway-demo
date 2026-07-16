import type { ReactNode } from "react";
import type { DeepAnalysisOutput, DeepAnalysisResult } from "./types";

export function AnalysisResult({ result, onReset }: { result: DeepAnalysisResult; onReset: () => void }) {
  const output = result.output;
  if (!output) return <section className="deep-result-empty product-panel"><h3>{result.status}</h3><p>本次分析没有生成输出。</p><button onClick={onReset}>返回模板</button></section>;
  return <section className="deep-analysis-result"><header className="deep-result-header product-panel"><div><span>{output.templateCode} · v{output.templateVersion}</span><h2>{output.title}</h2><p>{output.executiveSummary}</p></div><div><strong>{output.confidence.level}</strong><span>置信等级</span><button onClick={onReset}>清除结果</button></div></header>
    <ResultSection title="1. 管理摘要"><p>{output.executiveSummary}</p></ResultSection>
    <ResultSection title="2. 当前 CRM 事实"><FactGrid items={output.crmFacts} /></ResultSection>
    <UnavailableSection title="3. 客户历史事实" message="客户历史尚未接入" />
    <UnavailableSection title="4. 外部行业与市场事实" message="外部行业与市场情报尚未启用" />
    <ResultSection title="5. AI 综合推断"><div className="deep-inference-list">{output.aiInferences.map((item) => <article key={item.statement}><span>{item.label}</span><p>{item.statement}</p></article>)}</div></ResultSection>
    <ResultSection title="6. 风险与机会"><div className="deep-risk-opportunity"><section><h3>风险</h3>{output.risks.length ? <ul>{output.risks.map((item) => <li key={item}>{item}</li>)}</ul> : <p>当前没有安全证据支持新增风险。</p>}</section><section><h3>机会</h3>{output.opportunities.length ? <ul>{output.opportunities.map((item) => <li key={item}>{item}</li>)}</ul> : <p>当前没有安全证据支持新增机会。</p>}</section></div></ResultSection>
    <ResultSection title="7. 情景分析"><div className="deep-scenario-grid">{output.scenarios.map((item) => <article key={item.name}><span>{item.direction}</span><h3>{item.name}</h3><p>{item.summary}</p></article>)}</div></ResultSection>
    <ResultSection title="8. 建议行动"><div className="deep-action-list">{output.recommendedActions.map((item) => <article key={item.action}><header><h3>{item.action}</h3><span>{item.status}</span></header><p>{item.reason}</p><dl><dt>建议角色</dt><dd>{item.suggestedRole}</dd><dt>建议窗口</dt><dd>{item.suggestedHorizon}</dd><dt>来源</dt><dd>{item.source}</dd></dl></article>)}</div></ResultSection>
    <ResultSection title="9. 局限与缺失数据"><ul>{output.limitations.map((item) => <li key={item}>{item}</li>)}</ul></ResultSection>
    <ResultSection title="10. 来源与安全状态"><div className="deep-source-grid"><section><h3>实际来源</h3>{output.sources.map((item) => <p key={item.ref}><strong>{item.type}</strong><code>{item.ref}</code></p>)}</section><section><h3>未接入来源</h3><p>CRM 历史：未接入</p><p>外部公开信息：未启用</p><p>公司内部知识：未接入</p></section><section><h3>模型与安全</h3><p>Provider：{output.provider.used}</p><p>外部模型调用：否</p><p>精确金额发送：否</p><p>Timeline 原文发送：否</p></section></div></ResultSection>
  </section>;
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) { return <section className="deep-result-section product-panel"><h2>{title}</h2>{children}</section>; }
function UnavailableSection({ title, message }: { title: string; message: string }) { return <ResultSection title={title}><div className="deep-unavailable"><strong>{message}</strong><p>本阶段不会为了填充页面生成模拟事实。</p></div></ResultSection>; }
function FactGrid({ items }: { items: DeepAnalysisOutput["crmFacts"] }) { return <div className="deep-fact-grid">{items.map((item) => <article key={item.source}><span>当前 CRM</span><strong>{item.label}</strong><p>{item.value}</p><code>{item.source}</code></article>)}</div>; }
