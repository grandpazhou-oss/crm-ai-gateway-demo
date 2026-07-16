import type { DeepAnalysisPhase } from "./types";

const STEPS: DeepAnalysisPhase[] = ["构建 Safe Context", "安全检查", "Demo 分析中", "输出结构校验", "安全校验", "完成"];
export function AnalysisProgress({ phase, onCancel }: { phase: DeepAnalysisPhase; onCancel: () => void }) {
  return <section className="deep-analysis-progress product-panel" aria-live="polite"><header><div><h3>深度分析运行状态</h3><p>仅在当前进程内存中运行 deterministic Demo 分析。</p></div><strong>{phase}</strong></header><ol>{STEPS.map((step) => <li className={step === phase ? "active" : ""} key={step}>{step}</li>)}</ol><button onClick={onCancel}>取消分析</button></section>;
}
