import type { UnifiedAiOutput } from "./contract";

export type DecisionMode = "portfolio" | "scenario";
export type AmountDisplayMode = "range" | "exact";

export type DecisionScenarioDescriptor = {
  id: string;
  title: string;
  summary: string;
  count: number;
  defaultOpportunity: string;
};

export type SafeAccountAggregate = {
  accountToken: string;
  serviceCoverageBand: string;
  whitespaceCategory: string;
  opportunityTrend: string;
  relationshipMaturity: string;
};

export type SafeDecisionContext = {
  opportunityToken: string;
  customerToken: string;
  accountToken: string;
  ownerToken: string;
  stage: string;
  priority: string;
  forecastCategory: string;
  relativeDateStatus: string;
  stagnationBand: string;
  revenueBand: string;
  marginBand: string;
  budgetBand: string;
  actualBand: string;
  varianceCategory: string;
  elapsedPeriodCategory: string;
  dataQualityCodes: string[];
  missingCodes: string[];
  contradictionCodes: string[];
  transportMode: string;
  routeConsistency: string;
  needSummary: string;
  proposalSummary: string;
  progressSummary: string;
  meetingWindow: string;
  stakeholderCoverage: string;
  openQuestionCount: number;
  decisionReadiness: string;
  accountAggregate: SafeAccountAggregate;
};

export type ScenarioDecisionPack = {
  cockpit: UnifiedAiOutput;
  risk: UnifiedAiOutput;
  opportunity360: UnifiedAiOutput;
  action: UnifiedAiOutput;
  meeting: UnifiedAiOutput;
  portfolio: UnifiedAiOutput;
};

export type DecisionView = {
  mode: DecisionMode;
  scenario: DecisionScenarioDescriptor | null;
  scopeSummary: { scopeCount: number; criticalCount: number; highCount: number; reviewRequiredCount: number };
  defaultOpportunity: string;
  selectedOpportunity: string;
  opportunities: Array<{ opportunityToken: string; ownerToken: string; stage: string; priority: string }>;
  safeContext: SafeDecisionContext;
  safeContextKeys: string[];
  pack: ScenarioDecisionPack;
};

export type DecisionOpportunityDetail = {
  mode: DecisionMode;
  scenario: DecisionScenarioDescriptor | null;
  safeContext: SafeDecisionContext;
  accountAggregate: SafeAccountAggregate;
  opportunity360: UnifiedAiOutput;
};

export type DecisionScenarioCatalog = {
  defaultMode: DecisionMode;
  portfolioDefaultOpportunity: string;
  scenarios: DecisionScenarioDescriptor[];
};
