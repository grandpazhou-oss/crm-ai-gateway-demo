# Phase 1C-5R2E-3B2A Dedicated Demo BPF Security Role Setup

## Result

- `Non-admin Demo Test User Ready=false`
- `BPF Demo User Permission Ready=false`
- `BPF Process Order Change Ready=false`
- `BPF Runtime Test Ready=false`

The mandatory user-selection gate failed before any write. The test environment contains only one enabled interactive user, Zhou Wenzhe, who is explicitly excluded from ordinary-user evidence and has System Administrator. All other enabled rows are Application Users or special non-interactive Support/Delegated identities.

No security role was created, no privilege was changed, no user-role assignment was made, and no App or BPF access configuration was changed.

## Environment And Preflight

- Environment: `org91f5f65f.crm5.dynamics.com`
- Target BPF: `销售流程 - AI Demo Full Replica`
- Workflow ID: `7325b274-6b7c-f111-ab0e-70a8a50388b9`
- Production requests: 0

| Gate | Result |
|---|---|
| BPF state | Active / Activated |
| Process order | 100 |
| Primary entity | `opportunity` |
| Definition SHA-256 | `59819cd865fd39c5a838441cad21979e4e1a08387b3bb62eab2285e07c213f08` |
| Backing table | `aigw_ai_demo_full_replica` |
| Entity Set | `aigw_ai_demo_full_replicas` |
| Object Type Code | 11730 |
| Backing rows | 0 |
| Modern App target BPF components | 1 |

## Non-Administrator Candidate Audit

### Environment Summary

- Enabled `systemuser` rows: 193
- Enabled normal interactive users (`accessmode=0`, non-Application User): 1
- Qualifying non-admin candidates after exclusions: 0
- Remaining enabled rows: Application Users or special Support/Delegated access modes

### Interactive User

| Display Name | System User ID | Current roles | Candidate | Reason |
|---|---|---|---|---|
| Zhou Wenzhe | `df4b1a2f-cd6d-f111-ab0d-00224818ead9` | System Administrator; Basic User | No | Explicitly excluded and administrator-capable |

No enabled interactive user was found who simultaneously:

- has Basic User or an equivalent foundation role,
- has no System Administrator, System Customizer, Environment Maker, or equivalent bypass role,
- is not Zhou Wenzhe,
- and can be used as an existing test-environment Demo identity.

Application Users were not reclassified as ordinary browser users. Support User and Delegated Admin special access modes were not selected.

## Required Manual Preparation

Before resuming this phase, prepare one existing Entra-backed test user in this Dataverse environment with:

1. Enabled normal interactive access (`accessmode=0`).
2. A valid license and test-environment access.
3. Basic User or an equivalent minimal business role.
4. No System Administrator, System Customizer, Environment Maker, delegated administrator, or comparable bypass role.
5. Membership in the intended Business Unit.
6. Ability to open `CRM AI Gateway Demo - Modern` through existing App sharing or an explicitly approved role association.

Do not remove Zhou Wenzhe's administrator role to manufacture a candidate. Do not create a new Entra user through this automation.

## Selected Test User

None.

Because selection failed, Business Unit role scope could not be established safely and the custom role creation gate did not open.

## Custom Role

| Item | Result |
|---|---|
| Intended name | `CRM AI Gateway Demo BPF User` |
| Existing-role reuse check | Deferred until a target Business Unit exists |
| Role created | No |
| Basic User modified | No |
| System Administrator modified | No |

No cross-Business-Unit role was guessed or created.

## Backing Table Permission Matrix

The intended contract remains:

| Privilege | Intended depth | Configured this phase |
|---|---|---|
| Read | Organization | No |
| Create | Organization | No |
| Write | Organization | No |
| Append | Organization | No |
| Append To | Organization | No |
| Delete | None | No |
| Assign | None | No |
| Share | None | No |

The backing table exposes all five required privilege definitions, but no role privilege was added because there is no authorized target user/Business Unit.

## BPF Role Access Matrix

| Role | Before | After |
|---|---|---|
| System Administrator | Existing access | Unchanged |
| System Customizer | Existing platform behavior | Unchanged |
| Basic User | No backing-table privileges | Unchanged |
| CRM AI Gateway Demo BPF User | Does not exist in an authorized target BU | Not added |

The BPF was not opened to all roles and no other process access was changed.

## Modern App Sharing

- Target test user: none
- App sharing check for a selected user: not applicable
- App role association changes: 0
- App page/navigation/component changes: 0
- App publish: 0

## Role Assignment

- Selected Test User ID: none
- Role ID: none
- Assignments created: 0
- Existing assignments removed: 0

## Effective Permission Read-Back

Not applicable because no qualifying non-admin user and no supplemental role exist. System Administrator evidence from the previous phase is not reused as ordinary Demo-role evidence.

## Process Order

| Order | Process | Result |
|---:|---|---|
| 1 | Follow up with Opportunity | Unchanged |
| 1 | Sales Process | Unchanged |
| 100 | 销售流程 - AI Demo Full Replica | Unchanged |

No Order Process Flow operation was executed.

## ALM Deferred

`EXPECTED_ALM_FOLLOW_UP`

The backing Entity remains in Active and Default Solution membership, without a directly confirmed `CRMAIGatewayDemo` Entity component. This does not affect the no-write user gate result and was not modified.

## Protection Verification

| Gate | Result |
|---|---|
| BPF | Active / Activated |
| Definition hash | Unchanged |
| Process order | 100 |
| Backing rows | 0 |
| Full Replica | 5 / 19 / 115 / 106 |
| Native Timeline | 1 |
| Protected Form FormXML hash | `5519ce235d63873d934fc5dbd4b9fdb703e9a62e692d2c38e03396f7688030b7` |
| Plugin Enabled / Disabled | 7 / 0 |
| Actual Main Form | 1 / 5 / 41 |
| Location Active | 51 |
| Opportunity business writes | 0 |
| BPF instance writes | 0 |
| Production requests | 0 |

## Findings

### P0

None.

### P1

1. No qualifying existing non-administrator interactive Demo test user is available.
2. Consequently the supplemental role, backing-table privilege contract, BPF role access, App access, and user assignment cannot be completed or validated.

### P2

1. Backing Entity ALM membership remains deferred.
2. Process order remains 100.
3. Ordinary-user browser testing has not been performed.

## Request Accounting

- GET: 593
- POST: 0
- PATCH: 0
- DELETE: 0
- Publish: 0
- Activation / Deactivation: 0
- Security-role writes: 0
- User-role assignments: 0
- BPF instance writes: 0
- Opportunity business writes: 0
- Production requests: 0

The high GET count came from the initial read-only enumeration of all 193 enabled system users, their direct roles, Team memberships, and inherited Team roles. No authentication material or user secrets were recorded.

## Final Gate

- `Non-admin Demo Test User Ready=false`
- `BPF Demo User Permission Ready=false`
- `BPF Process Order Change Ready=false`
- `BPF Runtime Test Ready=false`

Resume only after an eligible existing non-admin interactive user has been provisioned manually. Do not modify Process Order or run BPF runtime tests before the dedicated role and effective-permission gates pass.
