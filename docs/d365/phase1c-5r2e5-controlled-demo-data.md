# Phase 1C-5R2E-5 Controlled Demo Data

## Result

- Environment: `org91f5f65f.crm5.dynamics.com`
- Current status: `Corrected One-Actual server-side run complete; ordinary-user runtime verification deferred`
- Synthetic prefix: `[AI-DEMO-R2E5]`
- Created Account / Opportunity / Actual: `1 / 2 / 1`
- Production requests: `0`
- `R2E Demo Ready=false`

The original blocked result is preserved below. A separately authorized corrected run subsequently used the One-Actual option.

## Corrected One-Actual Run

### Created Records

| Type | Name | Test-environment ID |
|---|---|---|
| Account | `[AI-DEMO-R2E5] Synthetic Logistics Account` | `bc1bfb52-2c80-f111-ab0e-000d3a82d194` |
| Opportunity | `[AI-DEMO-R2E5] Monthly Actuals Scenario` | `4d1cfb52-2c80-f111-ab0e-000d3a82d194` |
| Opportunity | `[AI-DEMO-R2E5] Pipeline Comparison Scenario` | `cf1cfb52-2c80-f111-ab0e-000d3a82d194` |
| Actual Management | `[AI-DEMO-R2E5] Four-Month Actual` | `f91cfb52-2c80-f111-ab0e-000d3a82d194` |

All names use the approved prefix. The values, descriptions, dates, and amounts are synthetic. No production GUID was imported.

### Four-Month And Plugin Validation

| Field | Saved value |
|---|---:|
| April Revenue | 100 |
| May Revenue | 200 |
| June Revenue | 300 |
| July Revenue | 400 |
| Generated Annual Actual Revenue | 1,000 |
| Parent Opportunity annual Revenue | 1,000 |

- The Actual is related only to `4d1cfb52-2c80-f111-ab0e-000d3a82d194`.
- That Opportunity has exactly one Actual.
- `cf1cfb52-2c80-f111-ab0e-000d3a82d194` has zero Actuals and no parent annual total.
- The Actual inherits CNY from the Opportunity.
- Location resolves to existing `01: Beijing` (`1f4e1d38-537f-f111-ab0e-70a8a5007736`).
- All four POL/POD lookups reuse existing `9999: OTR` (`801b12b1-987e-f111-ab0e-002248eb1915`).
- No Location or POL/POD master data was created or changed.
- Neither `aigw_yearrevenueactualcny` nor any generated annual/base field was present in a create payload.
- The created Opportunity has Activity/Note counts `0/0`.

### Runtime Validation

Server-side readiness is true. Browser control timed out twice while obtaining a read-only Dynamics DOM/screenshot, and no currently controllable tab provided verifiable `CRM AI Demo User` evidence. An administrator session was not accepted as a substitute.

The following ordinary-user checks therefore remain pending:

- both Opportunities visible in the list;
- Full Replica route;
- Location and POL/POD rendering;
- one-row Actual subgrid and annual total;
- native Timeline and BPF display;
- absence of permission, loading, and console P0/P1 errors.

No browser save, create, update, or delete action occurred.

### Corrected Cleanup Manifest

Delete only these IDs, in this order, under separate cleanup authorization:

1. Actual Management: `f91cfb52-2c80-f111-ab0e-000d3a82d194`
2. Opportunity: `4d1cfb52-2c80-f111-ab0e-000d3a82d194`
3. Opportunity: `cf1cfb52-2c80-f111-ab0e-000d3a82d194`
4. Account: `bc1bfb52-2c80-f111-ab0e-000d3a82d194`

Location and POL/POD arrays are explicitly empty.

### Corrected Run Requests

```text
GET=101
POST=4
PATCH=0
DELETE=0
Publish=0
Client business creates=4
Expected Plugin parent-total side effect=1
Production requests=0
```

The first Apply attempt failed at the local test-environment classification gate before authentication or any Dataverse request. The successful Apply used process-local test classification and production denylist values; no `.env` or global authentication configuration was changed.

### Corrected Run Gates

| Gate | Result |
|---|---|
| Synthetic Data Only | true |
| Baseline Opportunity Preserved | true |
| Duplicate Demo Records | 0 |
| One Actual Per Opportunity Ready | true |
| Four Month Fields Ready | true |
| Demo Relationships Valid | true |
| Actual Totals Plugin Ready | true |
| Ordinary User Demo Runtime Ready | false - browser evidence deferred |
| Cleanup Manifest Ready | true |
| Protected Form/BPF/Plugin Integrity | true |
| Production Isolation Ready | true |
| R2E Demo Ready | false |

Corrected-run issue count: P0=`0`, P1=`1` (ordinary-user browser evidence unavailable), P2=`0`.

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
