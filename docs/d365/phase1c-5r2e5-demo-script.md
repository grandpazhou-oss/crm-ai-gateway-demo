# Phase 1C-5R2E-5 Demo Script

## Status

This 5-8 minute route is prepared but **not execution-ready** because the controlled R2E-5 dataset was not created. Do not present existing business or sample records as substitutes for the missing `[AI-DEMO-R2E5]` records.

## Preconditions

- Use `CRM AI Demo User`, never an administrator, for the presentation.
- Open only `CRM AI Gateway Demo - Modern` in `org91f5f65f.crm5.dynamics.com`.
- Confirm the selected record begins with `[AI-DEMO-R2E5]`.
- Confirm the corrected dataset follows the deployed one-Actual-per-Opportunity contract.
- Do not invoke an external LLM. AI explanations must describe the Safe Context boundary only.

## 5-8 Minute Route

### 1. Login And App Boundary (30 seconds)

Sign in as the ordinary demo user and open the Modern App. Point out that the navigation is intentionally limited to Opportunities and Actual Management.

### 2. Opportunity List (30-45 seconds)

Open the demo Opportunity view, filter/search for `[AI-DEMO-R2E5]`, and select only the execution-recorded synthetic Opportunity. Do not open unrelated records.

### 3. Full Replica Overview (60 seconds)

Show the Full Replica name, header, and five tabs. Explain that it remains non-default and is exposed through the dedicated app and role configuration.

### 4. Location And POL/POD (45 seconds)

Show the Location lookup and POL/POD lookups without changing selections. Explain that Location and POL/POD are controlled test master data and are not sent to an external AI provider.

### 5. Monthly Actuals And Annual Revenue (90 seconds)

Open the Actual Management subgrid. Under the approved one-Actual option, open the single synthetic Actual read-only and show the populated month fields and generated Annual Actual Revenue. Return to the Opportunity and show the synchronized parent annual Revenue total.

Do not claim that four child rows are supported. The current Plugin permits one Actual per Opportunity.

### 6. Timeline (30 seconds)

Show the native Timeline empty state and controls. Do not create an Activity or Note.

### 7. BPF (45 seconds)

Show the active two-stage BPF. Do not click Next Stage, Previous Stage, Finish, Close as Won, Close as Lost, or Switch Process.

### 8. AI Gateway Safety Boundary (60 seconds)

Explain that only mapped, sanitized Safe Context enters the demo AI layer. Raw Timeline content, customer identifiers, exact Location/POL/POD values, credentials, tokens, and production data are excluded. External LLM calls remain disabled for this route.

### 9. Close (20 seconds)

Return to the Opportunity summary without saving. Confirm that the demonstration was read-only.

## Forbidden Clicks

- Save after changing any field
- New Account, Opportunity, Actual, Activity, or Note
- Next/Previous Stage, Finish, Switch Process
- Close as Won / Close as Lost
- Delete
- Publish or designer links
- Any record without the `[AI-DEMO-R2E5]` prefix

## Exception Handling

- **Wrong form or record:** stop immediately; do not save or navigate through another record.
- **Permission or component error:** capture a local screenshot, close the form, and report P1.
- **Actual count greater than one:** stop; do not delete or repair during the demo.
- **Annual total mismatch:** stop; do not hand-edit the parent total.
- **Unexpected activity/note:** stop and preserve evidence; do not clean it up without a separate manifest.
- **Production hostname:** close the tab immediately and report P0.

## Readiness

- Script structure ready: `true`
- Controlled dataset ready: `false`
- Ordinary-user runtime acceptance ready: `false`
- `R2E Demo Ready=false`
