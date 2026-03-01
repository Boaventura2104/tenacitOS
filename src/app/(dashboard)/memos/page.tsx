"use client";

import { useEffect, useState } from "react";
import { Send, Mail, MailOpen, AlertCircle, Clock, Filter } from "lucide-react";

interface Memo {
  id: string;
  from: string;
  fromType: "agent" | "human";
  to: string;
  subject: string;
  content: string;
  priority: "normal" | "urgent" | "low";
  read: boolean;
  actionRequired: boolean;
  tags: string[];
  timestamp: string;
  readAt?: string;
}

const AGENT_EMOJIS: Record<string, string> = {
  ceo: "👔",
  cmo: "🎬",
  cfo: "💰",
  cto: "⚙️",
  all: "📢",
};

const PRIORITY_STYLES = {
  urgent: { bg: "#FF3B3020", color: "#FF3B30", label: "URGENTE" },
  normal: { bg: "var(--surface-hover)", color: "var(--text-secondary)", label: "NORMAL" },
  low: { bg: "var(--surface-hover)", color: "#8E8E93", label: "LOW" },
};

function MemoCard({ memo, onMarkRead }: { memo: Memo; onMarkRead: (id: string) => void }) {
  const priorityStyle = PRIORITY_STYLES[memo.priority];

  return (
    <div
      className="rounded-xl border p-4 transition-all"
      style={{
        borderColor: !memo.read ? "var(--accent)" : "var(--border)",
        backgroundColor: !memo.read ? "var(--accent)08" : "var(--surface)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{AGENT_EMOJIS[memo.from] || "🤖"}</span>
          <div>
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {memo.from}
            </span>
            <span className="text-slate-500 text-xs mx-1.5">→</span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {AGENT_EMOJIS[memo.to] || ""} {memo.to}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {memo.actionRequired && (
            <AlertCircle className="w-4 h-4" style={{ color: "#FF9500" }} />
          )}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color }}
          >
            {priorityStyle.label}
          </span>
          {!memo.read ? (
            <Mail className="w-4 h-4" style={{ color: "var(--accent)" }} />
          ) : (
            <MailOpen className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      <div className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
        {memo.subject}
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
        {memo.content}
      </p>

      {memo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {memo.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(memo.timestamp).toLocaleString("pt-BR")}
        </span>
        {!memo.read && (
          <button
            onClick={() => onMarkRead(memo.id)}
            className="text-[11px] font-medium px-3 py-1 rounded-lg transition-all"
            style={{ backgroundColor: "var(--surface-hover)", color: "var(--text-secondary)" }}
          >
            Marcar como lido
          </button>
        )}
      </div>
    </div>
  );
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    from: "human:admin",
    to: "all",
    subject: "",
    content: "",
    priority: "normal",
    actionRequired: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMemos();
    const interval = setInterval(fetchMemos, 20000);
    return () => clearInterval(interval);
  }, [filterAgent, showUnreadOnly]);

  const fetchMemos = async () => {
    try {
      const params = new URLSearchParams();
      if (filterAgent !== "all") params.set("agent", filterAgent);
      if (showUnreadOnly) params.set("read", "false");
      params.set("limit", "100");

      const res = await fetch(`/api/memos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMemos(data.memos);
        setUnreadCount(data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await fetch("/api/memos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    fetchMemos();
  };

  const markAllRead = async () => {
    await fetch("/api/memos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead", agent: filterAgent === "all" ? undefined : filterAgent }),
    });
    fetchMemos();
  };

  const sendMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.content) return;
    setSubmitting(true);
    try {
      await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fromType: "human" }),
      });
      setForm({ from: "human:admin", to: "all", subject: "", content: "", priority: "normal", actionRequired: false });
      setShowForm(false);
      fetchMemos();
    } finally {
      setSubmitting(false);
    }
  };

  const agents = ["all", "ceo", "cmo", "cfo", "cto"];

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">TenacitOS — Memos</div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Comunicação Interna
            {unreadCount > 0 && (
              <span className="ml-3 text-lg font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: "var(--accent)" }}>
                {unreadCount} não lidos
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Memos entre agentes e com humanos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Send className="w-4 h-4" />
          Novo Memo
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--accent)", backgroundColor: "var(--surface)" }}>
          <h3 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-primary)" }}>Novo Memo</h3>
          <form onSubmit={sendMemo} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">De</label>
                <input
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Para</label>
                <select
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
                >
                  <option value="all">📢 Todos</option>
                  <option value="ceo">👔 CEO</option>
                  <option value="cmo">🎬 CMO</option>
                  <option value="cfo">💰 CFO</option>
                  <option value="cto">⚙️ CTO</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Assunto"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
              required
            />
            <textarea
              placeholder="Conteúdo do memo... Use @ceo, @cmo, @cfo, @cto para mencionar"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
              required
            />
            <div className="flex items-center gap-4">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)" }}
              >
                <option value="low">🟢 Baixa prioridade</option>
                <option value="normal">🟡 Normal</option>
                <option value="urgent">🔴 URGENTE</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={form.actionRequired}
                  onChange={(e) => setForm({ ...form, actionRequired: e.target.checked })}
                />
                Requer ação
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {submitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
          {agents.map((a) => (
            <button
              key={a}
              onClick={() => setFilterAgent(a)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: filterAgent === a ? "var(--accent)" : "transparent",
                color: filterAgent === a ? "white" : "var(--text-secondary)",
              }}
            >
              {AGENT_EMOJIS[a]} {a === "all" ? "Todos" : a.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            backgroundColor: showUnreadOnly ? "var(--accent)20" : "var(--surface)",
            color: showUnreadOnly ? "var(--accent)" : "var(--text-secondary)",
            border: `1px solid ${showUnreadOnly ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <Filter className="w-3 h-3" />
          Não lidos
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium px-3 py-1.5 rounded-xl"
            style={{ color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
          >
            Marcar todos como lidos
          </button>
        )}
      </div>

      {/* Memos list */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Carregando memos...</div>
      ) : memos.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div className="text-slate-500 text-sm">Nenhum memo encontrado.</div>
          <div className="text-slate-400 text-xs mt-1">Os agentes enviam memos automaticamente durante seus turnos.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((memo) => (
            <MemoCard key={memo.id} memo={memo} onMarkRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
