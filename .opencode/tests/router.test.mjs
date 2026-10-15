import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import router from "../plugins/openagent-agent-router.js";

async function project(t, files = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "openagent-router-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(directory, name), content);
  }
  return directory;
}

async function harness(session) {
  let prompt;
  await router.setup({
    // Deliberately different from the session location: global plugins and moves.
    location: { directory: "/not-the-session" },
    session: {
      get: async ({ sessionID }) => {
        assert.equal(sessionID, "session-test");
        return session;
      },
      hook: async (name, handler) => {
        assert.equal(name, "prompt");
        prompt = handler;
      },
    },
  });
  return async (text, extra = {}) => {
    const event = { sessionID: "session-test", prompt: { text, ...extra }, delivery: "steer" };
    await prompt(event);
    return event;
  };
}

test("explicit Go and UI requests add hints without switching the selected agent", async (t) => {
  const session = { agent: "core/opencoder-go", location: { directory: await project(t) } };
  const send = await harness(session);
  for (const [text, agent] of [
    ["Implement a golang handler", "subagents/code/coder-agent"],
    ["Create responsive HTML CSS", "subagents/code/open-frontend-specialist"],
  ]) {
    const result = await send(text);
    assert.ok(result.prompt.text.includes(`implementation_agent=${agent}.`));
    assert.equal(session.agent, "core/opencoder-go");
    assert.equal(result.delivery, "steer");
    assert.equal((await send(result.prompt.text)).prompt.text, result.prompt.text);
  }
});

test("project fallback follows moves, detects new files, and leaves mixed/unknown projects alone", async (t) => {
  const go = await project(t, { "go.mod": "module example.test/app" });
  const ui = await project(t, { "package.json": '{"dependencies":{"react":"19"}}' });
  const empty = await project(t);
  const session = { agent: "core/opencoder-go", location: { directory: go } };
  const send = await harness(session);
  assert.match((await send("Improve this project")).prompt.text, /implementation_agent=subagents\/code\/coder-agent/);
  session.location.directory = ui;
  assert.match((await send("Improve this project")).prompt.text, /implementation_agent=subagents\/code\/open-frontend-specialist/);
  await writeFile(path.join(ui, "go.mod"), "module mixed");
  assert.equal((await send("Improve this project")).prompt.text, "Improve this project");
  session.location.directory = empty;
  assert.equal((await send("Improve this project")).prompt.text, "Improve this project");
});

test("non-development agents and empty prompts are unchanged", async (t) => {
  const directory = await project(t, { "go.mod": "module example" });
  for (const agent of ["core/merge-request-reviewer", "core/product-owner", "core/system-builder", undefined]) {
    const send = await harness({ agent, location: { directory } });
    assert.equal((await send("Review golang code")).prompt.text, "Review golang code");
  }
  const send = await harness({ agent: "core/opencoder-go", location: { directory } });
  for (const text of ["", "   ", undefined]) assert.equal((await send(text)).prompt.text, text);
});

test("appending a hint preserves attachment mentions and prompt selections", async (t) => {
  const send = await harness({ agent: "core/opencoder-go", location: { directory: await project(t) } });
  const extra = {
    files: [{ uri: "file:///example.go", mention: { start: 0, end: 11 } }],
    agents: ["subagents/core/contextscout"],
    skills: ["golang-testing"],
  };
  const text = "@example.go Implement a golang handler";
  const result = await send(text, structuredClone(extra));
  assert.ok(result.prompt.text.startsWith(text + "\n\n"));
  for (const key of Object.keys(extra)) assert.deepEqual(result.prompt[key], extra[key]);
});
