"use client";

import { useEffect, useState } from "react";
import { Play, ArrowRight, TrendingUp, Eye, DollarSign, Plus, Film } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  niche: string;
  strategy: string;
  hook: string;
  format: string;
  estimatedViews: number;
  addedBy: string;
  addedAt: string;
  views?: number;
  revenue?: number;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  totalRevenue: number;
}

interface TikTokData {
  account: {
    username: string | null;
    followers: number;
    following: number;
    likes: number;
    videos: number;
    connectedAt: string | null;
  };
  strategies: Record<string, Strategy>;
  pipeline: Record<string, ContentItem[]>;
  pipelineCounts: Record<string, number>;
  totalViews: number;
  totalRevenue: number;
  publishedContent: ContentItem[];
}

const STAGES = [
  { id: "idea", label: "Ideias", emoji: "💡", color: "#AF52DE" },
  { id: "scripting", label: "Roteiro", emoji: "📝", color: "#FF9500" },
  { id: "production", label: "Produção", emoji: "🎬", color: "#007AFF" },
  { id: "review", label: "Revisão", emoji: "👁️", color: "#FF6B35" },
  { id: "published", label: "Publicado", emoji: "🚀", color: "#34C759" },
  { id: "monetized", label: "Monetizado", emoji: "💰", color: "#FFCC00" },
];

const NICHE_LABELS: Record<string, string> = {
  finance: "Finanças",
  productivity: "Produtividade",
  tech: "Tecnologia",
};

const STRATEGY_LABELS: Record<string, string> = {
  creator_fund: "Creator Fund",
  affiliate: "Afiliado",
  tiktok_shop: "TikTok Shop",
};

function ContentCard({ item, onAdvance }: { item: ContentItem; onAdvance?: () => void }) {
  return (
    <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}>
      <div className="font-semibold mb-1 leading-snug" style={{ color: "var(--text-primary)" }}>
        {item.title}
      </div>
      {item.hook && (
        <div className="text-xs text-slate-500 italic mb-2 leading-relaxed">"{item.hook}"</div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
          {NICHE_LABELS[item.niche] || item.niche}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
          {STRATEGY_LABELS[item.strategy] || item.strategy}
        </span>
        {item.format && item.format !== "unknown" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {item.format}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>by {item.addedBy}</span>
        {item.estimatedViews > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            ~{item.estimatedViews.toLocaleString()}
          </span>
        )}
        {item.views !== undefined && (
          <span className="flex items-center gap-1 font-semibold text-green-600">
            <Eye className="w-3 h-3" />
            {item.views.toLocaleString()}
          </span>
        )}
        {item.revenue !== undefined && item.revenue > 0 && (
          <span className="font-bold" style={{ color: "#FFCC00" }}>${item.revenue.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}

export default function TikTokPage() {
  const [data, setData] = useState<TikTokData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/tiktok");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Carregando pipeline TikTok...</div>;
  }
  if (!data) {
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Erro ao carregar.</div>;
  }

  const totalInPipeline = Object.values(data.pipelineCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">TenacitOS — Pipeline TikTok</div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>TikTok Startup</h1>
        <p className="text-sm text-slate-500 mt-1">Pipeline de conteúdo e estratégias de monetização</p>
      </div>

      {/* Account + Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Seguidores", value: data.account.followers.toLocaleString(), icon: "👥" },
          { label: "Views Totais", value: data.totalViews.toLocaleString(), icon: "👁️" },
          { label: "No Pipeline", value: totalInPipeline, icon: "📋" },
          { label: "Receita TikTok", value: `$${data.totalRevenue.toFixed(2)}`, icon: "💰" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Strategies */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold">Estratégias Ativas</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.values(data.strategies).map((strategy) => (
            <div
              key={strategy.id}
              className="rounded-xl border p-4"
              style={{
                borderColor: strategy.active ? "var(--accent)" : "var(--border)",
                backgroundColor: strategy.active ? "var(--accent)10" : "var(--surface-hover)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{strategy.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: strategy.active ? "#34C75920" : "#6666661A",
                    color: strategy.active ? "#34C759" : "#666",
                  }}
                >
                  {strategy.active ? "ATIVA" : "INATIVA"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{strategy.description}</p>
              <div className="font-bold text-sm" style={{ color: "#34C759" }}>
                ${strategy.totalRevenue.toFixed(2)} gerados
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-semibold">Pipeline de Conteúdo</div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 240}px` }}>
          {STAGES.map((stage) => {
            const items = data.pipeline[stage.id] || [];
            return (
              <div key={stage.id} className="flex flex-col gap-2" style={{ width: "220px", minWidth: "220px" }}>
                <div className="flex items-center justify-between px-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span>{stage.emoji}</span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: stage.color }}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: stage.color + "20", color: stage.color }}
                  >
                    {items.length}
                  </span>
                </div>
                <div
                  className="rounded-xl border p-2 flex flex-col gap-2 min-h-[160px]"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                >
                  {items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                  {items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-slate-400">Nenhum conteúdo</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account not connected warning */}
      {!data.account.connectedAt && (
        <div
          className="mt-6 rounded-2xl border border-dashed p-6 text-center"
          style={{ borderColor: "#FF9500", backgroundColor: "#FF950010" }}
        >
          <Film className="w-8 h-8 mx-auto mb-3" style={{ color: "#FF9500" }} />
          <div className="font-semibold text-sm mb-1" style={{ color: "#FF9500" }}>
            Conta TikTok não conectada
          </div>
          <div className="text-xs text-slate-500">
            O CTO precisa integrar a TikTok API para publicação automática. Crie uma task para o CTO via /kanban.
          </div>
        </div>
      )}
    </div>
  );
}
