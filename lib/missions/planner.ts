export type MissionIntent = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignedExecutives: string[];
};

export type MissionTaskPlan = {
  title: string;
  description: string;
  assignedExecutive: "orynth" | "brayko" | "lunexa" | "vyreel" | "kavro";
  priority: "low" | "medium" | "high";
  requiresApproval?: boolean;
};

const missionVerbs = [
  "build",
  "create",
  "make",
  "launch",
  "ship",
  "set up",
  "setup",
  "finish",
  "upgrade",
  "fix",
  "wire",
  "complete",
  "push",
  "deploy",
];

export function detectMissionIntent(message: string): MissionIntent | null {
  const normalized = message.toLowerCase();
  const hasMissionVerb = missionVerbs.some((verb) => normalized.includes(verb));
  const hasWorkNoun = [
    "app",
    "site",
    "website",
    "page",
    "landing",
    "dashboard",
    "backend",
    "phase",
    "feature",
    "system",
    "forge",
    "project",
    "mission",
  ].some((noun) => normalized.includes(noun));

  if (!hasMissionVerb || !hasWorkNoun) return null;

  const title = createMissionTitle(message);
  const assignedExecutives = inferExecutives(message);

  return {
    title,
    description: message.trim().replace(/\s+/g, " ").slice(0, 700),
    priority: normalized.includes("urgent") || normalized.includes("asap") || normalized.includes("now") ? "high" : "medium",
    assignedExecutives,
  };
}

export function createMissionTaskPlan(intent: MissionIntent): MissionTaskPlan[] {
  const description = intent.description;
  const tasks: MissionTaskPlan[] = [
    {
      title: "Define mission outcome and acceptance checks",
      description: `Clarify the finish line, missing details, blockers, and what proof TJ needs before calling "${intent.title}" done.`,
      assignedExecutive: "orynth",
      priority: intent.priority,
    },
  ];

  if (intent.assignedExecutives.includes("brayko")) {
    tasks.push({
      title: "Build or wire the technical implementation",
      description,
      assignedExecutive: "brayko",
      priority: intent.priority,
      requiresApproval: needsProductionApproval(description),
    });
  }

  if (intent.assignedExecutives.includes("lunexa")) {
    tasks.push({
      title: "Shape the UX, brand, and user-facing flow",
      description: "Make the interface clean, obvious, and aligned with the Forge style before launch.",
      assignedExecutive: "lunexa",
      priority: "medium",
    });
  }

  if (intent.assignedExecutives.includes("vyreel")) {
    tasks.push({
      title: "Prepare launch, content, and distribution angle",
      description: "Turn the finished work into a clear update, post, or client-facing message.",
      assignedExecutive: "vyreel",
      priority: "medium",
      requiresApproval: description.toLowerCase().includes("post") || description.toLowerCase().includes("send"),
    });
  }

  if (intent.assignedExecutives.includes("kavro")) {
    tasks.push({
      title: "Check pricing, cost, and money impact",
      description: "Flag costs, pricing, subscriptions, API usage, and where this can make or protect money.",
      assignedExecutive: "kavro",
      priority: "medium",
    });
  }

  tasks.push({
    title: "Review blockers and next action",
    description: "Summarize what is done, what is blocked, and the next move TJ should approve or test.",
    assignedExecutive: "orynth",
    priority: intent.priority,
  });

  return tasks;
}

export function inferExecutives(message: string): string[] {
  const normalized = message.toLowerCase();
  const executives = new Set<string>(["orynth"]);

  if (/(build|code|backend|api|github|deploy|wire|fix|bug|test|app|feature|phase)/.test(normalized)) {
    executives.add("brayko");
  }
  if (/(ui|ux|design|brand|page|landing|website|layout|front end|frontend)/.test(normalized)) {
    executives.add("lunexa");
  }
  if (/(launch|post|content|growth|instagram|tiktok|email|campaign|sell|client)/.test(normalized)) {
    executives.add("vyreel");
  }
  if (/(price|pricing|money|cost|revenue|stripe|payment|budget|profit)/.test(normalized)) {
    executives.add("kavro");
  }

  return Array.from(executives);
}

function createMissionTitle(message: string) {
  const cleaned = message
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(yo|bro|bet|okay|ok|please|can you|let'?s)\s+/i, "")
    .slice(0, 80);

  if (!cleaned) return "New Forge mission";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function needsProductionApproval(description: string) {
  return /(push|deploy|main|production|delete|send|publish|stripe|payment)/i.test(description);
}