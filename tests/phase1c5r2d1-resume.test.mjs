import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
  buildPluginTypePayload,
  buildResumePlan,
  extractId,
} from "../scripts/dataverse/apply-phase1c5r2d1-registration.mjs";

const primaryAssemblyId = "c4e5b181-767d-f111-ab0e-6045bd5b2c06";
const uniqueAssemblyId = "fd140aae-4df4-11dd-bd17-0019b9312238";
const pluginTypeId = "c4e5b181-767d-f111-ab0e-6045bd5b2c07";

test("create response prefers pluginassemblyid over pluginassemblyidunique", () => {
  const id = extractId({ body: { pluginassemblyid: primaryAssemblyId, pluginassemblyidunique: uniqueAssemblyId }, headers: new Headers() }, "pluginassembly");
  assert.equal(id, primaryAssemblyId);
});

test("create response accepts OData-EntityId when body is empty", () => {
  const id = extractId({ body: {}, headers: new Headers({ "OData-EntityId": `/api/data/v9.2/pluginassemblies(${primaryAssemblyId})` }) }, "pluginassembly");
  assert.equal(id, primaryAssemblyId);
});

test("header and body primary IDs must agree", () => {
  assert.throws(() => extractId({ body: { pluginassemblyid: primaryAssemblyId }, headers: new Headers({ "OData-EntityId": `/api/data/v9.2/pluginassemblies(${uniqueAssemblyId})` }) }, "pluginassembly"), /differs/);
});

test("pluginassemblyidunique cannot substitute for the primary ID", () => {
  assert.throws(() => extractId({ body: { pluginassemblyidunique: uniqueAssemblyId }, headers: new Headers() }, "pluginassembly"), /No pluginassemblyid/);
});

test("Plugin Type binding uses only pluginassemblyid", () => {
  const payload = buildPluginTypePayload("CrmAiGateway.ActualTotals.Plugin.ActualTotalsPreOperationPlugin", primaryAssemblyId);
  assert.equal(payload["pluginassemblyid@odata.bind"], `/pluginassemblies(${primaryAssemblyId})`);
  assert.doesNotMatch(JSON.stringify(payload), /pluginassemblyidunique/);
});

test("invalid assembly IDs are rejected before binding", () => {
  assert.throws(() => buildPluginTypePayload("Example", uniqueAssemblyId.replace(/.$/, "x")), /primary pluginassemblyid/);
});

test("resume plan reuses exactly one existing assembly", () => {
  assert.deepEqual(buildResumePlan({ assemblyCount: 1, pluginTypeCount: 0, stepCount: 0, imageCount: 0 }), {
    resumeExistingAssembly: true,
    createAssembly: false,
    updateAssembly: false,
    deleteAssembly: false,
    plannedPluginTypes: 3,
    plannedSteps: 7,
    plannedImages: 6,
    plannedEnabledSteps: 0,
  });
});

test("resume plan stops when assembly is missing or ambiguous", () => {
  assert.throws(() => buildResumePlan({ assemblyCount: 0, pluginTypeCount: 0, stepCount: 0, imageCount: 0 }), /exactly one/);
  assert.throws(() => buildResumePlan({ assemblyCount: 2, pluginTypeCount: 0, stepCount: 0, imageCount: 0 }), /exactly one/);
});

test("resume plan stops on pre-existing child components", () => {
  assert.throws(() => buildResumePlan({ assemblyCount: 1, pluginTypeCount: 1, stepCount: 0, imageCount: 0 }), /Plugin Types/);
  assert.throws(() => buildResumePlan({ assemblyCount: 1, pluginTypeCount: 0, stepCount: 1, imageCount: 0 }), /Steps/);
  assert.throws(() => buildResumePlan({ assemblyCount: 1, pluginTypeCount: 0, stepCount: 0, imageCount: 1 }), /Images/);
});

test("resume source has no Assembly create, update, or delete operation", async () => {
  const source = await fs.readFile(new URL("../scripts/dataverse/apply-phase1c5r2d1-registration.mjs", import.meta.url), "utf8");
  assert.match(source, /resumeExistingAssembly/);
  assert.doesNotMatch(source, /dataversePost\("\/api\/data\/v9\.2\/pluginassemblies"/);
  assert.doesNotMatch(source, /dataversePatch\(`\/api\/data\/v9\.2\/pluginassemblies/);
  assert.doesNotMatch(source, /dataverseDelete\(`\/api\/data\/v9\.2\/pluginassemblies/);
});

test("resume source never uses pluginassemblyidunique for an OData bind", async () => {
  const source = await fs.readFile(new URL("../scripts/dataverse/apply-phase1c5r2d1-registration.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /pluginassemblyidunique[^\n]*odata\.bind/);
  assert.match(source, /"pluginassemblyid@odata\.bind"/);
});

test("resume plan never plans enabled Steps", () => {
  assert.equal(buildResumePlan({ assemblyCount: 1, pluginTypeCount: 0, stepCount: 0, imageCount: 0 }).plannedEnabledSteps, 0);
});

test("resume plan has the frozen child component counts", () => {
  const plan = buildResumePlan({ assemblyCount: 1, pluginTypeCount: 0, stepCount: 0, imageCount: 0 });
  assert.equal(plan.plannedPluginTypes, 3);
  assert.equal(plan.plannedSteps, 7);
  assert.equal(plan.plannedImages, 6);
});

test("resume executor requires explicit resume mode", async () => {
  const source = await fs.readFile(new URL("../scripts/dataverse/apply-phase1c5r2d1-registration.mjs", import.meta.url), "utf8");
  assert.match(source, /requires --resume-existing-assembly/);
});

test("resume executor does not contain an Assembly content upload", async () => {
  const source = await fs.readFile(new URL("../scripts/dataverse/apply-phase1c5r2d1-registration.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /const dllContent/);
  assert.doesNotMatch(source, /content: dllContent/);
});

test("frozen primary Assembly ID is a normal Dataverse GUID", () => {
  const payload = buildPluginTypePayload("Example", primaryAssemblyId);
  assert.equal(payload["pluginassemblyid@odata.bind"].includes(uniqueAssemblyId), false);
  assert.equal(payload["pluginassemblyid@odata.bind"].includes(pluginTypeId), false);
});
