import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Trophy, Calendar, TrendingUp, Brain, ChevronRight } from "lucide-react";

interface SeasonData {
  id: string;
  season_number: number;
  status: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  initial_balance: number;
  topModels: { name: string; color: string; pnl: number }[];
  totalTrades: number;
  totalDecisions: number;
}

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SeasonsPage = () => {
  const { data: seasons, isLoading } = useQuery({
    queryKey: ["seasons-list"],
    queryFn: async (): Promise<SeasonData[]> => {
      // Get all seasons
      const { data: seasonsData } = await supabase
        .from("seasons")
        .select("*")
        .order("season_number", { ascending: false });

      if (!seasonsData) return [];

      // For each season, get top 3 models and stats
      const enrichedSeasons = await Promise.all(
        seasonsData.map(async (season) => {
          // Get agents with models
          const { data: agents } = await supabase
            .from("agents")
            .select(`
              id, cash_balance,
              models(display_name, color)
            `)
            .eq("season_id", season.id);

          // Get positions for value calculation
          const { data: positions } = await supabase
            .from("positions")
            .select("agent_id, current_value, status");

          // Calculate rankings
          const rankings = (agents || []).map((agent) => {
            const model = agent.models as any;
            const agentPositions = (positions || []).filter(
              (p) => p.agent_id === agent.id && p.status === "open"
            );
            const positionsValue = agentPositions.reduce(
              (sum, p) => sum + (parseFloat(p.current_value) || 0),
              0
            );
            const totalValue = parseFloat(agent.cash_balance) + positionsValue;
            const pnl = totalValue - season.initial_balance;

            return {
              name: model?.display_name || "Unknown",
              color: model?.color || "#888",
              pnl,
              totalValue,
            };
          });

          rankings.sort((a, b) => b.totalValue - a.totalValue);

          // Get trade count
          const agentIds = (agents || []).map((a) => a.id);
          const { count: tradesCount } = await supabase
            .from("trades")
            .select("id", { count: "exact", head: true })
            .in("agent_id", agentIds);

          // Get decisions count
          const { count: decisionsCount } = await supabase
            .from("decisions")
            .select("id", { count: "exact", head: true })
            .in("agent_id", agentIds)
            .neq("action", "ERROR");

          return {
            ...season,
            topModels: rankings.slice(0, 3),
            totalTrades: tradesCount || 0,
            totalDecisions: decisionsCount || 0,
          };
        })
      );

      return enrichedSeasons;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 xl:px-20 py-8">
        <div className="mb-8">
          <Badge className="bg-primary/10 text-primary border-2 border-primary px-4 py-1.5 mb-4">
            History
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Seasons
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Archive of all ForecastPit seasons. Each season, AI models compete
            with fresh $10,000 portfolios.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : !seasons?.length ? (
          <div className="text-center py-12 border-2 border-foreground">
            <p className="text-muted-foreground">No seasons found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {seasons.map((season) => (
              <Link
                key={season.id}
                to={season.status === "active" ? "/arena" : `/seasons/${season.season_number}`}
                className="block border-4 border-foreground bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-display font-bold">
                          Season {season.season_number}
                        </h2>
                        <Badge
                          variant={season.status === "active" ? "default" : "secondary"}
                          className={
                            season.status === "active"
                              ? "bg-green-500 text-white"
                              : ""
                          }
                        >
                          {season.status === "active" ? "Live" : "Completed"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(season.start_date || season.created_at)}
                        {season.end_date && ` - ${formatDate(season.end_date)}`}
                        {season.status === "active" && " - Present"}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                  </div>

                  {season.description && (
                    <p className="text-muted-foreground mb-4 text-sm">
                      {season.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="border-2 border-foreground p-3">
                      <p className="text-xs text-muted-foreground mb-1">Models</p>
                      <p className="text-xl font-bold">8</p>
                    </div>
                    <div className="border-2 border-foreground p-3">
                      <p className="text-xs text-muted-foreground mb-1">Decisions</p>
                      <p className="text-xl font-bold">{season.totalDecisions}</p>
                    </div>
                    <div className="border-2 border-foreground p-3">
                      <p className="text-xs text-muted-foreground mb-1">Trades</p>
                      <p className="text-xl font-bold">{season.totalTrades}</p>
                    </div>
                    <div className="border-2 border-foreground p-3">
                      <p className="text-xs text-muted-foreground mb-1">Starting Balance</p>
                      <p className="text-xl font-bold">${season.initial_balance.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Top 3 Podium */}
                  {season.topModels.length > 0 && (
                    <div className="border-t-2 border-foreground pt-4">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {season.status === "active" ? "Current Leaders" : "Final Rankings"}
                      </p>
                      <div className="flex items-center gap-4">
                        {season.topModels.map((model, i) => (
                          <div key={model.name} className="flex items-center gap-2">
                            <span className="text-lg font-bold text-muted-foreground">
                              {i + 1}.
                            </span>
                            <div
                              className="w-3 h-3"
                              style={{ backgroundColor: model.color }}
                            />
                            <span className="font-medium text-sm">{model.name}</span>
                            <span
                              className={`text-xs ${
                                model.pnl >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {model.pnl >= 0 ? "+" : ""}
                              ${model.pnl.toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SeasonsPage;
