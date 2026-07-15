# Phase 1C-5R2E-5 Controlled Demo Data

## Result

- Environment: `org91f5f65f.crm5.dynamics.com`
- Status: `Blocked before first business write`
- Synthetic prefix: `[AI-DEMO-R2E5]`
- Created Account / Opportunity / Actual: `0 / 0 / 0`
- Production requests: `0`
- `R2E Demo Ready=false`

## Blocking Contract Conflict

The requested dataset requires four Actual Management records under one Opportunity while also requiring that no duplicate rejection occur. The deployed and tested Plugin contract permits **at most one Actual Management record per Opportunity**.

Independent evidence:

1. `scripts/dataverse/lib/phase1c5-plugin-browser-smoke-contract.mjs` freezes `maximumRelatedActuals: 1` with uniqueness scoped to `aigw_opportunityid`.
2. `docs/d365/phase1c-5r2e2e1b-plugin-smoke-contract-correction.md` defines the deployed cardinality as one Actual per Opportunity.
3. `ActualTotalsService` raises an integrity exception when an Opportunity has more than one related Actual.
4. The enabled PreValidation Create step is designed to reject the second Actual before it persists.

Consequently, the following requirements cannot simultaneously be true without changing the authorized scope:

- one Opportunity has four Actual records;
- no duplicate rejection is triggered;
- Plugin remains unchanged at `7 enabled / 0 disabled`;
- P1 is zero.

No attempt was made to bypass the Plugin, disable a step, reinterpret four records as four month fields, or partially create Account/Opportunity records.

## Read-Only Preflight

Exact FetchXML literal-prefix matching returned:

| Entity | Existing `[AI-DEMO-R2E5]` records |
|---|---:|
| Account | 0 |
| Opportunity | 0 |
| Actual Management | 0 |

The first two exploratory prefix queries used an unsafe bracket representation and returned unfiltered environment rows. Those results were rejected as invalid evidence. The final query used the repository-established FetchXML pattern `like '[[]AI-DEMO-R2E5]%'` and is the authoritative result.

Active Location count remains `51`; no Location or POL/POD row was created or changed.

## Protected Baseline

| Item | Read-back result |
|---|---|
| Protected Opportunity | `f9b6f99b-2078-f111-ab0e-000d3a857307` |
| BPF instance | `221ed4a5-0780-f111-ab0e-000d3a82d194`, count/duplicate `1/0` |
| Active stage | `案件关闭` |
| Opportunity state/status | `0/1` |
| `actualclosedate` | empty |
| Actual/Activity/Note | `0/0/0` |
| Process order | `0` |
| Protected Form hash | `5519ce235d63873d934fc5dbd4b9fdb703e9a62e692d2c38e03396f7688030b7` |
| Full Replica | `5/19/115/106`, Timeline `1/0` |
| Plugin | `7 enabled / 0 disabled` |

The protected Opportunity `modifiedon` and `versionnumber` remain unchanged from the R2E-4 baseline.

## Created Data

None. There are no new IDs, relationships, monetary values, BPF instances, activities, notes, or cleanup targets from this phase.

## Cleanup Manifest

The phase created nothing, so the immediate cleanup manifest is empty:

```text
accounts=[]
opportunities=[]
actualManagement=[]
activities=[]
notes=[]
```

For a separately authorized corrected run, cleanup must delete only execution-recorded IDs in this order:

1. Actual Management records created by that run;
2. Opportunities created by that run;
3. the Account created by that run;
4. read back the prefix and require zero residual rows.

Location and POL/POD master data must never be included in cleanup.

## Safe Resolution Options

One option must be explicitly authorized before retrying:

1. **One-Actual option:** create one Actual under one Opportunity and populate four distinct monthly Revenue fields on that single record. This preserves the current Plugin contract.
2. **Four-Opportunity option:** create four synthetic Opportunities and one Actual under each. This preserves the current Plugin contract but expands the requested minimum dataset.
3. **Schema/Plugin redesign:** support multiple Actual rows per Opportunity with a new uniqueness dimension. This is a separate architecture, schema, Plugin, registration, and migration phase and is not recommended merely for demo data.

## Requests And Writes

```text
GET=27
POST=0
PATCH=0
DELETE=0
Publish=0
Business writes=0
Production requests=0
```

## Issues And Gates

- P0: `0`
- P1: `1` - requested four-child dataset conflicts with deployed one-child cardinality
- P2: `0`

| Gate | Result |
|---|---|
| Synthetic Data Only | true (no data created) |
| Baseline Opportunity Preserved | true |
| Duplicate Demo Records | 0 |
| Demo Relationships Valid | false (dataset not created) |
| Actual Month Uniqueness | false (dataset not created) |
| Actual Totals Plugin Ready | true for its deployed one-Actual contract |
| Ordinary User Demo Runtime Ready | false |
| Cleanup Manifest Ready | true (empty current manifest plus ordered future template) |
| Protected Form/BPF/Plugin Integrity | true |
| Production Requests | 0 |
| P0/P1 | `0/1` |
| R2E Demo Ready | false |

## Local Verification

- `npm test`: `184/184 passed`
- `npm run build`: passed
- `git diff --check`: passed
- Sensitive scan: passed
