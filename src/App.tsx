import { useEffect, useState } from "react";
import { getAiProviderStatus, getAuditLog, getDecisionScenarios, getDecisionView } from "./api";
import { AuditSafetyPage } from "./decision/AuditSafetyPage";
import { DecisionContextBar, ProviderSafetyStrip } from "./decision/DecisionUi";
import { DecisionWorkspace, type DecisionPage } from "./decision/DecisionWorkspace";
import { scenarioTitle } from "./decision/display";
import type { AmountDisplayMode, DecisionMode, DecisionScenarioCatalog, DecisionView } from "./decision/types";
import type { AiProviderStatus, AuditEntry } from "./types";

type ProductPage = DecisionPage | "gateway";

const NAVIGATION: Array<{ page: ProductPage; label: string }> = [
  { page: "cockpit", label: "AI 驾驶舱" },
  { page: "risk", label: "风险与优先级" },
  { page: "detail", label: "商机 360" },
  { page: "actionBoard", label: "行动看板" },
  { page: "meeting", label: "会议副驾" },
  { page: "portfolio", label: "组合洞察" },
  { page: "gateway", label: "审计与安全" },
];

export default function App() {
  const [page, setPage] = useState<ProductPage>("cockpit");
  const [catalog, setCatalog] = useState<DecisionScenarioCatalog | null>(null);
  const [view, setView] = useState<DecisionView | null>(null);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [mode, setMode] = useState<DecisionMode>("portfolio");
  const [scenarioId, setScenarioId] = useState("multi-risk-priority");
  const [amountDisplayMode, setAmountDisplayMode] = useState<AmountDisplayMode>("range");
  const [railExpanded, setRailExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("正在读取本地安全组合数据…");

  async function loadView(nextMode = mode, nextScenario = scenarioId, opportunityToken = "") {
    setLoading(true);
    setError("");
    try {
      const result = await getDecisionView(nextMode, nextMode === "scenario" ? nextScenario : "", opportunityToken);
      setView(result.data);
      const label = result.data.scenario ? scenarioTitle(result.data.scenario.id, result.data.scenario.title) : "组合视图";
      setStatus(`${label}已就绪`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "决策视图读取失败");
      setStatus("决策视图暂不可用");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: DecisionMode) {
    setMode(nextMode);
    loadView(nextMode, scenarioId).catch(() => undefined);
  }

  function changeScenario(nextScenarioId: string) {
    setMode("scenario");
    setScenarioId(nextScenarioId);
    loadView("scenario", nextScenarioId).catch(() => undefined);
  }

  function changeOpportunity(token: string) {
    loadView(mode, scenarioId, token).catch(() => undefined);
  }

  function changeAmountMode(nextMode: AmountDisplayMode) {
    if (nextMode === "exact" && amountDisplayMode !== "exact") {
      if (!window.confirm("精确金额仅在当前受控界面展示，不会发送给外部模型。")) return;
    }
    setAmountDisplayMode(nextMode);
  }

  function resetPortfolio() {
    const token = catalog?.portfolioDefaultOpportunity || "DEMO-6C-OPP-075";
    setMode("portfolio");
    setScenarioId("multi-risk-priority");
    setAmountDisplayMode("range");
    loadView("portfolio", "", token).catch(() => undefined);
  }

  useEffect(() => {
    Promise.all([getDecisionScenarios(), getDecisionView("portfolio"), getAiProviderStatus(), getAuditLog()])
      .then(([catalogResult, viewResult, providerResult, auditResult]) => {
        setCatalog(catalogResult.data);
        setView(viewResult.data);
        setProviderStatus(providerResult.data);
        setAuditLog(auditResult.data);
        setStatus("AI 驾驶舱已就绪");
        setLoading(false);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "产品数据读取失败");
        setStatus("产品数据暂不可用");
        setLoading(false);
      });
  }, []);

  return (
    <main className="app product-app">
      <header className="topbar product-topbar">
        <div className="gateway-brand"><p>CRM AI 安全决策工作台</p><h1>CRM AI Gateway</h1></div>
        <nav className="tabs" aria-label="主导航">
          {NAVIGATION.map((item) => <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => setPage(item.page)}>{item.label}</button>)}
        </nav>
        <div className="topbar-utility"><span className="demo-access-badge">演示全权限</span></div>
      </header>

      <DecisionContextBar
        amountDisplayMode={amountDisplayMode}
        catalog={catalog}
        mode={mode}
        onAmountDisplayModeChange={changeAmountMode}
        onModeChange={changeMode}
        onOpportunityChange={changeOpportunity}
        onReset={resetPortfolio}
        onScenarioChange={changeScenario}
        scenarioId={scenarioId}
        view={view}
      />
      <ProviderSafetyStrip status={providerStatus} operationStatus={status} />

      {page === "gateway" ? (
        <AuditSafetyPage amountDisplayMode={amountDisplayMode} auditLog={auditLog} providerStatus={providerStatus} view={view} />
      ) : (
        <DecisionWorkspace
          amountDisplayMode={amountDisplayMode}
          error={error}
          loading={loading}
          onNavigate={setPage}
          onOpportunityChange={changeOpportunity}
          onRetry={() => loadView()}
          onToggleRail={() => setRailExpanded((current) => !current)}
          page={page}
          railExpanded={railExpanded}
          scenarioId={scenarioId}
          view={view}
        />
      )}
    </main>
  );
}
