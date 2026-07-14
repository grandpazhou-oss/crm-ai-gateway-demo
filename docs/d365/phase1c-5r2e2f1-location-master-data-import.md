# Phase 1C-5R2E-2F1 Test Location Master Data Import

## Decision

`Location Master Data Import Ready=false`

`Location Residual Mismatch Count=not-applicable`

The import stopped at the first local CSV gate. No Dataverse client was created,
no Metadata query was sent, and no Location record was created.

## Input File

- External source file: `new_locations_active_2026-07-14.csv`
- The absolute workstation path is retained only in local execution context and
  is not committed to the repository.
- File readable: yes
- Encoding: UTF-8 CSV with BOM

## CSV Validation

| Check | Result |
| --- | --- |
| Physical rows including header | 52 |
| Data rows | 51 |
| Required header | `Name` |
| Actual header columns | `LocationId`, `Name`, `StateCode`, `State`, `CreatedOn` |
| Extra columns | 4 |
| Valid trimmed names identifiable for diagnostics | 51 |
| Blank rows | 0 |
| Empty names | 0 |
| Exact duplicates | 0 |
| Trimmed case-insensitive duplicates | 0 |
| CSV gate | Blocked |

The source contains record IDs, state values, localized state labels, and created
timestamps. Those values were not imported, transformed, or used in a payload.
The names were read only to calculate validation counts; no name was changed.

## Metadata And Lookup Gate

Not executed because the CSV gate failed first. The following required facts
therefore remain unverified in this phase:

- `new_location` table and `new_locations` Entity Set;
- primary ID `new_locationid` and primary name `new_name`;
- create/read validity and required-field surface;
- Opportunity `案件场所` Lookup logical name and `new_location` target.

No schema was guessed or created.

## Dry Run And Apply

The reusable importer is:

`scripts/dataverse/import-location-master-data.mjs`

It defaults to dry-run, requires `--source`, validates the CSV before creating a
Dataverse client, and accepts only the approved test organization hostname.
Apply mode additionally requires the repository-wide test/write confirmations.

Current dry-run result:

- CSV valid names: 51 diagnostic values, but the file contract is invalid
- Existing Active: not queried
- Missing: not queried
- Inactive conflicts: not queried
- Dataverse duplicates: not queried
- To create: 0
- Skipped existing: 0

Apply was not entered. No partial import occurred.

## Import Result

| Metric | Result |
| --- | ---: |
| Import-before record count | Not queried |
| Existing Active | Not queried |
| Created | 0 |
| Skipped | 0 |
| Inactive conflict | Not queried |
| Ambiguous duplicate | Not queried |
| Failed create | 0 |
| New Location names and test GUIDs | None |

## Post-Import Verification

Not applicable because no import occurred. The importer will perform a full
active/inactive readback, normalized duplicate check, and residual mismatch
calculation only after a valid one-column CSV passes the preflight.

Opportunity, Form, View, App, BPF, Plugin, Solution, Schema, and all business
records were unchanged.

## Request Accounting

```text
GET=0
POST=0
PATCH=0
DELETE=0
Publish=0
Business writes=0
Production requests=0
```

## Required Correction

Provide a new external CSV containing exactly one header, `Name`, and only the
51 intended Location names below it. Do not edit this five-column source in
place if it is needed as rollback evidence. After replacement, rerun dry-run;
Metadata, Lookup mapping, Active/Inactive classification, and the full to-create
list must pass before a separately explicit apply invocation.

These options cannot yet be used by the subsequent Demo Data phase because the
Location import did not run.

## Verification

- `npm test`: passed, 179/179
- `npm run build`: passed
- `git diff --check`: passed
- Sensitive scan: passed
