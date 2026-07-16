const PRIORITY_LABELS: Record<string, string> = {
  Critical: "严重",
  High: "高风险",
  Medium: "中等",
  Monitor: "正常监测",
};

const STAGE_LABELS: Record<string, string> = {
  Qualify: "授予资格",
  Develop: "推进中",
  Propose: "提案中",
  Close: "案件关闭",
};

export function priorityLabel(value: string) {
  return PRIORITY_LABELS[value] || value;
}

export function stageLabel(value: string) {
  return STAGE_LABELS[value] || value;
}

export function maskOpportunityToken(value: string) {
  const suffix = value.match(/(\d{3})$/)?.[1];
  return suffix ? `SAFE-OPP-${suffix}` : "SAFE-OPP";
}

export function booleanLabel(value: boolean) {
  return value ? "是" : "否";
}

const SCENARIO_TITLES: Record<string, string> = {
  "stalled-high-value": "高价值停滞",
  "budget-actual-gap": "预算与实绩偏差",
  "data-contradiction": "数据矛盾",
  "growth-opportunity": "增长机会",
  "location-route-risk": "地点与路线风险",
  "meeting-prep": "会前准备",
  "multi-risk-priority": "多风险优先级",
  "healthy-control": "健康对照",
};

export function scenarioTitle(id: string, fallback: string) {
  return SCENARIO_TITLES[id] || fallback;
}

export function fallbackReasonLabel(value: string) {
  if (!value || value === "None") return "无";
  if (value === "AI_PROVIDER is not openai-compatible.") return "演示模式：未配置外部兼容模型";
  if (value === "ALLOW_EXTERNAL_AI is not true.") return "外部 AI 未授权";
  if (value.startsWith("Missing external LLM config:")) return "外部模型配置不完整";
  return value;
}

const DECISION_TEXT: Record<string, string> = {
  "Executive decision summary": "管理层决策摘要",
  "Risk and priority finding": "风险与优先级判断",
  "Opportunity 360 assessment": "商机 360 判断",
  "Recommended action plan": "建议行动方案",
  "Meeting preparation": "会议准备",
  "Portfolio intelligence": "组合洞察",
  "Management view: Multiple safe signals indicate that this case should lead the management review queue.": "管理视角：多项安全信号表明该商机应进入管理层优先复核队列。",
  "Multiple safe signals indicate that this case should lead the management review queue.": "多项安全信号表明该商机应进入管理层优先复核队列。",
  "Run an evidence review": "开展证据复核",
  "Resolve the highest-impact safe signals before changing the forecast.": "在调整预测前，先核实影响最大的安全信号。",
  "Action sequencing: Multiple safe signals indicate that this case should lead the management review queue.": "行动排序：该商机存在多项安全风险信号，应优先完成证据复核。",
  "Deterministic assessment from sanitized categorical signals.": "基于脱敏分类信号的确定性判断。",
  "A high-value opportunity appears stalled and warrants a focused unblock review.": "高价值商机存在明显停滞，需要聚焦排除推进障碍。",
  "Actual performance is materially below the sanitized budget range.": "实际表现明显低于脱敏后的预算区间。",
  "The forecast signal should be treated cautiously until the data contradiction is resolved.": "数据矛盾解决前，应谨慎使用当前预测信号。",
  "The internal route configuration needs verification; no external disruption is asserted.": "内部路线配置需要核验；当前不对外部中断作任何断言。",
  "The opportunity is progressing at a healthy cadence; continue normal monitoring.": "商机正按健康节奏推进，建议保持常规监测。",
  "Hypothesis: the account may support a targeted cross-sell conversation; validate with the account owner.": "假设：该客户可能适合开展定向交叉销售；需与客户负责人核实。",
  "The meeting should focus on unresolved decision questions and stakeholder alignment.": "会议应聚焦尚未解决的决策问题和关键人对齐。",
  "The meeting appears prepared; preserve the current agenda.": "会议准备度良好，建议保持当前议程。",
  "The scoped portfolio contains escalated cases that should be sequenced ahead of routine monitoring.": "当前组合包含升级案件，应优先于常规监测事项处理。",
  "The scoped portfolio has no escalation signal.": "当前组合没有升级处理信号。",
  "High-value and severe-stagnation bands are both present.": "高价值与严重停滞信号同时存在。",
  "The material variance category is derived from complete monthly aggregates.": "重大偏差信号来自完整的月度聚合。",
  "Contradictory or missing safe fields reduce decision confidence.": "安全字段的矛盾或缺失降低了决策置信度。",
  "Only internal route-consistency metadata is available.": "当前仅有内部路线一致性元数据。",
  "Safe indicators are aligned and no escalation signal is present.": "安全指标一致，未发现升级信号。",
  "Growth is a hypothesis based on account-level safe aggregates.": "增长机会仅是基于客户级安全聚合的待验证假设。",
  "Meeting guidance uses derived readiness signals only and excludes communication content.": "会议建议仅使用派生准备度信号，不包含沟通原文。",
  "Confirm the next decision milestone": "确认下一决策里程碑",
  "A dated milestone can test whether the opportunity remains actionable.": "明确日期的里程碑可验证商机是否仍具可执行性。",
  "Review the recovery assumptions": "复核恢复假设",
  "Reconcile the budget cadence with recorded actual bands.": "将预算节奏与已记录的实绩区间进行核对。",
  "Resolve the flagged fields": "解决被标记字段",
  "Improve data quality before relying on the forecast.": "在依赖预测前先提升数据质量。",
  "Verify routing master data": "核验路线主数据",
  "Confirm the sanitized route combination with an authorized operator.": "由授权运营人员确认脱敏路线组合。",
  "Maintain the current cadence": "保持当前推进节奏",
  "No risk escalation is supported by the safe evidence.": "安全证据不支持风险升级。",
  "Validate the whitespace hypothesis": "验证服务空白假设",
  "Use account planning to confirm whether the inferred service gap is real.": "通过客户规划确认推断的服务缺口是否真实存在。",
  "Prepare a question-led agenda": "准备问题导向的会议议程",
  "Address the safe open-question count without using communication transcripts.": "仅根据安全的待确认问题数量准备议程，不使用沟通原文。",
  "Owner token": "脱敏负责人",
  "Within 2 days": "2 天内",
  "Within 3 days": "3 天内",
  "This week": "本周内",
  "Before forecast review": "预测复核前",
  "Before quotation": "报价前",
  "Next scheduled review": "下次计划复核",
  "Next account review": "下次客户复核",
  "Before meeting": "会议前",
  "Draft only": "仅草案",
  "Priority": "优先级",
  "Progress": "推进状态",
  "Stage": "阶段",
  "Data quality": "数据质量",
  "Revenue band": "收入区间",
  "Budget band": "预算区间",
  "Actual band": "实绩区间",
  "Date status": "日期状态",
  "Variance": "偏差",
  "Forecast": "预测类别",
  "Readiness": "决策准备度",
  "Contradictions": "矛盾信号",
  "Mode": "运输模式",
  "Route consistency": "路线一致性",
  "Route check": "路线核验",
  "Service coverage": "服务覆盖",
  "Relationship": "关系成熟度",
  "Whitespace": "服务空白",
  "Trend": "商机趋势",
  "Meeting window": "会议窗口",
  "Stakeholder coverage": "关键人覆盖",
  "Open questions": "待确认问题",
  "Decision readiness": "决策准备度",
  "Progress signal": "推进信号",
  "Scoped opportunities": "范围内商机",
  "Escalated priority": "升级处理",
  "Scope count": "范围数量",
  "Escalated count": "升级数量",
  "Critical": "严重",
  "High": "高风险",
  "Medium": "中等",
  "Low": "低",
  "clear": "正常",
  "none": "无",
  "review": "待复核",
  "severe": "严重停滞",
};

export function decisionText(value: string) {
  return DECISION_TEXT[value] || value;
}
