const DEVELOPMENT_ENTRY_AGENT = "core/opencoder-go";
const FRONTEND_AGENT = "subagents/code/open-frontend-specialist";
const GO_AGENT = "subagents/code/coder-agent";

const FRONTEND_PATTERNS = [
  /\b(?:front(?:end|-end)?|ui|ux|react|vue|angular|svelte|next(?:\.js)?|nuxt|tailwind|css|html|typescript|tsx|jsx|component|accessibility|responsive)\b/g,
  /\b(?:design system|user interface|page web|interface web)\b/g,
];

const GO_PATTERNS = [
  /\b(?:go|golang|gofmt|goroutine|grpc|protobuf|go\.mod|handler|middleware|repository|migration|database|sqlx)\b/g,
  /\bgo\s+(?:test|build|vet|fmt)\b/g,
];

const FRONTEND_CONFIG_FILES = [
  "angular.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "nuxt.config.js",
  "nuxt.config.ts",
  "svelte.config.js",
  "svelte.config.ts",
  "vite.config.js",
  "vite.config.ts",
];

const FRONTEND_PACKAGE_PATTERN =
  /"(?:react|react-dom|next|vue|@angular\/core|svelte|@sveltejs\/kit|nuxt|solid-js|preact|tailwindcss)"\s*:/;

/** @param {string} text @param {RegExp[]} patterns */
function countMatches(text, patterns) {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/** @param {string} text */
function agentForPrompt(text) {
  const normalized = text.toLowerCase();
  const frontendScore = countMatches(normalized, FRONTEND_PATTERNS);
  const goScore = countMatches(normalized, GO_PATTERNS);

  if (frontendScore === goScore) {
    return undefined;
  }

  return frontendScore > goScore ? FRONTEND_AGENT : GO_AGENT;
}

/** @param {string} directory @param {string} file */
async function exists(directory, file) {
  try {
    await access(path.join(directory, file));
    return true;
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") return false;
    throw error;
  }
}

/** @param {string} directory */
async function agentForProject(directory) {
  const goProject = await exists(directory, "go.mod");
  const frontendConfig = await Promise.all(
    FRONTEND_CONFIG_FILES.map((file) => exists(directory, file)),
  );

  let frontendProject = frontendConfig.some(Boolean);
  if (await exists(directory, "package.json")) {
    const packageContent = await readFile(path.join(directory, "package.json"), "utf8");
    frontendProject = frontendProject || FRONTEND_PACKAGE_PATTERN.test(packageContent);
  }

  if (goProject === frontendProject) {
    return undefined;
  }

  return frontendProject ? FRONTEND_AGENT : GO_AGENT;
}

/** @param {string} text @param {string} directory */
async function selectAgent(text, directory) {
  const promptAgent = agentForPrompt(text);

  if (promptAgent) {
    return promptAgent;
  }

  // Recheck the effective directory: sessions can move and projects can change.
  return agentForProject(directory);
}

export default Plugin.define({
  id: "openagent.agent-router",
  async setup(ctx) {
    await ctx.session.hook("prompt", async (event) => {
      const text = event.prompt.text;
      if (!text?.trim() || text.includes("[OpenAgent route hint:")) return;

      const session = await ctx.session.get({ sessionID: event.sessionID });
      if (session.agent !== DEVELOPMENT_ENTRY_AGENT) return;

      const agent = await selectAgent(text, session.location.directory);
      if (!agent) return;

      // Append rather than prepend so existing attachment mention offsets survive.
      event.prompt.text = text + "\n\n[OpenAgent route hint: implementation_agent=" +
        agent + ". Keep core/opencoder-go as the primary orchestrator; " +
        "task-manager must record this agent in each relevant subtask's " +
        "suggested_agent field.]";
    });
  },
});
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { Plugin } from "@opencode/plugin";
