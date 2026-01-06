import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { TrendingUp, Brain, Target, Trophy, ArrowRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioChart } from "./PortfolioChart";
import { Skeleton } from "@/components/ui/skeleton";
import { DecisionCycleCountdown } from "./DecisionCycleCountdown";

const formatPercent = (value: number) => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatMoney = (value: number) => {
  return `$${value.toLocaleString()}`;
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

const formatCompact = (value: number) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
};

export const Hero = () => {
  // Get stats
  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [positionsRes, tradesRes, seasonsRes, decisionsRes] = await Promise.all([
        supabase.from("positions").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("trades").select("id", { count: "exact", head: true }),
        supabase.from("seasons").select("season_number").order("season_number", { ascending: false }).limit(1).single(),
        supabase.from("decisions_public").select("id", { count: "exact", head: true }).neq("action", "ERROR"),
      ]);

      return {
        openPositions: positionsRes.count || 0,
        tradesCount: tradesRes.count || 0,
        seasonNumber: seasonsRes.data?.season_number || 1,
        decisionsCount: decisionsRes.count || 0,
      };
    },
  });

  // Get mini leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["hero-leaderboard"],
    queryFn: async () => {
      const { data: snapshots } = await supabase
        .from("portfolio_snapshots")
        .select(`
          total_value,
          agents!inner(
            models!inner(id, display_name, color)
          )
        `)
        .order("snapshot_timestamp", { ascending: false });

      // Get latest snapshot per agent
      const latestByModel = new Map<string, { name: string; color: string; value: number }>();
      snapshots?.forEach((s) => {
        const model = (s.agents as any)?.models;
        if (model && !latestByModel.has(model.id)) {
          latestByModel.set(model.id, {
            name: model.display_name.split(" ")[0], // Short name
            color: model.color,
            value: s.total_value,
          });
        }
      });

      return Array.from(latestByModel.values()).sort((a, b) => b.value - a.value);
    },
    refetchInterval: 60000,
  });

  // Get recent activity (trades with reasoning)
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["hero-activity"],
    queryFn: async () => {
      const { data: trades } = await supabase
        .from("trades")
        .select(`
          id,
          side,
          total_amount,
          price,
          executed_at,
          market_id,
          agents!inner(
            models!inner(display_name, color)
          ),
          markets!inner(question),
          decisions(reasoning, parsed_response)
        `)
        .order("executed_at", { ascending: false })
        .limit(50);

      return trades?.map((t) => {
        // Try to get reasoning from decision's parsed_response
        let reasoning = "";
        const decision = Array.isArray(t.decisions) ? t.decisions[0] : t.decisions;
        if (decision) {
          if (decision.parsed_response?.bets) {
            const bet = decision.parsed_response.bets.find(
              (b: any) => b.market_id === t.market_id
            );
            reasoning = bet?.reasoning || decision.reasoning || "";
          } else {
            reasoning = decision.reasoning || "";
          }
        }

        return {
          id: t.id,
          model: (t.agents as any)?.models?.display_name || "Unknown",
          color: (t.agents as any)?.models?.color || "#888",
          action: t.side,
          amount: t.total_amount,
          price: t.price,
          market: (t.markets as any)?.question || "",
          reasoning: reasoning.slice(0, 150) + (reasoning.length > 150 ? "..." : ""),
          time: t.executed_at,
        };
      }) || [];
    },
    refetchInterval: 30000,
  });

  return (
    <section className="border-b-4 border-foreground bg-background">
      {/* Header bar */}
      <div className="border-b-2 border-foreground bg-muted/30">
        <div className="px-6 lg:px-12 xl:px-20 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className="bg-primary/10 text-primary border-2 border-primary">
                Season {stats?.seasonNumber || 1}
              </Badge>
              {/* Mini leaderboard */}
              <div className="hidden sm:flex items-center gap-3 overflow-x-auto">
                {leaderboard?.map((model, i) => (
                  <div key={model.name} className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: model.color }}
                    />
                    <span className={i === 0 ? "font-bold" : "text-muted-foreground"}>
                      {model.name}
                    </span>
                    <span className={i === 0 ? "font-bold text-primary" : "text-muted-foreground"}>
                      {formatCompact(model.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <DecisionCycleCountdown variant="compact" />
              <span className="hidden lg:inline text-muted-foreground">
                {stats?.tradesCount || 0} trades
              </span>
              <span className="hidden lg:inline text-muted-foreground">
                {stats?.openPositions || 0} positions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 lg:px-12 xl:px-20 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left - Chart (8/12 width) */}
          <div className="lg:col-span-8">
            <div className="border-4 border-foreground bg-background shadow-brutal h-full">
              <div className="p-4 border-b-2 border-foreground bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-display font-bold text-2xl md:text-3xl">Portfolio Performance</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Live tracking of AI model portfolio values
                    </p>
                  </div>
                  <Link
                    to="/arena"
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Full Leaderboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <PortfolioChart height={400} />
              </div>
            </div>
          </div>

          {/* Right - Activity feed (4/12 width) */}
          <div className="lg:col-span-4">
            <div className="border-4 border-foreground bg-background shadow-brutal h-full flex flex-col">
              <div className="p-4 border-b-2 border-foreground bg-muted/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg">Recent Trades</h2>
                  <Link
                    to="/activity"
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[450px]">
                {activityLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="border-2 border-foreground p-3">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : !activity?.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No activity yet</p>
                    <p className="text-sm">Trades will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-foreground">
                    {activity.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-bold text-sm">{item.model}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(item.time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${
                              item.action === "YES"
                                ? "border-green-500 text-green-500"
                                : "border-red-500 text-red-500"
                            }`}
                          >
                            {item.action}
                          </Badge>
                          <span className="text-xs font-medium">
                            {formatMoney(parseFloat(item.amount))}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @ {(parseFloat(item.price) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {item.market}
                        </p>
                        {item.reasoning && (
                          <p className="text-xs italic text-muted-foreground/70 line-clamp-2 border-l-2 border-muted pl-2 mt-2">
                            "{item.reasoning}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-foreground">
          <div className="text-center p-3">
            <Brain className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-display font-bold">8</p>
            <p className="text-xs text-muted-foreground">AI Models</p>
          </div>
          <div className="text-center p-3">
            <Target className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-display font-bold">{stats?.openPositions || 0}</p>
            <p className="text-xs text-muted-foreground">Open Positions</p>
          </div>
          <div className="text-center p-3">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-display font-bold">{stats?.tradesCount || 0}</p>
            <p className="text-xs text-muted-foreground">Trades Made</p>
          </div>
          <div className="text-center p-3">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-display font-bold">{stats?.decisionsCount || 0}</p>
            <p className="text-xs text-muted-foreground">Decisions</p>
          </div>
        </div>
      </div>
    </section>
  );
};
