"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, Shield, BookOpen, UserPlus, X, ChevronRight } from "lucide-react";

interface AgentConfig {
  id: string;
  name: string;
  fullName: string;
  emoji: string;
  color: string;
  role: string;
  reportsTo: string | null;
  authority: string;
  responsibilities: string[];
  kpis: string[];
  personality: string;
  joinedAt: string;
  status: "active" | "terminated";
}

interface RotationEntry {
  agentId: string;
  slot: number;
  cronMinute: number;
  cronExpression: string;
}

interface HiringSlot {
  canHire: boolean;
  hiredAgentId: string | null;
  maxHires: number;
}

interface OrgData {
  company: string;
  tagline: string;
  mission: string;
  vision: string;
  culture: string[];
  rules: string[];
  rotation: RotationEntry[];
  hiringSlots: Record<string, HiringSlot>;
  maxAgents: number;
  agents: AgentConfig[];
  rotationStatus: {
    currentAgent: string | null;
    nextAgent: string | null;
    minutesUntilNext: number;
    lastUpdated: string;
  };
}

const ROLE_COLORS: Record<string, string> = {
  ceo: "#FF6B35",
  cmo: "#FF2D55",
  cfo: "#34C759",
  cto: "#007AFF",
};

function AgentCard({ agent, isNext, isCurrent, hiringSlot }: {
  agent: AgentConfig;
  isNext: boolean;
  isCurrent: boolean;
  hiringSlot?: HiringSlot;
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3 transition-all"
      style={{
        borderColor: isCurrent ? agent.color : isNext ? agent.color + "80" : "var(--border)",
        backgroundColor: isCurrent ? agent.color + "15" : "var(--surface)",
        boxShadow: isCurrent ? `0 0 0 2px ${agent.color}40` : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{agent.emoji}</span>
          <div>
            <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              {agent.name}
            </div>
            <div className="text-xs text-slate-500">{agent.fullName}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isCurrent && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: agent.color }}>
              ATIVO AGORA
            </span>
          )}
          {isNext && !isCurrent && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: agent.color, backgroundColor: agent.color + "20" }}>
              PRÓXIMO
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            a cada hora, :0{(ROLE_COLORS[agent.id] ? { ceo: "0", cmo: "15", cfo: "30", cto: "45" }[agent.id] : "??")}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 italic leading-relaxed">{agent.personality}</p>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 font-semibold">Responsabilidades</div>
        <ul className="space-y-1">
          {agent.responsibilities.slice(0, 3).map((r, i) => (
            <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: agent.color }} />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 font-semibold">KPIs</div>
        <div className="flex flex-wrap gap-1">
          {agent.kpis.map((kpi, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: agent.color + "20", color: agent.color }}>
              {kpi}
            </span>
          ))}
        </div>
      </div>

      {hiringSlot && hiringSlot.canHire && (
        <div className="mt-1 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          {hiringSlot.hiredAgentId ? (
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Contratou: <span className="font-semibold text-slate-700">{hiringSlot.hiredAgentId}</span>
            </div>
          ) : (
            <div className="text-xs flex items-center gap-1.5" style={{ color: agent.color }}>
              <UserPlus className="w-3 h-3" />
              Pode contratar 1 agente adicional
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgPage() {
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"team" | "culture" | "rules">("team");

  useEffect(() => {
    fetchOrg();
    const interval = setInterval(fetchOrg, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrg = async () => {
    try {
      const res = await fetch("/api/org");
      if (res.ok) setOrg(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Carregando organização...</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Org config não encontrada.</div>
      </div>
    );
  }

  const activeAgents = org.agents.filter((a) => a.status === "active");
  const { rotationStatus } = org;

  const rotationMinutes: Record<string, string> = { ceo: "00", cmo: "15", cfo: "30", cto: "45" };

  return (
    <div className="px-4 py-6 md:px-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">TenacitOS — Organização</div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{org.company}</h1>
        <p className="text-sm text-slate-500">{org.tagline}</p>
      </div>

      {/* Rotation status bar */}
      <div className="rounded-2xl border p-4 mb-6 flex flex-wrap gap-6 items-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Agente ativo</div>
          {rotationStatus.currentAgent ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{org.agents.find((a) => a.id === rotationStatus.currentAgent)?.emoji}</span>
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {org.agents.find((a) => a.id === rotationStatus.currentAgent)?.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          ) : (
            <span className="text-sm text-slate-500">—</span>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Próximo</div>
          {rotationStatus.nextAgent ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{org.agents.find((a) => a.id === rotationStatus.nextAgent)?.emoji}</span>
              <span className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                {org.agents.find((a) => a.id === rotationStatus.nextAgent)?.name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">—</span>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Em</div>
          <div className="font-mono text-sm font-bold" style={{ color: "var(--accent)" }}>
            {rotationStatus.minutesUntilNext}min
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Capacidade</div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {activeAgents.length} / {org.maxAgents} agentes
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--surface)" }}>
        {(["team", "culture", "rules"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "white" : "var(--text-secondary)",
            }}
          >
            {tab === "team" ? "Equipe" : tab === "culture" ? "Cultura" : "Regras"}
          </button>
        ))}
      </div>

      {activeTab === "team" && (
        <>
          {/* Org chart / agent grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {activeAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isCurrent={rotationStatus.currentAgent === agent.id}
                isNext={rotationStatus.nextAgent === agent.id}
                hiringSlot={org.hiringSlots[agent.id]}
              />
            ))}
          </div>

          {/* Rotation timeline */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Rodízio de 15 minutos (por hora)
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {org.rotation
                .filter((r) => activeAgents.find((a) => a.id === r.agentId))
                .sort((a, b) => a.cronMinute - b.cronMinute)
                .map((slot, i, arr) => {
                  const agent = activeAgents.find((a) => a.id === slot.agentId);
                  if (!agent) return null;
                  const isActive = rotationStatus.currentAgent === slot.agentId;
                  return (
                    <div key={slot.agentId} className="flex items-center gap-2 shrink-0">
                      <div
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-center"
                        style={{
                          backgroundColor: isActive ? agent.color + "20" : "var(--surface-hover)",
                          border: `1px solid ${isActive ? agent.color : "var(--border)"}`,
                          minWidth: "80px",
                        }}
                      >
                        <span className="text-xl">{agent.emoji}</span>
                        <span className="text-xs font-bold" style={{ color: isActive ? agent.color : "var(--text-secondary)" }}>
                          {agent.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">:{slot.cronMinute.toString().padStart(2, "0")}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="text-slate-400 text-xs font-mono">→ 15m →</div>
                      )}
                    </div>
                  );
                })}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-slate-400 text-xs font-mono">→ repete...</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "culture" && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Missão</div>
            <p className="text-base font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>{org.mission}</p>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Visão</div>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{org.vision}</p>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Valores & Cultura
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {org.culture.map((value, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--surface-hover)" }}>
                  <span className="text-lg">{["⚡", "💰", "👁️", "🤖", "📚", "🤝"][i % 6]}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "rules" && (
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Regras Constitucionais
          </div>
          <ol className="space-y-3">
            {org.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--accent)", color: "white" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
