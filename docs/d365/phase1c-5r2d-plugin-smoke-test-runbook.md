# Phase 1C-5R2D Plugin Smoke-Test Runbook

This runbook is future execution guidance. It does not create data and does not enable any Step.

For every case, record the synthetic record key, timestamps, child annual value, parent annual value, error text if rejected, and before/after screenshots or metadata evidence. Stop on the first unexpected result.

| Test | Preconditions and action | Expected result |
|---:|---|---|
| 1 | Create one child for `DEMO-OPP-B`; fill April only | Child annual and parent annual equal April |
| 2 | Fill all 12 months | Child annual and parent annual equal the 12-month sum |
| 3 | Change one month and save | Both totals update immediately |
| 4 | Change one month to null | Null contributes zero and total decreases correctly |
| 5 | Use half-cent boundary values | Two-decimal `AwayFromZero` result |
| 6 | Attempt a second child for the same Opportunity | PreValidation rejects the save |
| 7 | Use a child currency different from its Opportunity | Save is rejected |
| 8 | Reparent a child to an eligible synthetic Opportunity | Old and new parents are recalculated |
| 9 | Delete the only child | Old parent annual total becomes zero |
| 10 | Save without changing the calculated total | No redundant parent Update is issued; verify through tracing/audit evidence |
| 11 | Inspect the generated base field | Dataverse maintains the base value; Plugin does not write it |
| 12 | Inspect deprecated independent CNY field | It is not modified by the Plugin |

## Grouped Enablement

Enable only after disabled-step metadata is verified:

1. Group 1: PreValidation Create/Update; validate lookup, currency, and cardinality.
2. Group 2: PreOperation Create/Update; validate monthly total, nulls, rounding, and no child service update.
3. Group 3: PostOperation Create/Update/Delete; validate parent total, reparent, delete, and zero/one/many behavior.

Do not continue after an error. Disable the affected group and follow the rollback runbook.
