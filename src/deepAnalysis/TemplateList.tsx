import { providerPolicyLabel, templateStatusClass } from "./display";
import type { DeepAnalysisTemplate } from "./types";

export function TemplateList({ templates, selectedCode, onSelect }: { templates: DeepAnalysisTemplate[]; selectedCode: string; onSelect: (template: DeepAnalysisTemplate) => void }) {
  return <aside className="deep-template-list product-panel" aria-label="深度分析模板"><header><h3>分析模板</h3><span>9 项</span></header><div>{templates.map((template) => <article className={`${templateStatusClass(template.status)}${selectedCode === template.code ? " selected" : ""}`} key={template.code}><button disabled={!template.runtimeEnabled} onClick={() => onSelect(template)}><span>{template.code}</span><strong>{template.title}</strong><small>{template.targetRole}</small><em>{template.status} · {template.estimatedDuration}</em></button><p>{template.runtimeEnabled ? providerPolicyLabel(template.providerPolicy) : template.blockedReason}</p></article>)}</div></aside>;
}
