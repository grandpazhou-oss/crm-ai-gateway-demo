import type { DeepAnalysisPreview, DeepAnalysisTemplate } from "./types";

export function AnalysisConfirmation({ preview, template, onConfirm, onCancel, running }: { preview: DeepAnalysisPreview; template: DeepAnalysisTemplate; onConfirm: () => void; onCancel: () => void; running: boolean }) {
  return <section className="deep-confirmation product-panel"><header><div><span>{template.code}</span><h3>分析范围确认</h3><p>{template.title}</p></div><strong>等待确认</strong></header><div className="deep-confirmation-grid"><ConfirmationList title="本次会使用" items={preview.availableData} /><ConfirmationList title="本次不会发送" items={preview.neverSent} tone="safe" /><ConfirmationList title="当前限制" items={preview.currentLimitations} tone="limited" /></div><footer><p>本次使用 deterministic Demo Provider，不调用外部模型。</p><div><button className="secondary" disabled={running} onClick={onCancel}>返回模板</button><button disabled={running} onClick={onConfirm}>开始 Demo 深度分析</button></div></footer></section>;
}

function ConfirmationList({ title, items, tone = "" }: { title: string; items: string[]; tone?: string }) { return <section className={tone}><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
