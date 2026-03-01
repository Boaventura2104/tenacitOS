import { NextResponse } from "next/server";
import { existsSync, readFileSync, statSync } from "fs";
import { isAbsolute, join } from "path";
import { OPENCLAW_DIR, OPENCLAW_WORKSPACE } from "@/lib/paths";

export const dynamic = "force-dynamic";

interface Agent {
  id: string;
  name?: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  dmPolicy?: string;
  allowAgents?: string[];
  allowAgentsDetails?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  botToken?: string;
  status: "online" | "offline";
  lastActivity?: string;
  activeSessions: number;
}

// Fallback config used when an agent doesn't define its own ui config in openclaw.json.
// The main agent reads name/emoji from env vars; all others fall back to generic defaults.
// Override via each agent's openclaw.json → ui.emoji / ui.color / name fields.
const DEFAULT_AGENT_CONFIG: Record<string, { emoji: string; color: string; name?: string }> = {
  main: {
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🤖",
    color: "#ff6b35",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "Mission Control",
  },
};

function ensureAbsoluteWorkspace(workspace: string): string {
  if (!workspace) return OPENCLAW_WORKSPACE;
  if (isAbsolute(workspace)) return workspace;
  return join(OPENCLAW_DIR, workspace);
}

function resolveAgentWorkspace(agent: any): string {
  if (agent?.workspace) {
    return ensureAbsoluteWorkspace(agent.workspace);
  }
  if (agent?.id === "main") {
    return OPENCLAW_WORKSPACE;
  }
  return join(OPENCLAW_DIR, `workspace-${agent.id}`);
}

/**
 * Get agent display info (emoji, color, name) from openclaw.json or defaults
 */
function getAgentDisplayInfo(agentId: string, agentConfig: any): { emoji: string; color: string; name: string } {
  // First try to get from agent's own config in openclaw.json
  const configEmoji = agentConfig?.ui?.emoji;
  const configColor = agentConfig?.ui?.color;
  const configName = agentConfig?.name;

  // Then try defaults
  const defaults = DEFAULT_AGENT_CONFIG[agentId];

  return {
    emoji: configEmoji || defaults?.emoji || "🤖",
    color: configColor || defaults?.color || "#666666",
    name: configName || defaults?.name || agentId,
  };
}

export async function GET() {
  try {
    // Read openclaw config
    const configPath = join(OPENCLAW_DIR, "openclaw.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));

    const agentList = Array.isArray(config.agents?.list)
      ? config.agents.list
      : [];
    const agentDefaults = config.agents?.defaults;
    const telegramAccounts = config.channels?.telegram?.accounts || {};
    const telegramDmPolicy =
      config.channels?.telegram?.dmPolicy || "pairing";

    const agents: Agent[] = agentList.map((agent: any) => {
      const agentInfo = getAgentDisplayInfo(agent.id, agent);
      const workspacePath = resolveAgentWorkspace(agent);

      const telegramAccount = telegramAccounts[agent.id];
      const botToken = telegramAccount?.botToken;

      let lastActivity: string | undefined;
      let status: "online" | "offline" = "offline";
      const today = new Date().toISOString().split("T")[0];
      const memoryFile = join(workspacePath, "memory", `${today}.md`);

      if (existsSync(memoryFile)) {
        try {
          const stat = statSync(memoryFile);
          lastActivity = stat.mtime.toISOString();
          status =
            Date.now() - stat.mtime.getTime() < 5 * 60 * 1000
              ? "online"
              : "offline";
        } catch (error) {
          console.warn("Failed to stat memory file:", error);
        }
      }

      const allowAgents = Array.isArray(agent.subagents?.allowAgents)
        ? agent.subagents.allowAgents
        : [];

      const allowAgentsDetails = allowAgents.map((subagentId: string) => {
        const subagentConfig = agentList.find(
          (a: any) => a.id === subagentId
        );
        if (subagentConfig) {
          const subagentInfo = getAgentDisplayInfo(subagentId, subagentConfig);
          return {
            id: subagentId,
            name: subagentConfig.name || subagentInfo.name,
            emoji: subagentInfo.emoji,
            color: subagentInfo.color,
          };
        }
        const fallbackInfo = getAgentDisplayInfo(subagentId, null);
        return {
          id: subagentId,
          name: fallbackInfo.name,
          emoji: fallbackInfo.emoji,
          color: fallbackInfo.color,
        };
      });

      return {
        id: agent.id,
        name: agent.name || agentInfo.name,
        emoji: agentInfo.emoji,
        color: agentInfo.color,
        model:
          agent.model?.primary || agentDefaults?.model?.primary ||
          "openai-codex/gpt-5.1-codex-mini",
        workspace: workspacePath,
        dmPolicy: telegramAccount?.dmPolicy || telegramDmPolicy,
        allowAgents,
        allowAgentsDetails,
        botToken: botToken ? "configured" : undefined,
        status,
        lastActivity,
        activeSessions: 0,
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error reading agents:", error);
    return NextResponse.json({ agents: [] });
  }
}
