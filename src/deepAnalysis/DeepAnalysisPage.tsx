import { useEffect, useState } from "react";
import { cancelDeepAnalysis, getDeepAnalysisTemplates, previewDeepAnalysis, resetDeepAnalysis, runDeepAnalysis } from "../api";
import type { AmountDisplayMode, DecisionView } from "../decision/types";
import { AnalysisConfirmation } from "./AnalysisConfirmation";
import { AnalysisProgress } from "./AnalysisProgress";
import { AnalysisResult } from "./AnalysisResult";
import { DeepAnalysisSafetyRail } from "./DeepAnalysisSafetyRail";
import { TemplateList } from "./TemplateList";
import type { DeepAnalysisCatalog, DeepAnalysisPhase, DeepAnalysisPreview, DeepAnalysisResult, DeepAnalysisTemplate } from "./types";

type Session = { selectedCode: string; preview: DeepAnalysisPreview | null; result: DeepAnalysisResult | null; phase: DeepAnalysisPhase };
let session: Session = { selectedCode: "", preview: null, result: null, phase: "未开始" };
const ROLE = "demo-full-access";

export function DeepAnalysisPage({ amountDisplayMode, scenarioId, view }: { amountDisplayMode: AmountDisplayMode; scenarioId: string; view: DecisionView | null }) {
  const [catalog, setCatalog] = useState<DeepAnalysisCatalog | null>(null);
  const [selectedCode, setSelectedCode] = useState(session.selectedCode);
  const [preview, setPreview] = useState<DeepAnalysisPreview | null>(session.preview);
  const [result, setResult] = useState<DeepAnalysisResult | null>(session.result);
  const [phase, setPhase] = useState<DeepAnalysisPhase>(session.phase);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");

  useEffect(() => { getDeepAnalysisTemplates().then((response) => setCatalog(response.data)).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "模板读取失败")); }, []);
  useEffect(() => { session = { selectedCode, preview, result, phase }; }, [phase, preview, result, selectedCode]);

  async function selectTemplate(template: DeepAnalysisTemplate) {
    if (!view || !template.runtimeEnabled) return;
    setError(""); setSelectedCode(template.code); setResult(null); setPhase("构建 Safe Context");
    try {
      const response = await previewDeepAnalysis({ templateCode: template.code, mode: view.mode, scenarioId: view.mode === "scenario" ? scenarioId : "", opportunityToken: view.selectedOpportunity, role: ROLE });
      setPreview(response.data); setPhase("等待确认");
    } catch (previewError) { setError(previewError instanceof Error ? previewError.message : "分析范围构建失败"); setPhase("已阻断"); }
  }

  async function confirmRun() {
    if (!view || !preview) return;
    const nextRequestId = crypto.randomUUID();
    setRequestId(nextRequestId); setError(""); setPhase("Demo 分析中");
    try {
      const response = await runDeepAnalysis({ requestId: nextRequestId, templateCode: preview.templateCode, mode: view.mode, scenarioId: view.mode === "scenario" ? scenarioId : "", opportunityToken: view.selectedOpportunity, role: ROLE, confirmed: true });
      setResult(response.data); setPhase(response.data.status === "已取消" ? "已取消" : "完成");
    } catch (runError) { setError(runError instanceof Error ? runError.message : "Demo 深度分析失败"); setPhase("失败"); }
  }

  async function cancelRun() { if (requestId) await cancelDeepAnalysis(requestId).catch(() => undefined); setPhase("已取消"); }
  async function reset() { await resetDeepAnalysis().catch(() => undefined); setSelectedCode(""); setPreview(null); setResult(null); setPhase("未开始"); setError(""); setRequestId(""); }
  const selected = catalog?.templates.find((item) => item.code === selectedCode) || null;

  return <section className="deep-analysis-page decision-workspace" data-page="deep-analysis"><header className="decision-page-header"><div><span>DEEP ANALYSIS</span><h2>深度分析</h2><p>基于现有 CRM Safe Context 的受控、可解释、只读分析。</p></div><div><strong>演示全权限 · 仅限 synthetic 数据</strong><button onClick={reset}>Reset</button></div></header>
    {error ? <section className="deep-error" role="alert"><strong>深度分析暂不可用</strong><span>{error}</span></section> : null}
    <div className="deep-analysis-shell"><TemplateList templates={catalog?.templates || []} selectedCode={selectedCode} onSelect={selectTemplate} /><main className="deep-analysis-main">
      {!preview && !result ? <ScopeOverview amountDisplayMode={amountDisplayMode} view={view} /> : null}
      {preview && selected && phase === "等待确认" ? <AnalysisConfirmation preview={preview} template={selected} onConfirm={confirmRun} onCancel={reset} running={false} /> : null}
      {["构建 Safe Context", "安全检查", "Demo 分析中", "输出结构校验", "安全校验"].includes(phase) ? <AnalysisProgress phase={phase} onCancel={cancelRun} /> : null}
      {result ? <AnalysisResult result={result} onReset={reset} /> : null}
      {phase === "已取消" && !result ? <section className="deep-result-empty product-panel"><h3>分析已取消</h3><p>未持久化结果，也未调用外部模型。</p><button onClick={reset}>返回模板</button></section> : null}
    </main><DeepAnalysisSafetyRail preview={preview} result={result} /></div>
  </section>;
}

function ScopeOverview({ amountDisplayMode, view }: { amountDisplayMode: AmountDisplayMode; view: DecisionView | null }) {
  return <section className="deep-scope-overview product-panel"><header><div><h3>分析范围与确认</h3><p>请选择左侧可执行模板；选择后仅生成安全范围预览，不会立即运行。</p></div><span>未开始</span></header><dl><dt>当前角色</dt><dd>演示全权限</dd><dt>当前部门范围</dt><dd>CRM 部门字段待接入</dd><dt>Opportunity Safe Token</dt><dd>{view?.selectedOpportunity || "未选择"}</dd><dt>Account Safe Token</dt><dd>{view?.safeContext.accountToken || "未选择"}</dd><dt>数据时间范围</dt><dd>当前安全快照</dd><dt>金额显示模式</dt><dd>{amountDisplayMode === "range" ? "金额区间" : "精确金额仅界面显示"}</dd><dt>Provider</dt><dd>deterministic Demo</dd><dt>外部模型调用</dt><dd>禁用</dd></dl><section><h3>当前依赖边界</h3><p>客户历史、外部行业情报和公司内部知识尚未接入。本模块不会生成这些来源的虚构内容。</p></section></section>;
}
