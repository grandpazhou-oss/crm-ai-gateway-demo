# Phase 1C-5R2E-2F2 Location Schema And Import

## Decision

- `Server-side Ready=true`
- `Runtime Validation Deferred=false`
- `Location Schema Runtime Ready=true`
- `Location Schema and Import Ready=false`
- `Location Residual Mismatch Count=not-applicable`

The Location schema, Opportunity Lookup, View, Full Replica binding and targeted
publication are complete. Manual runtime evidence confirms the published native
Lookup opens in Full Replica without permission, target, component, or loading
errors. Phase 2F2B remains separately gated and has not started; no Location
master records were imported.

## Environment And Baseline

- Host: approved test organization only
- Solution: `CRMAIGatewayDemo`, unmanaged, publisher prefix `aigw`
- Protected Form XML hash: `5519ce235d63873d934fc5dbd4b9fdb703e9a62e692d2c38e03396f7688030b7`
- Protected Form JSON hash: `94de2fe47db7300420c7fcf73c6c1ff24d830aefea9f4a1a765daf4cd728b8f9`
- Full Replica before: 5 tabs / 19 sections / 115 controls / 106 unique fields
- Plugin: 1 Assembly / 3 Types / 7 enabled Steps / 0 disabled Steps
- BPF: Draft / Inactive
- `aigw_polpodlocation`: independently present and unchanged

## Created Schema

| Component | Definition | ID |
| --- | --- | --- |
| Location table | `aigw_location`, Organization-owned | `6e19e1da-4e7f-f111-ab0e-70a8a5007736` |
| Primary name | `aigw_name`, String 200, Business Required | `6f19e1da-4e7f-f111-ab0e-70a8a5007736` |
| Entity Set | `aigw_locations` | Metadata-derived |
| Primary ID | `aigw_locationid` | Metadata-derived |
| Opportunity Lookup | `aigw_opportunitylocation`, Optional | `bf91d1c5-a078-40e3-9bb0-8afa1d1c54b4` |
| Relationship | `aigw_location_opportunities` | `5475a62b-4f7f-f111-ab0e-70a8a5007736` |
| Lookup View | `Location Lookup View - AI Demo` | `f882ce37-4f7f-f111-ab0e-70a8a5007736` |

The relationship targets `aigw_location`; Delete is Restrict and Assign, Merge,
Reparent, Share and Unshare are NoCascade. The View filters `statecode=0`, contains
only `aigw_name`, and sorts ascending.

The table is a root Solution component with Include Subcomponents. No separate
Location navigation page was added to the Modern App.

## Full Replica Replacement

- Old Dataverse column `aigw_opportunityplace`: retained as unmanaged String
- Old Full Replica control count: 0
- New `aigw_opportunitylocation` control count: 1
- Native Timeline: 1; old Timeline controls: 0
- Actual Management Subgrid: 1
- POL/POD Lookup controls: 4, unchanged
- Final structure: 5 / 19 / 115 / 106
- FormXML and FormJSON both bind the new Lookup
- Full Replica remains Active and Non-default

Form hashes after the replacement and before publication:

- FormXML: `4e51dc08537c1652ddb3759a88ab8f10fc5da7ea6d9a21528f436f631affd0ed`
- FormJSON: `1087e1ba7368b71e8501564e6c129cf9b0f7ff7dc7a5a8410ba5038e62e68f3d`

Published FormXML contains platform normalization and hashes to
`e14ce539637a17daee5bfdf974fda8d1c57c0a8ec4f3546f0bc37036d8418421`;
the semantic structure and FormJSON are unchanged.

## Runtime And Security

The implementation Application User has System Administrator, System Customizer,
Sales Manager and Salesperson roles. This is sufficient for schema implementation
and the planned read/create verification. No business role was modified.

Manual evidence captured on 2026-07-14 shows the approved test hostname, the
published Modern App, and an existing `[AI-DEMO]` Opportunity routed to Full
Replica. The `案件场所` field renders as a native Lookup and expands to the expected
empty state before master-data import. No Location was selected and the
Opportunity was not saved. There was no permission error, invalid Lookup target,
component failure, or infinite loading state.

The runtime result also confirms that the App can resolve the Location dependency
without adding a Location navigation page. The validation user can read and open
the Lookup; no role changes were required. The screenshot remains outside Git in
the local runtime-evidence source supplied by the user.

## Phase 2F2B Import

Not executed. The external name-only CSV remains unchanged and outside Git.

| Metric | Result |
| --- | ---: |
| CSV intended rows | 51 |
| Dry Run classification | Not executed after runtime gate |
| Existing Active | Not queried |
| Created | 0 |
| Skipped | 0 |
| Failed | 0 |
| Business writes | 0 |

## Protection And Issues

- P0: 0
- P1: 0
- P2: 0
- Protected Form: unchanged
- Actual Management Form/View/Schema: unchanged
- Plugin and BPF: unchanged
- Opportunity business records: unchanged
- Demo Opportunity creation: 0
- Production requests: 0

## Request Accounting

The cumulative implementation session included dry-runs, delayed timeout
reconciliation, semantic forensics and final verification:

```text
GET=113
POST=5
PATCH=1
DELETE=0
Publish=2
Business writes=0
Production requests=0
```

POST comprises one table create (completed after client timeout), one relationship
create, one View create, and two targeted PublishXml calls. PATCH is the Full
Replica FormXML binding replacement. No App publish was required or performed.

The 2F2A gate is passed. Phase 2F2B Location dry-run and import may resume under a
separate execution authorization; this verification performed no Location import.

## Runtime Gate Read-Back

The final read-only supplement used 15 Dataverse GET requests and no writes:

```text
GET=15
POST=0
PATCH=0
DELETE=0
Publish=0
Business writes=0
Production requests=0
```

It reconfirmed `aigw_opportunitylocation` as the single Full Replica Lookup,
targeting `aigw_location` through `aigw_location_opportunities`; the old
`aigw_opportunityplace` control count is zero. Full Replica remains 5/19/115/106
with one native Timeline. Protected Form hashes remain at baseline, the BPF is
Draft/Inactive, and the plugin protection gate remains 7 enabled / 0 disabled.
