"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, X, Send, Bell, BellOff, FileText, Film, Users,
  Calendar, MessageSquare, AtSign,
} from "lucide-react";

// ---- Types ----
interface ThreadMessage {
  id: string;
  author: string;
  authorType: "agent" | "human";
  content: string;
  timestamp: string;
  mentions: string[];
  attachments: string[];
}

interface TaskDoc {
  id: string;
  name: string;
  content?: string;
  path?: string;
  createdBy: string;
  createdAt: string;
}

interface TaskMedia {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "file";
  createdBy: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "planning" | "in-progress" | "review" | "done" | "blocked";
  priority: "Low" | "Medium" | "High" | "Critical";
  owner: string;
  tags: string[];
  subscribers: string[];
  thread: ThreadMessage[];
  docs: TaskDoc[];
  media: TaskMedia[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
}

// ---- Constants ----
const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "#a78bfa" },
  { id: "planning", title: "Planejamento", color: "#60a5fa" },
  { id: "in-progress", title: "Em andamento", color: "#f59e0b" },
  { id: "review", title: "Revisão", color: "#34d399" },
  { id: "done", title: "Entregue", color: "#4ade80" },
  { id: "blocked", title: "Bloqueado", color: "#f87171" },
] as const;

const AGENT_EMOJIS: Record<string, string> = {
  jobs: "🍎",
  ogilvy: "🎨",
  buffett: "📈",
  turing: "🔬",
  "human:admin": "🧑‍💻",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#FF3B30",
  High: "#FF9500",
  Medium: "#FFCC00",
  Low: "#34C759",
};

// ---- Helper: Render @mentions ----
function RenderMentions({ content }: { content: string }) {
  const parts = content.split(/(@[\w:]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span
            key={i}
            className="font-semibold px-1 rounded"
            style={{ color: "var(--accent)", backgroundColor: "var(--accent)15" }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ---- Task Detail Drawer ----
function TaskDrawer({
  task,
  onClose,
  onStatusChange,
  onSubscribe,
  onThreadPost,
  isSubscribed,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (status: Task["status"]) => void;
  onSubscribe: () => void;
  onThreadPost: (content: string) => Promise<void>;
  isSubscribed: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"thread" | "overview" | "docs" | "media">("thread");
  const [threadInput, setThreadInput] = useState("");
  const [posting, setPosting] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "thread") {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [task.thread, activeTab]);

  const submitThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim()) return;
    setPosting(true);
    try {
      await onThreadPost(threadInput);
      setThreadInput("");
    } finally {
      setPosting(false);
    }
  };

  const priorityColor = PRIORITY_COLORS[task.priority] || "#999";

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ pointerEvents: "all" }}
    >
      <div
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />
      <div
        className="w-full max-w-lg h-full overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 p-4 border-b flex items-start gap-3 shrink-0"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: priorityColor + "20", color: priorityColor }}
              >
                {task.priority}
              </span>
              <span className="text-xs text-slate-500 truncate">#{task.id}</span>
            </div>
            <h2 className="font-bold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
              {task.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSubscribe}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: isSubscribed ? "var(--accent)20" : "var(--surface-hover)",
                color: isSubscribed ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {isSubscribed ? "Assinado" : "Assinar"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div
          className="px-4 py-3 border-b flex flex-wrap gap-4 text-xs shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Dono</span>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {AGENT_EMOJIS[task.owner] || "🤖"} {task.owner}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status</span>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as Task["status"])}
              className="border rounded px-1.5 py-0.5 text-xs font-semibold"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
              }}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span style={{ color: "var(--text-secondary)" }}>
                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-slate-500" />
            <span style={{ color: "var(--text-secondary)" }}>{task.subscribers.length} assinantes</span>
          </div>
        </div>

        {/* Subscribers */}
        {task.subscribers.length > 0 && (
          <div
            className="px-4 py-2 flex flex-wrap gap-1.5 border-b shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            {task.subscribers.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--surface-hover)", color: "var(--text-secondary)" }}
              >
                {AGENT_EMOJIS[s] || "👤"} {s}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b px-4 shrink-0" style={{ borderColor: "var(--border)" }}>
          {(["thread", "overview", "docs", "media"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-3 text-xs font-semibold border-b-2 transition-all -mb-px"
              style={{
                borderBottomColor: activeTab === tab ? "var(--accent)" : "transparent",
                color: activeTab === tab ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {tab === "thread" && (
                <><MessageSquare className="w-3 h-3 inline mr-1" />Thread ({task.thread.length})</>
              )}
              {tab === "overview" && "Overview"}
              {tab === "docs" && (
                <><FileText className="w-3 h-3 inline mr-1" />Docs ({task.docs.length})</>
              )}
              {tab === "media" && (
                <><Film className="w-3 h-3 inline mr-1" />Mídia ({task.media.length})</>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "overview" && (
            <div className="p-4 space-y-4">
              {task.description && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Descrição</div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {task.description}
                  </p>
                </div>
              )}
              {task.tags.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Timeline</div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Criado por {task.createdBy} em {new Date(task.createdAt).toLocaleString("pt-BR")}</div>
                  <div>Atualizado: {new Date(task.updatedAt).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "thread" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {task.thread.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="text-sm text-slate-500">Nenhuma mensagem ainda.</div>
                    <div className="text-xs text-slate-400 mt-1">Inicie a conversa abaixo.</div>
                  </div>
                ) : (
                  task.thread.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: "var(--surface-hover)" }}
                      >
                        {AGENT_EMOJIS[msg.author] || (msg.authorType === "human" ? "🧑" : "🤖")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                            {msg.author}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.timestamp).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div
                          className="text-sm leading-relaxed"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <RenderMentions content={msg.content} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>

              <div
                className="p-4 border-t shrink-0"
                style={{ borderColor: "var(--border)" }}
              >
                <form onSubmit={submitThread} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mensagem... @jobs @ogilvy @buffett @turing"
                    value={threadInput}
                    onChange={(e) => setThreadInput(e.target.value)}
                    className="flex-1 border rounded-xl px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface-elevated)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={posting || !threadInput.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  Mencione: @jobs @ogilvy @buffett @turing @human:admin
                </div>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="p-4">
              {task.docs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="text-sm text-slate-500">Nenhum documento anexado.</div>
                  <div className="text-xs text-slate-400 mt-1">Agentes adicionam docs automaticamente.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {task.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-xl border p-4"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" style={{ color: "var(--accent)" }} />
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {doc.name}
                        </span>
                      </div>
                      {doc.content && (
                        <pre
                          className="text-xs whitespace-pre-wrap leading-relaxed"
                          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                        >
                          {doc.content}
                        </pre>
                      )}
                      <div className="text-[10px] text-slate-400 mt-2">
                        Por {doc.createdBy} · {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div className="p-4">
              {task.media.length === 0 ? (
                <div className="text-center py-8">
                  <Film className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="text-sm text-slate-500">Nenhuma mídia anexada.</div>
                  <div className="text-xs text-slate-400 mt-1">Agentes adicionam mídia gerada aqui.</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {task.media.map((m) => (
                    <div key={m.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      {m.type === "image" && (
                        <img src={m.url} alt={m.name} className="w-full h-32 object-cover" />
                      )}
                      {m.type === "video" && (
                        <video src={m.url} className="w-full h-32 object-cover" controls />
                      )}
                      <div className="p-2 text-xs text-slate-500">{m.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Task Card ----
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const priorityColor = PRIORITY_COLORS[task.priority] || "#999";

  return (
    <div
      onClick={onClick}
      className="rounded-xl border p-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-start justify-between mb-2 gap-1">
        <div className="font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
          {task.title}
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: priorityColor + "20", color: priorityColor }}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
        <span>
          {AGENT_EMOJIS[task.owner] || "🤖"} {task.owner}
        </span>
        <div className="flex items-center gap-2">
          {task.subscribers.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />{task.subscribers.length}
            </span>
          )}
          {task.thread.length > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" />{task.thread.length}
            </span>
          )}
          {task.docs.length > 0 && (
            <span className="flex items-center gap-0.5">
              <FileText className="w-3 h-3" />{task.docs.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- New Task Modal ----
function NewTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "backlog",
    priority: "Medium",
    owner: "jobs",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          createdBy: "human:admin",
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Nova Task</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            placeholder="Título da task"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-primary)",
            }}
            required
          />
          <textarea
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-primary)",
            }}
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border rounded-lg px-2 py-2 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
              }}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="border rounded-lg px-2 py-2 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
              }}
            >
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              className="border rounded-lg px-2 py-2 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-primary)",
              }}
            >
              {["jobs", "ogilvy", "buffett", "turing"].map((a) => (
                <option key={a} value={a}>
                  {AGENT_EMOJIS[a]} {a}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Tags (separadas por vírgula)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {submitting ? "Criando..." : "Criar Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Mentions View ----
function MentionsView() {
  const [mentions, setMentions] = useState<
    Array<{
      id: string;
      source: string;
      sourceId: string;
      sourceTitle: string;
      from: string;
      content: string;
      timestamp: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentions?agent=human:admin&limit=50")
      .then((r) => r.json())
      .then((d) => setMentions(d.mentions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Carregando menções...</div>;
  }

  if (mentions.length === 0) {
    return (
      <div className="text-center py-12">
        <AtSign className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <div className="text-slate-500 text-sm">Nenhuma menção ainda.</div>
        <div className="text-slate-400 text-xs mt-1">
          Quando agentes mencionarem @human:admin você verá aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-3">
      {mentions.map((m) => (
        <div
          key={m.id}
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {AGENT_EMOJIS[m.from] || "🤖"} {m.from}
              </span>
              <span className="text-xs text-slate-500">mencionou você</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {new Date(m.timestamp).toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="text-xs text-slate-500 mb-2">
            {m.source === "task_thread" ? "📋" : "📝"} {m.sourceTitle}
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <RenderMentions content={m.content} />
          </p>
        </div>
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "mentions">("board");

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks?limit=200");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        if (selectedTask) {
          const updated = data.tasks.find((t: Task) => t.id === selectedTask.id);
          if (updated) setSelectedTask(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    });
    fetchTasks();
  };

  const handleSubscribe = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "human:admin" }),
    });
    fetchTasks();
  };

  const handleThreadPost = async (taskId: string, content: string) => {
    await fetch(`/api/tasks/${taskId}/thread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: "human:admin",
        authorType: "human",
        content,
      }),
    });
    fetchTasks();
  };

  const columnTasks = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.id),
  }));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
            SeedMoneyOS — Kanban
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            SeedMoney
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {doneTasks}/{totalTasks} tasks concluídas
            {blockedTasks > 0 && (
              <span className="ml-2 text-red-500 font-medium">· {blockedTasks} bloqueadas</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            {(["board", "mentions"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === v ? "var(--accent)" : "transparent",
                  color: viewMode === v ? "white" : "var(--text-secondary)",
                }}
              >
                {v === "board" ? "Board" : "@Menções"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus className="w-4 h-4" />
            Nova Task
          </button>
        </div>
      </div>

      {/* Agent badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "Jobs (CEO)", emoji: "🍎" },
          { label: "Ogilvy (CMO)", emoji: "🎨" },
          { label: "Buffett (CFO)", emoji: "📈" },
          { label: "Turing (CTO)", emoji: "🔬" },
        ].map(({ label, emoji }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {emoji} {label}
          </span>
        ))}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          ⏱️ Pulsos 15min
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          💰 Meta $50
        </span>
      </div>

      {viewMode === "board" && (
        loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Carregando tasks...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {columnTasks.map((col) => (
              <div key={col.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: col.color }}
                  >
                    {col.title}
                  </span>
                  <span
                    className="text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: col.color + "20", color: col.color }}
                  >
                    {col.tasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {col.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                  {col.tasks.length === 0 && (
                    <div
                      className="rounded-xl border border-dashed p-3 text-xs text-slate-500 text-center"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {viewMode === "mentions" && <MentionsView />}

      {/* Task drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={(status) => {
            handleStatusChange(selectedTask.id, status);
          }}
          onSubscribe={() => handleSubscribe(selectedTask.id)}
          onThreadPost={(content) => handleThreadPost(selectedTask.id, content)}
          isSubscribed={selectedTask.subscribers.includes("human:admin")}
        />
      )}

      {/* New task modal */}
      {showNewTask && (
        <NewTaskModal
          onClose={() => setShowNewTask(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}
