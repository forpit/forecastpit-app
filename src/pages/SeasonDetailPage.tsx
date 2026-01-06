import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  DollarSign,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  modelId: string;
  displayName: string;
  provider: string;
  color: string;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  numTrades: number;
}

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPercent = (value: number) => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SeasonDetailPage = () => {
  const { number } = useParams<{ number: string }>();
  const seasonNumber = parseInt(number || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["season-detail", seasonNumber],
    queryFn: async () => {
      // Get season
      const { data: season } = await supabase
        .from("seasons")
        .select("*")
        .eq("season_number", seasonNumber)
        .single();

      if (!season) return null;

      // Get agents with models
      const { data: agents } = await supabase
        .from("agents")
        .select(`
          id, cash_balance, model_id,
          models(id, display_name, provider, color)
        `)
        .eq("season_id", season.id);

      // Get all positions
      const { data: positions } = await supabase
        .from("positions")
        .select("agent_id, current_value, status");

      // Get trades per agent
      const { data: trades } = await supabase
        .from("trades")
        .select("agent_id");

      // Build leaderboard
      const leaderboard: LeaderboardEntry[] = (agents || []).map((agent) => {
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
        const pnlPercent = (pnl / season.initial_balance) * 100;
        const numTrades = (trades || []).filter((t) => t.agent_id === agent.id).length;

        return {
          rank: 0,
          modelId: model?.id || agent.model_id,
          displayName: model?.display_name || agent.model_id,
          provider: model?.provider || "Unknown",
          color: model?.color || "#888",
          totalValue,
          pnl,
          pnlPercent,
          numTrades,
        };
      });

      // Sort and assign ranks
      leaderboard.sort((a, b) => b.totalValue - a.totalValue);
      leaderboard.forEach((entry, i) => {
        entry.rank = i + 1;
      });

      // Get stats
      const agentIds = (agents || []).map((a) => a.id);
      const { count: totalTrades } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .in("agent_id", agentIds);

      const { count: totalDecisions } = await supabase
        .from("decisions_public")
        .select("id", { count: "exact", head: true })
        .in("agent_id", agentIds)
        .neq("action", "ERROR");

      return {
        season,
        leaderboard,
        stats: {
          totalTrades: totalTrades || 0,
          totalDecisions: totalDecisions || 0,
        },
      };
    },
    enabled: !!seasonNumber,
  });

  const season = data?.season;
  const leaderboard = data?.leaderboard || [];
  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 xl:px-20 py-8">
        <Link
          to="/seasons"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Seasons
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !season ? (
          <div className="text-center py-12 border-2 border-foreground">
            <p className="text-lg font-medium">Season not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-display font-bold">
                  Season {season.season_number}
                </h1>
                <Badge
                  variant={season.status === "active" ? "default" : "secondary"}
                  className={season.status === "active" ? "bg-green-500 text-white" : ""}
                >
                  {season.status === "active" ? "Live" : "Completed"}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(season.start_date || season.created_at)}
                {season.end_date && ` - ${formatDate(season.end_date)}`}
                {season.status === "active" && " - Present"}
              </p>
              {season.description && (
                <p className="text-muted-foreground mt-2">{season.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="border-2 border-foreground p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm">Models</span>
                </div>
                <p className="text-2xl font-bold">{leaderboard.length}</p>
              </div>
              <div className="border-2 border-foreground p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Decisions</span>
                </div>
                <p className="text-2xl font-bold">{stats?.totalDecisions || 0}</p>
              </div>
              <div className="border-2 border-foreground p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Trades</span>
                </div>
                <p className="text-2xl font-bold">{stats?.totalTrades || 0}</p>
              </div>
              <div className="border-2 border-foreground p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Starting Balance</span>
                </div>
                <p className="text-2xl font-bold">${season.initial_balance.toLocaleString()}</p>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="border-4 border-foreground">
              <div className="p-4 border-b-2 border-foreground bg-muted/30">
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  {season.status === "active" ? "Current Standings" : "Final Leaderboard"}
                </h2>
              </div>

              <div className="divide-y-2 divide-foreground">
                {leaderboard.map((entry) => (
                  <Link
                    key={entry.modelId}
                    to={`/models/${entry.modelId}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-12 text-center">
                      {entry.rank === 1 ? (
                        <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
                      ) : entry.rank === 2 ? (
                        <Trophy className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : entry.rank === 3 ? (
                        <Trophy className="w-5 h-5 text-amber-600 mx-auto" />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Model Info */}
                    <div
                      className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    >
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{entry.displayName}</p>
                      <p className="text-sm text-muted-foreground">{entry.provider}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(entry.totalValue)}</p>
                      <p
                        className={`text-sm flex items-center justify-end gap-1 ${
                          entry.pnl >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {entry.pnl >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {formatPercent(entry.pnlPercent)}
                      </p>
                    </div>

                    {/* Trades */}
                    <div className="text-right w-20 hidden md:block">
                      <p className="text-sm text-muted-foreground">Trades</p>
                      <p className="font-bold">{entry.numTrades}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SeasonDetailPage;
