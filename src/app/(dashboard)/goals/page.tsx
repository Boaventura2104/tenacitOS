"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Target, CheckCircle, Circle, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Milestone {
  id: string;
  amount: number;
  label: string;
  reached: boolean;
  reachedAt: string | null;
}

interface RevenueSource {
  total: number;
  label: string;
  color: string;
  active: boolean;
}

interface RevenueEvent {
  id: string;
  timestamp: string;
  amount: number;
  source: string;
  description: string;
  agentId: string;
}

interface GoalsData {
  bootstrapGoal: {
    id: string;
    name: string;
    description: string;
    targetAmount: number;
    currentRevenue: number;
    progressPercent: number;
    remaining: number;
    milestones: Milestone[];
    status: string;
  };
  revenueSources: Record<string, RevenueSource>;
  revenueLog: RevenueEvent[];
  totalRevenue: number;
  totalApiCosts: number;
  netProfit: number;
}

const SOURCE_LABELS: Record<string, string> = {
  tiktok_creator_fund: "TikTok Creator Fund",
  affiliate: "Afiliados",
  tiktok_shop: "TikTok Shop",
  sponsorship: "Patrocínios",
  other: "Outros",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [revenueForm, setRevenueForm] = useState({ amount: "", source: "tiktok_creator_fund", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
    const interval = setInterval(fetchGoals, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) setGoals(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revenueForm.amount || Number(revenueForm.amount) <= 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(revenueForm.amount),
          source: revenueForm.source,
          description: revenueForm.description,
          agentId: "human:admin",
        }),
      });
      setRevenueForm({ amount: "", source: "tiktok_creator_fund", description: "" });
      setShowRevenueForm(false);
      fetchGoals();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Carregando metas...</div>;
  }

  if (!goals) {
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Erro ao carregar metas.</div>;
  }

  const { bootstrapGoal, revenueSources, revenueLog } = goals;

  const pieData = Object.entries(revenueSources)
    .filter(([, v]) => v.total > 0)
    .map(([k, v]) => ({ name: v.label, value: v.total, color: v.color }));

  const barData = Object.entries(revenueSources).map(([k, v]) => ({
    name: v.label.split(" ")[0],
    receita: v.total,
    fill: v.color,
  }));

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">TenacitOS — Metas Financeiras</div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Meta de ${bootstrapGoal.targetAmount}</h1>
          <p className="text-sm text-slate-500 mt-1">{bootstrapGoal.description}</p>
        </div>
        <button
          onClick={() => setShowRevenueForm(!showRevenueForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="w-4 h-4" />
          Registrar Receita
        </button>
      </div>

      {/* Revenue form */}
      {showRevenueForm && (
        <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--accent)", backgroundColor: "var(--surface)" }}>
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-primary)" }}>Registrar nova receita</h3>
          <form onSubmit={logRevenue} className="flex flex-wrap gap-3">
            <input
              type="number"
              placeholder="Valor em USD"
              value={revenueForm.amount}
              onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm w-36"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
              step="0.01"
              min="0"
              required
            />
            <select
              value={revenueForm.source}
              onChange={(e) => setRevenueForm({ ...revenueForm, source: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
            >
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={revenueForm.description}
              onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>
      )}

      {/* Bootstrap goal progress */}
      <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Progresso</div>
            <div className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
              ${bootstrapGoal.currentRevenue.toFixed(2)}
              <span className="text-lg text-slate-500 ml-2">/ ${bootstrapGoal.targetAmount}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: bootstrapGoal.progressPercent >= 100 ? "#34C759" : "var(--accent)" }}>
              {bootstrapGoal.progressPercent}%
            </div>
            <div className="text-sm text-slate-500">Faltam ${bootstrapGoal.remaining.toFixed(2)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-6 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "var(--surface-hover)" }}>
          <div
            className="h-full rounded-full transition-all duration-700 relative"
            style={{
              width: `${bootstrapGoal.progressPercent}%`,
              background: "linear-gradient(90deg, #FF6B35, #FF2D55, #34C759)",
            }}
          >
            {bootstrapGoal.progressPercent > 10 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                {bootstrapGoal.progressPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="flex flex-wrap gap-3">
          {bootstrapGoal.milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{
                backgroundColor: m.reached ? "#34C75920" : "var(--surface-hover)",
                border: `1px solid ${m.reached ? "#34C759" : "var(--border)"}`,
              }}
            >
              {m.reached ? (
                <CheckCircle className="w-4 h-4" style={{ color: "#34C759" }} />
              ) : (
                <Circle className="w-4 h-4 text-slate-400" />
              )}
              <span className="font-semibold" style={{ color: m.reached ? "#34C759" : "var(--text-primary)" }}>
                ${m.amount}
              </span>
              <span className="text-slate-500 text-xs">{m.label.split("—")[1]?.trim() || m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Receita Total", value: `$${goals.totalRevenue.toFixed(2)}`, color: "#34C759", icon: TrendingUp },
          { label: "Custo de API", value: `$${goals.totalApiCosts.toFixed(2)}`, color: "#FF9500", icon: DollarSign },
          { label: "Lucro Líquido", value: `$${goals.netProfit.toFixed(2)}`, color: goals.netProfit >= 0 ? "#34C759" : "#FF3B30", icon: Target },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue by source */}
      {pieData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold">Receita por Fonte</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: $${value.toFixed(2)}`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold">Comparação de Canais</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Bar dataKey="receita" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border p-8 text-center mb-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <DollarSign className="w-8 h-8 mx-auto mb-3 text-slate-400" />
          <div className="text-slate-500 text-sm">Nenhuma receita registrada ainda.</div>
          <div className="text-slate-400 text-xs mt-1">Os agentes vão registrar receita automaticamente conforme monetizam.</div>
        </div>
      )}

      {/* Revenue log */}
      {revenueLog.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold">Histórico de Receitas</div>
          <div className="space-y-2">
            {revenueLog.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {SOURCE_LABELS[event.source] || event.source}
                  </div>
                  {event.description && <div className="text-xs text-slate-500">{event.description}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm" style={{ color: "#34C759" }}>+${event.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
