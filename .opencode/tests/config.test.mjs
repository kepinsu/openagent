import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import { parse as parseJsonc } from "jsonc-parser";
import { Schema } from "effect";
import { Config } from "@opencode/schema/config";
import { ConfigAgent } from "@opencode/schema/config/agent";
import { ConfigCommand } from "@opencode/schema/config/command";

const root = fileURLToPath(new URL("../", import.meta.url));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  }))).flat();
}
async function definition(file) {
  const content = await readFile(file, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, `Missing frontmatter: ${file}`);
  return { front: parseYaml(match[1]), body: match[2] };
}

test("native V2 agents decode against the installed release and delegation targets exist", async () => {
  const dir = path.join(root, "agents");
  const agents = (await files(dir)).filter((f) => f.endsWith(".md"));
  const ids = new Set(agents.map((f) => path.relative(dir, f).replaceAll("\\", "/").slice(0, -3)));
  ids.add("explore");
  const decode = Schema.decodeUnknownSync(ConfigAgent.Info, { onExcessProperty: "error" });
  for (const file of agents) {
    const { front, body } = await definition(file);
    assert.doesNotThrow(() => decode(front), file);
    for (const rule of front.permissions) {
      if (rule.action === "subagent" && rule.resource !== "*") {
        assert.ok(ids.has(rule.resource), `${file}: unknown target ${rule.resource}`);
      }
    }
    for (const match of body.matchAll(/\bagent\s*=\s*"([^"]+)"/g)) {
      assert.ok(ids.has(match[1]), `${file}: unknown example target ${match[1]}`);
    }
    assert.doesNotMatch(body, /subagent_type|\btask\(/, file);
  }
});

test("profiles and example are valid native V2 configs without OpenAgent pseudo-fields", async () => {
  const decode = Schema.decodeUnknownSync(Config.Info, { onExcessProperty: "error" });
  for (const file of [...await files(path.join(root, "profiles")), path.join(root, "opencode.example.jsonc")]) {
    const errors = [];
    const config = parseJsonc(await readFile(file, "utf8"), errors, { allowTrailingComma: true });
    assert.deepEqual(errors, [], file);
    assert.doesNotThrow(() => decode(config), file);
    assert.equal(config.experimental.subagent_depth, 3);
  }
});

test("commands and skills have discoverable definitions", async () => {
  for (const file of await files(path.join(root, "commands"))) {
    const { front, body } = await definition(file);
    Schema.decodeUnknownSync(ConfigCommand.Info, { onExcessProperty: "error" })({ ...front, template: body });
  }
  const ids = new Set();
  for (const file of (await files(path.join(root, "skills"))).filter((f) => /skill\.md$/i.test(f))) {
    assert.equal(path.basename(file), "SKILL.md");
    const { front } = await definition(file);
    assert.equal(typeof front.name, "string", file);
    assert.equal(typeof front.description, "string", file);
    assert.ok(!ids.has(front.name), `Duplicate skill ${front.name}`);
    ids.add(front.name);
  }
  assert.ok(ids.has("context7"));
  assert.ok(ids.has("task-management"));
});

test("V1 archive remains byte-for-byte identical to its pre-migration manifest", async () => {
  const archive = path.join(root, "..", ".opencodev1");
  const manifest = JSON.parse(await readFile(path.join(archive, "archive-manifest.json"), "utf8"));
  for (const [file, hash] of Object.entries(manifest.files)) {
    const bytes = await readFile(path.join(archive, file));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, file);
  }
});

test("ordered permissions retain workflow delegation and read-only boundaries", async () => {
  function matches(pattern, value) {
    return new RegExp("^" + pattern.split(/([*?])/).map((part) =>
      part === "*" ? ".*" : part === "?" ? "." : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    ).join("") + "$").test(value);
  }
  async function effect(agent, action, resource) {
    const { front } = await definition(path.join(root, "agents", `${agent}.md`));
    // V2 custom agents start with allow, then append their configured rules.
    return front.permissions.filter((r) => matches(r.action, action) && matches(r.resource, resource)).at(-1)?.effect ?? "allow";
  }
  for (const agent of ["subagents/core/task-manager", "subagents/core/context-manager", "subagents/core/documentation"]) {
    assert.equal(await effect(agent, "subagent", "subagents/core/contextscout"), "allow");
    assert.equal(await effect(agent, "subagent", "subagents/code/coder-agent"), "deny");
  }
  assert.equal(await effect("core/opencoder-go", "subagent", "subagents/core/batch-executor"), "allow");
  assert.equal(await effect("core/opencoder-go", "subagent", "subagents/code/coder-agent"), "deny");
  assert.equal(await effect("subagents/core/batch-executor", "subagent", "subagents/code/coder-agent"), "allow");
  assert.equal(await effect("subagents/code/build-agent", "shell", "go build ./..."), "allow");
  assert.equal(await effect("subagents/code/build-agent", "shell", "rm -rf src"), "deny");
  for (const agent of ["core/merge-request-reviewer", "subagents/code/reviewer", "subagents/core/contextscout", "subagents/core/context-retriever"]) {
    assert.equal(await effect(agent, "edit", "src/main.go"), "deny");
    assert.equal(await effect(agent, "edit", "README.md"), "deny");
  }
});
