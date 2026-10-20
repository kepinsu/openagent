import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("../agent/", import.meta.url));
async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : file.endsWith(".md") ? [file] : [];
  }))).flat();
}

test("agent names, delegation permissions and Task examples resolve to registered paths", async () => {
  const files = await markdownFiles(root);
  const ids = new Set(files.map(file => path.relative(root, file).replaceAll("\\", "/").replace(/\.md$/, "")));
  ids.add("explore");
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const expected = path.relative(root, file).replaceAll("\\", "/").replace(/\.md$/, "");
    assert.equal(content.match(/^name: (.+)$/m)?.[1].trim(), expected);
    const permissions = content.match(/^  task:\r?\n((?:^    .*\r?\n)*)/m)?.[1] ?? "";
    for (const match of permissions.matchAll(/^    ([^:\r\n]+):/gm)) {
      const id = match[1].replaceAll('"', "").trim();
      assert.ok(id === "*" || ids.has(id), `${file}: unknown permission target ${id}`);
    }
    for (const match of content.matchAll(/subagent_type\s*=\s*"([^"]+)"/g)) {
      assert.ok(ids.has(match[1]), `${file}: unknown Task target ${match[1]}`);
    }
  }
});

const source = await readFile(new URL("./openagent-agent-router.js", import.meta.url), "utf8");
const { OpenAgentAgentRouter } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("qualified orchestrator routes Go and frontend requests without changing the selected agent", async () => {
  const hooks = await OpenAgentAgentRouter({ directory: "/unused" });
  for (const [prompt, expected] of [["Implement a golang handler", "subagents/code/coder-agent"], ["Create responsive HTML CSS", "subagents/code/open-frontend-specialist"]]) {
    for (const input of [{ agent: "core/opencoder-go" }, {}]) {
      const output = { message: { agent: "core/opencoder-go" }, parts: [{ type: "text", text: prompt }] };
      await hooks["chat.message"](input, output);
      assert.ok(output.parts[0].text.includes(`implementation_agent=${expected}.`));
      assert.equal(output.message.agent, "core/opencoder-go");
    }
  }
});

test("review and product agents are not development-router targets", async () => {
  const hooks = await OpenAgentAgentRouter({ directory: "/unused" });
  for (const agent of ["core/merge-request-reviewer", "core/product-owner"]) {
    const output = { message: { agent }, parts: [{ type: "text", text: "Review golang code" }] };
    await hooks["chat.message"]({ agent }, output);
    assert.equal(output.parts[0].text, "Review golang code");
  }
});
