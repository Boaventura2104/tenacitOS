"use client";

import Link from "next/link";
import { Calendar, CheckSquare, Clock4, FileText, Users } from "lucide-react";

const columns = [
  { id: "backlog", title: "Backlog", color: "#a78bfa" },
  { id: "planning", title: "Planejamento", color: "#60a5fa" },
  { id: "in-progress", title: "Em andamento", color: "#f59e0b" },
  { id: "review", title: "Revisão", color: "#34d399" },
  { id: "done", title: "Entregue", color: "#4ade80" },
];

const tasks = [
  {
    id: "tik-landing",
    title: "Criar mini jornada TikTok + CTA",
    status: "backlog",
    priority: "High",
    owner: "Product Ops",
    description: "Definir roteiro em 3 atos, link para testemos e doc://notepad/tikkanban",
    doc: "doc://notepad/kanban-playbook",
    eta: "Hoje 14h"
  },
  {
    id: "hook-labs",
    title: "Testar 3 hooks criativos",
    status: "planning",
    priority: "Medium",
    owner: "Design",
    description: "Produzir 3 cenas de 15s priorizando loops (+ CTA) e documentar resultados.",
    doc: "https://mission-control/notes/hooks",
    eta: "Hoje 15h"
  },
  {
    id: "dev-mc",
    title: "Automatizar CTA na home",
    status: "in-progress",
    priority: "High",
    owner: "Dev",
    description: "Conectar evento do Growth ao board e publicar release note.",
    doc: "doc://notepad/mission-control-evolution",
    eta: "Hoje 16h"
  },
  {
    id: "rev-tracking",
    title: "Registrar boletim financeiro (US$50)",
    status: "in-progress",
    priority: "High",
    owner: "Finance",
    description: "Consolidar recebimentos, atualizar planilha paypal/stripe e upar no Activity Feed.",
    doc: "doc://spreadsheets/bootstrap-budget",
    eta: "Hoje 17h"
  },
  {
    id: "tiktok-launch",
    title: "Pós-lançamento: follow-up com leads",
    status: "review",
    priority: "Medium",
    owner: "Growth",
    description: "Responder comentários, lançar CTA no story e medir conversão.",
    doc: "doc://notepad/tiktok-feedback",
    eta: "Hoje 18h"
  },
  {
    id: "ops-queue",
    title: "Desbloquear queue de envios",
    status: "review",
    priority: "Medium",
    owner: "OpsSupport",
    description: "Resolver filas de mensagens e enviar script de follow-up.",
    doc: "doc://memory/queue",
    eta: "Hoje 18h"
  },
  {
    id: "kanban-docs",
    title: "Documentar threads e menções",
    status: "done",
    priority: "Low",
    owner: "Community",
    description: "Resumir andamento, marcar quem precisa responder e atualizar o Notepad.",
    doc: "doc://notepad/kanban-report",
    eta: "Hoje 13h"
  }
];

const columnTasks = columns.map((column) => ({
  ...column,
  tasks: tasks.filter((task) => task.status === column.id),
}));

function TaskCard({ task }: { task: (typeof tasks)[number] }) {
  return (
    <div
      className="bg-white/80 dark:bg-black/60 border border-black/5 dark:border-white/10 rounded-xl p-4 shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">{task.priority}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3" style={{ minHeight: "48px" }}>
        {task.description}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          <Users className="inline-block w-3 h-3 mr-1" />
          {task.owner}
        </div>
        <div>
          <Calendar className="inline-block w-3 h-3 mr-1" />
          {task.eta}
        </div>
      </div>
      <Link
        href={task.doc}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300"
      >
        <FileText className="w-3 h-3" />
        Ver documento
      </Link>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">TenacitOS — Kanban autônomo</div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Startup TikTok</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Agentes intercalados rodando a cada vinte minutos, pipelines de monetização e threads conectadas ao Mission Control. Clique numa task para ver o history e o notepad associado.
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-4 mb-6">
        {[
          { label: "Meta de R$50", icon: CheckSquare },
          { label: "Pulsos a cada 15m", icon: Clock4 },
          { label: "Acesso notepad + docs", icon: FileText },
          { label: "Equipe live", icon: Users },
        ].map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700"
          >
            <Icon className="w-3 h-3" />
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {columnTasks.map((column) => (
          <div key={column.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-600">
              <span>{column.title}</span>
              <span>{column.tasks.length}</span>
            </div>
            <div className="space-y-3">
              {column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {column.tasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500">
                  Nenhuma task nesta coluna
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 flex flex-col gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Use o link <Link href="/kanban" className="text-slate-900 dark:text-white underline">/kanban</Link> para compartilhar com o time e abra o Mission Control para ver o Activity Feed e os documentos conectados.
        </p>
        <p className="text-xs text-slate-500">Kanban atualizado a partir das rotinas e cron jobs que operam de 15 em 15 minutos.</p>
      </div>
    </div>
  );
}
