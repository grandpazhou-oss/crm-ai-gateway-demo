import type { DeepAnalysisPreview, DeepAnalysisResult } from "./types";

export function DeepAnalysisSafetyRail({ preview, result }: { preview: DeepAnalysisPreview | null; result: DeepAnalysisResult | null }) {
  return <aside className="deep-safety-rail product-panel" aria-label="深度分析安全与治理"><header><h3>安全与治理</h3><span>只读</span></header><dl><dt>Safe Context</dt><dd>已启用</dd><dt>客户身份</dt><dd>已脱敏</dd><dt>精确金额发送给模型</dt><dd>否</dd><dt>Timeline 原文发送给模型</dt><dd>否</dd><dt>原始 CRM 数据外发</dt><dd>否</dd><dt>CRM 自动写回</dt><dd>禁用</dd><dt>当前 Provider</dt><dd>demo</dd><dt>外部模型调用</dt><dd>否</dd><dt>Schema 校验</dt><dd>{result?.schemaStatus || "未执行"}</dd><dt>安全校验</dt><dd>{result?.safetyStatus || (preview ? "pass" : "未执行")}</dd><dt>引用校验</dt><dd>{result?.citationStatus || "未执行"}</dd></dl>{preview ? <section><span>Safe Context Hash</span><code>{preview.safeContextHash}</code></section> : null}</aside>;
}
