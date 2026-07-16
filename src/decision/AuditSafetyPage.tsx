import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AiProviderStatus, AuditEntry } from "../types";
import { DecisionPageHeader } from "./DecisionUi";
import { fallbackReasonLabel, maskOpportunityToken } from "./display";
import { auditCounts, safeAuditRows, sha256Fingerprint } from "./productModel";
import type { AmountDisplayMode, DecisionView } from "./types";

export function AuditSafetyPage({ amountDisplayMode, auditLog, providerStatus, view }: { amountDisplayMode: AmountDisplayMode; auditLog: AuditEntry[]; providerStatus: AiProviderStatus | null; view: DecisionView | null }) {
  const [fingerprint, setFingerprint] = useState("正在计算…");
  const rows = useMemo(() => safeAuditRows(auditLog), [auditLog]);
  const counts = useMemo(() => auditCounts(auditLog), [auditLog]);

  useEffect(() => {
    let active = true;
    if (!view) { setFingerprint("当前上下文不可用"); return; }
    sha256Fingerprint(view.safeContext).then((value) => { if (active) setFingerprint(value); }).catch(() => { if (active) setFingerprint("指纹计算不可用"); });
    return () => { active = false; };
  }, [view]);

  return <section className="audit-safety-page" data-page="gateway">
    <DecisionPageHeader title="审计与安全" description="查看当前访问边界、Provider 状态和不含业务原文的安全审计元数据。" />
    <div className="audit-status-grid">
      <AuditSection title="当前访问范围"><dl><dt>当前角色</dt><dd>演示全权限</dd><dt>当前部门范围</dt><dd>CRM 部门字段待接入</dd><dt>当前商机 Token</dt><dd>{view ? maskOpportunityToken(view.selectedOpportunity) : "不可用"}</dd><dt>金额显示模式</dt><dd>{amountDisplayMode === "range" ? "金额区间" : "精确金额（仅界面）"}</dd><dt>客户身份</dt><dd>已脱敏</dd></dl></AuditSection>
      <AuditSection title="数据安全状态"><dl><dt>Safe Context</dt><dd className="safe">已启用</dd><dt>原始 CRM 数据外发</dt><dd className="safe">否</dd><dt>精确金额发送给模型</dt><dd className="safe">否</dd><dt>Timeline 原文发送给模型</dt><dd className="safe">否</dd><dt>客户身份发送给模型</dt><dd className="safe">否</dd><dt>CRM 自动写回</dt><dd className="safe">禁用</dd></dl></AuditSection>
      <AuditSection title="Provider 状态"><dl><dt>Provider</dt><dd>{providerStatus?.provider || "demo"}</dd><dt>Model</dt><dd>未配置外部模型</dd><dt>External Model Called</dt><dd>{providerStatus?.externalAiEnabled ? "已授权但本页未调用" : "否"}</dd><dt>Fallback</dt><dd>{fallbackReasonLabel(providerStatus?.fallbackReason || "")}</dd><dt>Schema Validation</dt><dd>{rows[0]?.schemaStatus || "当前审计源未提供"}</dd><dt>Safety Validation</dt><dd>{rows[0]?.safetyStatus || "当前审计源未提供"}</dd></dl></AuditSection>
    </div>

    <section className="audit-transform-summary product-panel"><header><div><h3>安全转换摘要</h3><p>仅展示聚合数量，不展示 Safe Context Payload 或字段值。</p></div></header><div><AuditCount label="Safe Context 字段" value={view?.safeContextKeys.length ?? counts.safeFields} /><AuditCount label="已脱敏或移除字段" value={counts.removedFields} /><AuditCount label="已执行安全转换字段" value={counts.transformedFields} /><AuditCount label="金额区间化字段" value={counts.amountBands} /></div><section className="client-fingerprint"><span>客户端上下文指纹（非服务端审计凭证）</span><code>{fingerprint}</code><p>基于当前 Safe Context 的 canonical JSON 在浏览器内计算；不会替代历史服务端审计 Hash。</p></section></section>

    <section className="safe-audit-log product-panel"><header><div><h3>安全审计记录</h3><p>仅保留请求和安全校验元数据。</p></div><span>{rows.length} 条</span></header>{rows.length ? <div className="safe-audit-table" role="table" aria-label="安全审计记录"><div className="safe-audit-head" role="row"><span>时间</span><span>请求 ID</span><span>页面</span><span>Provider</span><span>外部调用</span><span>Schema</span><span>Safety</span><span>Fallback</span><span>历史 Hash</span></div>{rows.map((row) => <article role="row" key={row.id}><span data-label="时间">{formatTime(row.time)}</span><span data-label="请求 ID">{row.requestId}</span><span data-label="页面">{row.page}</span><span data-label="Provider">{row.provider}</span><span data-label="外部调用">{row.externalCalled}</span><span data-label="Schema">{row.schemaStatus}</span><span data-label="Safety">{row.safetyStatus}</span><span data-label="Fallback">{row.fallback}</span><span data-label="历史 Hash">当前审计源未提供</span></article>)}</div> : <div className="formal-empty-state"><div className="empty-skeleton" /><h3>暂无安全审计元数据</h3><p>正式页面不会为展示效果创建审计事件。</p></div>}</section>

    <section className="model-comparison-placeholder product-panel"><h3>模型对比</h3><p>外部模型对比尚未启用，完成安全授权和 Provider 配置后开放。</p></section>
  </section>;
}

function AuditSection({ title, children }: { title: string; children: ReactNode }) { return <section className="audit-status-section product-panel"><h3>{title}</h3>{children}</section>; }
function AuditCount({ label, value }: { label: string; value: number | null | undefined }) { return <article><span>{label}</span><strong>{value === null || value === undefined ? "未记录" : value}</strong></article>; }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false }); }
