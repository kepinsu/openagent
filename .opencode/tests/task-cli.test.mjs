import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const [version, source] of [["V2", root], ["V1 archive", path.join(root, "..", ".opencodev1")]]) {
  test(`${version} task router operates in the consuming project through a symlink`, async (t) => {
    const project = await mkdtemp(path.join(os.tmpdir(), "openagent-tasks-"));
    t.after(() => rm(project, { recursive: true, force: true }));
    await mkdir(path.join(project, ".git"));
    await symlink(source, path.join(project, ".opencode"), "dir");
    const tasks = path.join(project, ".tmp/tasks/sample");
    await mkdir(tasks, { recursive: true });
    await writeFile(path.join(tasks, "task.json"), JSON.stringify({ id: "sample", subtask_count: 2 }));
    for (const [seq, depends_on] of [["01", []], ["02", ["01"]]]) {
      await writeFile(path.join(tasks, `subtask_${seq}.json`), JSON.stringify({
        id: `sample-${seq}`, seq, status: "pending", depends_on,
        acceptance_criteria: ["Works"], deliverables: ["result.md"],
      }));
    }
    const run = (...args) => execFileSync("bash", [".opencode/skills/task-management/router.sh", ...args], {
      cwd: project, encoding: "utf8", env: { ...process.env, PATH: `${path.dirname(process.execPath)}:${process.env.PATH}` },
    });
    assert.match(run("validate", "sample"), /All checks passed/);
    const first = JSON.parse(run("next", "--json", "sample"));
    assert.deepEqual(first.map((item) => item.subtask.seq), ["01"]);
    assert.equal(first[0].task_root, tasks);
    run("complete", "sample", "01", "First task verified");
    assert.deepEqual(JSON.parse(run("next", "--json", "sample")).map((item) => item.subtask.seq), ["02"]);
    run("complete", "sample", "02", "Second task verified");
    assert.equal(JSON.parse(await readFile(path.join(tasks, "task.json"), "utf8")).status, "completed");
  });
}
