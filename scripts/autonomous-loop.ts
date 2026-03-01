#!/usr/bin/env ts-node
/**
 * SeedMoney Autonomous Loop
 * ─────────────────────────
 * Orquestrador do rodízio de 15 minutos.
 * Determina qual agente age, carrega contexto completo,
 * constrói o prompt e dispara via `openclaw agent run`.
 *
 * Uso:
 *   npx ts-node scripts/autonomous-loop.ts --agent jobs
 *   npx ts-node scripts/autonomous-loop.ts --dry-run           (apenas imprime o prompt)
 *   npx ts-node scripts/autonomous-loop.ts --agent jobs --dry-run
 */

import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ── Config ──────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "..", "data");
const MC_URL = process.env.MC_URL || "http://localhost:3000";

// ── CLI Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const agentArg = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : null;
const isDryRun = args.includes("--dry-run");

// ── Types ────────────────────────────────────────────────────────────────────
interface RotationEntry {
  agentId: string;
  slot: number;
  cronMinute: number;
}

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  status: "active" | "terminated";
}

interface OrgConfig {
  company: string;
  rotation: RotationEntry[];
  agents: AgentConfig[];
}

interface LoopContext {
  agentId: string;
  agentName: string;
  nextAgentId: string;
  timestamp: string;
  goalTarget: number;
  currentRevenue: number;
  progressPercent: number;
  apiCostsToday: number;
  pendingTasks: string;
  unreadMemos: string;
  tiktokStatus: string;
  recentActivities: string;
}

// ── Load JSON safely ─────────────────────────────────────────────────────────
function loadJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

// ── Determine which agent acts now ───────────────────────────────────────────
function determineAgent(org: OrgConfig): { current: string; next: string } {
  if (agentArg) {
    const validIds = org.agents.filter((a) => a.status === "active").map((a) => a.id);
    if (!validIds.includes(agentArg)) {
      console.error(`Agent '${agentArg}' not found or inactive. Valid: ${validIds.join(", ")}`);
      process.exit(1);
    }
    const currentIndex = org.rotation.findIndex((r) => r.agentId === agentArg);
    const next = org.rotation[(currentIndex + 1) % org.rotation.length];
    return { current: agentArg, next: next.agentId };
  }

  const currentMinute = new Date().getMinutes();
  const active = org.rotation
    .filter((r) => org.agents.find((a) => a.id === r.agentId && a.status === "active"))
    .sort((a, b) => a.cronMinute - b.cronMinute);

  if (active.length === 0) {
    console.error("No active agents in rotation.");
    process.exit(1);
  }

  // Find the slot whose minute ≤ currentMinute (most recent)
  const pastSlots = active.filter((r) => r.cronMinute <= currentMinute);
  const current = pastSlots.length > 0
    ? pastSlots[pastSlots.length - 1]
    : active[active.length - 1]; // wrap: take last of previous hour

  const currentIndex = active.findIndex((r) => r.agentId === current.agentId);
  const next = active[(currentIndex + 1) % active.length];

  return { current: current.agentId, next: next.agentId };
}

// ── Build context string ──────────────────────────────────────────────────────
async function buildContext(agentId: string, nextAgentId: string): Promise<LoopContext> {
  const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // Financial goals
  const goals = loadJson<Record<string, unknown>>(
    path.join(DATA_DIR, "financial-goals.json"),
    {}
  );
  const bootstrap = (goals.bootstrapGoal as Record<string, number>) || {};
  const goalTarget = bootstrap.targetAmount || 50;
  const currentRevenue = bootstrap.currentRevenue || 0;
  const progressPercent = goalTarget > 0 ? Math.round((currentRevenue / goalTarget) * 100 * 10) / 10 : 0;
  const apiCostsToday = (goals.totalApiCosts as number) || 0;

  // Tasks for this agent
  const allTasks = loadJson<Array<Record<string, unknown>>>(
    path.join(DATA_DIR, "tasks.json"),
    []
  );
  const myTasks = allTasks.filter(
    (t) => t.owner === agentId && t.status !== "done"
  );
  const pendingTasks =
    myTasks.length === 0
      ? "Nenhuma task pendente para você."
      : myTasks
          .slice(0, 5)
          .map((t) => `- [${t.status}] ${t.title} (${t.priority})`)
          .join("\n");

  // Unread memos
  const allMemos = loadJson<Array<Record<string, unknown>>>(
    path.join(DATA_DIR, "memos.json"),
    []
  );
  const unreadMemos = allMemos.filter(
    (m) => !m.read && (m.to === agentId || m.to === "all")
  );
  const unreadMemosStr =
    unreadMemos.length === 0
      ? "Nenhum memo não lido."
      : unreadMemos
          .slice(0, 5)
          .map((m) => `- DE ${m.from} [${m.priority}]: ${m.subject}\n  ${String(m.content).slice(0, 100)}...`)
          .join("\n");

  // TikTok pipeline
  const tiktok = loadJson<Record<string, unknown>>(
    path.join(DATA_DIR, "tiktok-pipeline.json"),
    {}
  );
  const pipeline = (tiktok.pipeline as Record<string, unknown[]>) || {};
  const tiktokStatus = [
    `Conta: ${(tiktok.account as Record<string, unknown>)?.username || "não configurada"}`,
    `Ideias: ${(pipeline.idea || []).length}`,
    `Em roteiro: ${(pipeline.scripting || []).length}`,
    `Produção: ${(pipeline.production || []).length}`,
    `Em revisão: ${(pipeline.review || []).length}`,
    `Publicados: ${(pipeline.published || []).length}`,
    `Monetizados: ${(pipeline.monetized || []).length}`,
    `Receita TikTok: $${(tiktok.totalRevenue as number) || 0}`,
  ].join(" | ");

  // Recent activities (from activities.json if exists, else from API)
  let recentActivities = "Sem atividades recentes registradas.";
  const activitiesPath = path.join(DATA_DIR, "activities.json");
  if (fs.existsSync(activitiesPath)) {
    const activities = loadJson<Array<Record<string, unknown>>>(activitiesPath, []);
    const recent = activities.slice(0, 3);
    if (recent.length > 0) {
      recentActivities = recent
        .map((a) => `- [${a.status}] ${a.description}`)
        .join("\n");
    }
  }

  // Agent name
  const org = loadJson<OrgConfig>(path.join(DATA_DIR, "org-config.json"), {
    company: "SeedMoney",
    rotation: [],
    agents: [],
  });
  const agentConfig = org.agents.find((a) => a.id === agentId);
  const agentName = agentConfig ? `${agentConfig.emoji} ${agentConfig.name}` : agentId;

  return {
    agentId,
    agentName,
    nextAgentId,
    timestamp,
    goalTarget,
    currentRevenue,
    progressPercent,
    apiCostsToday,
    pendingTasks,
    unreadMemos: unreadMemosStr,
    tiktokStatus,
    recentActivities,
  };
}

// ── Build final prompt ────────────────────────────────────────────────────────
function buildPrompt(ctx: LoopContext): string {
  const prompts = loadJson<Record<string, unknown>>(
    path.join(DATA_DIR, "agent-system-prompts.json"),
    {}
  );

  const agentPrompts = (prompts.prompts as Record<string, Record<string, unknown>>)?.[ctx.agentId];
  if (!agentPrompts) {
    console.warn(`No system prompt found for agent '${ctx.agentId}', using generic.`);
  }

  const identity = agentPrompts?.identity || `Você é ${ctx.agentId} da SeedMoney.`;
  const mandate = agentPrompts?.mandate || "Faça o melhor pelo negócio.";
  const turnInstructions = Array.isArray(agentPrompts?.turn_instructions)
    ? (agentPrompts.turn_instructions as string[]).join("\n")
    : "";
  const personalityCue = agentPrompts?.personality_cue || "";
  const sharedContext = (prompts.sharedContext as string) || "";
  const apiBaseUrl = (prompts.apiBaseUrl as string) || "http://localhost:3000";

  return `${identity}

${sharedContext}

API Base: ${apiBaseUrl}

=== CONTEXTO DO TURNO ===
Data/Hora: ${ctx.timestamp}
Agente: ${ctx.agentName} (${ctx.agentId})
Próximo turno: ${ctx.nextAgentId} em ~15 minutos

=== ESTADO FINANCEIRO ===
Meta: $${ctx.goalTarget}
Receita atual: $${ctx.currentRevenue} (${ctx.progressPercent}%)
Custos API acumulados: $${ctx.apiCostsToday}

=== SUAS TASKS PENDENTES ===
${ctx.pendingTasks}

=== MEMOS NÃO LIDOS ===
${ctx.unreadMemos}

=== PIPELINE TIKTOK ===
${ctx.tiktokStatus}

=== ÚLTIMAS ATIVIDADES DA EMPRESA ===
${ctx.recentActivities}

=== SEU MANDATO AGORA ===
${mandate}

=== INSTRUÇÕES DO TURNO ===
${turnInstructions}

=== NOTA DE PERSONALIDADE ===
${personalityCue}

Boa sorte no turno. Produza pelo menos 1 output concreto (task, memo, doc, conteúdo, código).`;
}

// ── Log activity via API ──────────────────────────────────────────────────────
async function logActivity(
  agentId: string,
  description: string,
  status: "success" | "error" | "pending"
): Promise<void> {
  try {
    await fetch(`${MC_URL}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "task",
        description,
        status,
        agent: agentId,
        metadata: { source: "autonomous-loop" },
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal: activity logging failure should not stop the agent
  }
}

// ── Execute agent via openclaw ────────────────────────────────────────────────
function executeAgent(agentId: string, prompt: string): string {
  console.log(`\n[SeedMoney] Executing agent: ${agentId}`);
  console.log(`[SeedMoney] Command: openclaw agent run --agent ${agentId} --message "..."`);

  try {
    const output = execFileSync(
      "openclaw",
      ["agent", "run", "--agent", agentId, "--message", prompt],
      { timeout: 300_000, encoding: "utf-8" }
    );
    return output;
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const out = error.stdout || error.stderr || error.message || "Unknown error";
    throw new Error(`Agent execution failed:\n${out}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 SeedMoney Autonomous Loop — ${new Date().toISOString()}`);

  // Load org config
  const orgPath = path.join(DATA_DIR, "org-config.json");
  if (!fs.existsSync(orgPath)) {
    console.error("org-config.json not found. Run setup-autonomous.sh first.");
    process.exit(1);
  }
  const org = loadJson<OrgConfig>(orgPath, { company: "SeedMoney", rotation: [], agents: [] });

  // Determine who acts
  const { current: agentId, next: nextAgentId } = determineAgent(org);
  console.log(`\n🎯 Agent: ${agentId} | Next: ${nextAgentId}`);

  // Build context
  const ctx = await buildContext(agentId, nextAgentId);

  // Build prompt
  const prompt = buildPrompt(ctx);

  if (isDryRun) {
    console.log("\n─── DRY RUN — PROMPT ──────────────────────────────────────");
    console.log(prompt);
    console.log("──────────────────────────────────────────────────────────\n");
    console.log("[DRY RUN] Agent would execute with the prompt above.");
    return;
  }

  // Log start
  await logActivity(agentId, `Iniciando turno autônomo de ${agentId}`, "pending");

  // Execute
  const startTime = Date.now();
  try {
    const output = executeAgent(agentId, prompt);
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Agent ${agentId} completed in ${durationSec}s`);
    console.log("\n─── OUTPUT (first 500 chars) ───────────────────────────────");
    console.log(output.slice(0, 500));
    console.log("──────────────────────────────────────────────────────────\n");
    await logActivity(agentId, `Turno de ${agentId} concluído (${durationSec}s)`, "success");
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`\n❌ Agent ${agentId} failed:`, error.message);
    await logActivity(agentId, `Turno de ${agentId} falhou: ${error.message.slice(0, 200)}`, "error");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
