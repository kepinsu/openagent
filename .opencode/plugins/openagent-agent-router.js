const DEVELOPMENT_ENTRY_AGENT = "OpenGoCoder";
const FRONTEND_AGENT = "open-frontend-specialist";
const GO_AGENT = "coder-agent";

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

const projectAgentCache = new Map();

function countMatches(text, patterns) {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function agentForPrompt(text) {
  const normalized = text.toLowerCase();
  const frontendScore = countMatches(normalized, FRONTEND_PATTERNS);
  const goScore = countMatches(normalized, GO_PATTERNS);

  if (frontendScore === goScore) {
    return undefined;
  }

  return frontendScore > goScore ? FRONTEND_AGENT : GO_AGENT;
}

function textFromParts(parts) {
  return parts
    .filter((part) => part.type === "text" && !part.ignored)
    .map((part) => part.text)
    .join("\n");
}

async function exists(directory, file) {
  return Bun.file(directory + "/" + file).exists();
}

async function agentForProject(directory) {
  if (typeof Bun === "undefined") {
    return undefined;
  }

  const goProject = await exists(directory, "go.mod");
  const frontendConfig = await Promise.all(
    FRONTEND_CONFIG_FILES.map((file) => exists(directory, file)),
  );

  let frontendProject = frontendConfig.some(Boolean);
  const packageFile = Bun.file(directory + "/package.json");

  if (await packageFile.exists()) {
    const packageContent = await packageFile.text();
    frontendProject = frontendProject || FRONTEND_PACKAGE_PATTERN.test(packageContent);
  }

  if (goProject === frontendProject) {
    return undefined;
  }

  return frontendProject ? FRONTEND_AGENT : GO_AGENT;
}

function cachedProjectAgent(directory) {
  if (!projectAgentCache.has(directory)) {
    projectAgentCache.set(directory, agentForProject(directory));
  }

  return projectAgentCache.get(directory);
}

async function selectAgent(parts, directory) {
  const promptAgent = agentForPrompt(textFromParts(parts));

  if (promptAgent) {
    return promptAgent;
  }

  return cachedProjectAgent(directory);
}

function isDevelopmentRequest(inputAgent, outputAgent) {
  return (
    inputAgent === DEVELOPMENT_ENTRY_AGENT ||
    (!inputAgent && outputAgent === DEVELOPMENT_ENTRY_AGENT)
  );
}

export const OpenAgentAgentRouter = async ({ directory }) => ({
  "chat.message": async (input, output) => {
    if (!isDevelopmentRequest(input.agent, output.message.agent)) {
      return;
    }

    const agent = await selectAgent(output.parts, directory);

    if (agent && output.message.agent !== agent) {
      output.message.agent = agent;
    }
  },
});
