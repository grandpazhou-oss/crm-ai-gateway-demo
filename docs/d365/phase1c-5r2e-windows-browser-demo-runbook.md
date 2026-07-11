# Phase 1C-5R2E Windows Browser Demo Runbook

This is a presentation guide for the company Windows computer. It assumes the test environment has separately approved and published configuration and that Plugin smoke tests have passed.

## Requirements

- Edge or Chrome
- Network access to the approved test D365 organization
- A pre-validated demo account

The computer does not need VS Code, Visual Studio, .NET SDK, Mono, Git, GitHub CLI, Plugin Registration Tool, source code, or the DLL.

## Demo Flow

1. Sign in to the approved test D365 environment.
2. Open Sales and an Opportunity.
3. Select the Full Replica form.
4. Show the `实绩管理` related-records Subgrid.
5. Create an Actual Management record.
6. Enter April, May, and June synthetic Revenue values.
7. Save and show the child annual total.
8. Return to or refresh the Opportunity.
9. Show 年度收入实绩总金额 and 年度收入实绩总金额（CNY）.
10. Change one month, save, refresh, and show the linked update.
11. Attempt a second Actual for the same Opportunity and show the validation message.
12. Delete the synthetic Actual and show the parent total returning to zero.

For each step, narrate the visible action, the expected result, and the fact that the calculation is server-side. Never display real customer, employee, route, or production data.

## Emergency Handling

- Subgrid stale: use Refresh, reopen the Opportunity, and do not create a duplicate record.
- Parent amount stale: save, refresh, wait for reload, and confirm the child actually saved.
- Plugin error: record time and message, stop, use the backup synthetic Opportunity, and disable the affected Step after the demo.
- Wrong fields: verify the Full Replica form; do not edit Form metadata during the demo.
- Login/permission issue: use the pre-validated demo account; do not change roles live.
