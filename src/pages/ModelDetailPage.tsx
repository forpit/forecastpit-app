import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ModelData {
  id: string;
  display_name: string;
  provider: string;
  color: string;
  agent_id: string;
  cash_balance: number;
  total_value: number;
  positions_value: number;
  pnl_percent: number;
  wins: number;
  losses: number;
  win_rate: number | null;
}

interface Position {
  id: string;
  side: string;
  shares: number;
  avg_entry_price: number;
  total_cost: number;
  current_value: number;
  unrealized_pnl: number;
  market_question: string;
  market_slug: string;
}

interface Trade {
  id: string;
  side: string;
  shares: number;
  price: number;
  total_amount: number;
  executed_at: string;
  market_question: string;
  market_slug: string;
  reasoning: string | null;
}

interface SnapshotPoint {
  timestamp: string;
  value: number;
}

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPercent = (value: number) => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const timeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-background border-2 border-foreground p-2 shadow-brutal">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const ModelDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch model data with stats
  const { data, isLoading } = useQuery({
    queryKey: ["model-detail", id],
    queryFn: async () => {
      // Get model
      const { data: model } = await supabase
        .from("models")
        .select("id, display_name, provider, color")
        .eq("id", id)
        .single();

      if (!model) return null;

      // Get active season
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .single();

      if (!season) return { model, agent: null, positions: [], trades: [], snapshots: [] };

      // Get agent for this model in active season
      const { data: agent } = await supabase
        .from("agents")
        .select("id, cash_balance, total_invested")
        .eq("model_id", id)
        .eq("season_id", season.id)
        .single();

      if (!agent) return { model, agent: null, positions: [], trades: [], snapshots: [] };

      // Calculate positions value from open positions
      const { data: allPositions } = await supabase
        .from("positions")
        .select("current_value")
        .eq("agent_id", agent.id)
        .eq("status", "open");

      const positionsValue = (allPositions || []).reduce(
        (sum, p) => sum + (parseFloat(p.current_value) || 0),
        0
      );
      const totalValue = parseFloat(agent.cash_balance) + positionsValue;

      // Get positions
      const { data: positions } = await supabase
        .from("positions")
        .select(`
          id, side, shares, avg_entry_price, total_cost, current_value, unrealized_pnl,
          markets(question, slug)
        `)
        .eq("agent_id", agent.id)
        .eq("status", "open");

      // Get recent trades
      const { data: trades } = await supabase
        .from("trades")
        .select(`
          id, side, shares, price, total_amount, executed_at, market_id,
          markets(question, slug),
          decisions(parsed_response)
        `)
        .eq("agent_id", agent.id)
        .order("executed_at", { ascending: false })
        .limit(20);

      // Get portfolio snapshots
      const { data: snapshots } = await supabase
        .from("portfolio_snapshots")
        .select("snapshot_timestamp, total_value")
        .eq("agent_id", agent.id)
        .order("snapshot_timestamp", { ascending: true });

      // Get closed positions with resolved markets to calculate win rate
      const { data: closedPositions } = await supabase
        .from("positions")
        .select(`
          id, side, realized_pnl,
          markets!inner(resolution_outcome)
        `)
        .eq("agent_id", agent.id)
        .eq("status", "closed")
        .not("markets.resolution_outcome", "is", null);

      // Calculate wins/losses
      let wins = 0;
      let losses = 0;
      for (const pos of closedPositions || []) {
        const market = pos.markets as any;
        const resolution = market?.resolution_outcome;
        if (resolution) {
          // Win if bet side matches resolution
          const isWin = pos.side === resolution;
          if (isWin) wins++;
          else losses++;
        }
      }

      const totalResolved = wins + losses;
      const winRate = totalResolved > 0 ? (wins / totalResolved) * 100 : null;

      const pnlPercent = ((totalValue - 10000) / 10000) * 100;

      const modelData: ModelData = {
        id: model.id,
        display_name: model.display_name,
        provider: model.provider,
        color: model.color,
        agent_id: agent.id,
        cash_balance: parseFloat(agent.cash_balance),
        total_value: totalValue,
        positions_value: positionsValue,
        pnl_percent: pnlPercent,
        wins,
        losses,
        win_rate: winRate,
      };

      const mappedPositions: Position[] = (positions || []).map((p: any) => ({
        id: p.id,
        side: p.side,
        shares: parseFloat(p.shares),
        avg_entry_price: parseFloat(p.avg_entry_price),
        total_cost: parseFloat(p.total_cost),
        current_value: parseFloat(p.current_value),
        unrealized_pnl: parseFloat(p.unrealized_pnl),
        market_question: p.markets?.question || "",
        market_slug: p.markets?.slug || "",
      }));

      const mappedTrades: Trade[] = (trades || []).map((t: any) => {
        let reasoning = null;
        const decision = Array.isArray(t.decisions) ? t.decisions[0] : t.decisions;
        if (decision?.parsed_response?.bets) {
          const bet = decision.parsed_response.bets.find(
            (b: any) => b.market_id === t.market_id
          );
          reasoning = bet?.reasoning || null;
        }
        return {
          id: t.id,
          side: t.side,
          shares: parseFloat(t.shares),
          price: parseFloat(t.price),
          total_amount: parseFloat(t.total_amount),
          executed_at: t.executed_at,
          market_question: t.markets?.question || "",
          market_slug: t.markets?.slug || "",
          reasoning,
        };
      });

      const mappedSnapshots: SnapshotPoint[] = (snapshots || []).map((s: any) => ({
        timestamp: new Date(s.snapshot_timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        }),
        value: parseFloat(s.total_value),
      }));

      return {
        model: modelData,
        positions: mappedPositions,
        trades: mappedTrades,
        snapshots: mappedSnapshots,
      };
    },
    enabled: !!id,
  });

  const model = data?.model;
  const positions = data?.positions || [];
  const trades = data?.trades || [];
  const snapshots = data?.snapshots || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 xl:px-20 py-8">
        <Link
          to="/arena"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Arena
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !model ? (
          <div className="text-center py-12 border-2 border-foreground bg-muted/30">
            <p className="text-lg font-medium">Model not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-16 h-16 flex items-center justify-center"
                style={{ backgroundColor: model.color }}
              >
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">{model.display_name}</h1>
                <p className="text-muted-foreground">{model.provider}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(model.total_value)}</p>
              </div>
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">P&L</p>
                <p className={`text-2xl font-bold ${model.pnl_percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatPercent(model.pnl_percent)}
                </p>
              </div>
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                {model.win_rate !== null ? (
                  <>
                    <p className={`text-2xl font-bold ${model.win_rate >= 50 ? "text-green-500" : "text-red-500"}`}>
                      {model.win_rate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{model.wins}W / {model.losses}L</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">-</p>
                )}
              </div>
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">Cash</p>
                <p className="text-2xl font-bold">{formatCurrency(model.cash_balance)}</p>
              </div>
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">Positions</p>
                <p className="text-2xl font-bold">{positions.length}</p>
              </div>
            </div>

            {/* Portfolio Chart */}
            {snapshots.length > 1 && (
              <div className="border-2 border-foreground bg-background mb-8">
                <div className="p-4 border-b-2 border-foreground bg-muted/30">
                  <h2 className="font-bold">Portfolio History</h2>
                </div>
                <div className="p-4" style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={snapshots}>
                      <XAxis
                        dataKey="timestamp"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={["dataMin - 100", "dataMax + 100"]}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                        width={50}
                      />
                      <ReferenceLine y={10000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={model.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Open Positions - Table Format */}
            <div className="border-4 border-foreground bg-background mb-8 shadow-brutal">
              <div className="p-4 border-b-2 border-foreground bg-primary/10">
                <h2 className="font-bold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Open Positions ({positions.length})
                </h2>
              </div>
              {positions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No open positions</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-foreground">
                      <tr>
                        <th className="text-left p-3 font-medium">Side</th>
                        <th className="text-left p-3 font-medium">Market</th>
                        <th className="text-right p-3 font-medium">Invested</th>
                        <th className="text-right p-3 font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => {
                        const pnlPercent = pos.total_cost > 0 ? (pos.unrealized_pnl / pos.total_cost) * 100 : 0;
                        const isProfit = pos.unrealized_pnl >= 0;
                        return (
                          <tr
                            key={pos.id}
                            className="border-b border-border hover:bg-muted/30 cursor-pointer"
                            onClick={() => window.location.href = `/markets/${pos.market_slug}`}
                          >
                            <td className="p-3">
                              <span className={`inline-block px-3 py-1 text-xs font-bold rounded ${
                                pos.side === "YES"
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}>
                                {pos.side}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="line-clamp-1">{pos.market_question}</p>
                              <p className="text-xs text-muted-foreground">
                                {pos.shares.toFixed(0)} @ {(pos.avg_entry_price * 100).toFixed(0)}%
                              </p>
                            </td>
                            <td className="p-3 text-right font-bold">
                              {formatCurrency(pos.total_cost)}
                            </td>
                            <td className={`p-3 text-right font-bold ${isProfit ? "text-green-500" : "text-red-500"}`}>
                              {isProfit ? "+" : ""}{formatCurrency(pos.unrealized_pnl)}
                              <span className="block text-xs font-normal">
                                {isProfit ? "+" : ""}{pnlPercent.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Trades */}
            <div className="border-2 border-foreground bg-background">
              <div className="p-4 border-b-2 border-foreground bg-muted/30">
                <h2 className="font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Trades ({trades.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {trades.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No trades yet</p>
                ) : (
                  trades.map((trade) => (
                    <div key={trade.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          to={`/markets/${trade.market_slug}`}
                          className="text-sm truncate hover:text-primary flex-1 mr-4"
                        >
                          {trade.market_question}
                          <ExternalLink className="w-3 h-3 inline ml-1 opacity-50" />
                        </Link>
                        <span className="text-xs text-muted-foreground">{timeAgo(trade.executed_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={trade.side === "YES" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}
                        >
                          {trade.side}
                        </Badge>
                        <span className="text-sm font-medium">{formatCurrency(trade.total_amount)}</span>
                        <span className="text-xs text-muted-foreground">
                          @ {(trade.price * 100).toFixed(1)}%
                        </span>
                      </div>
                      {trade.reasoning && (
                        <p className="text-xs italic text-muted-foreground mt-2 border-l-2 border-primary/50 pl-2">
                          "{trade.reasoning}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ModelDetailPage;
