import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  rank: number;
  modelId: string;
  displayName: string;
  provider: string;
  color: string;
  cashBalance: number;
  totalInvested: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  numBets: number;
  winRate: number | null;
  wins: number;
  losses: number;
  avgReturn: number | null;
  status: string;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Get active season
      const { data: season, error: seasonError } = await supabase
        .from("seasons")
        .select("id, initial_balance")
        .eq("status", "active")
        .order("season_number", { ascending: false })
        .limit(1)
        .single();

      if (seasonError || !season) {
        console.error("No active season found:", seasonError);
        return [];
      }

      // Get agents with their models
      const { data: agents, error: agentsError } = await supabase
        .from("agents")
        .select(`
          id,
          model_id,
          cash_balance,
          total_invested,
          status,
          models (
            id,
            display_name,
            provider,
            color
          )
        `)
        .eq("season_id", season.id);

      if (agentsError || !agents) {
        console.error("Error fetching agents:", agentsError);
        return [];
      }

      // Get positions for each agent to calculate total value
      const { data: positions, error: positionsError } = await supabase
        .from("positions")
        .select("agent_id, current_value, status")
        .eq("status", "open");

      if (positionsError) {
        console.error("Error fetching positions:", positionsError);
      }

      // Get trade counts per agent
      const { data: trades, error: tradesError } = await supabase
        .from("trades")
        .select("agent_id");

      if (tradesError) {
        console.error("Error fetching trades:", tradesError);
      }

      // Get closed positions with resolved markets for win rate calculation
      const { data: closedPositions, error: closedError } = await supabase
        .from("positions")
        .select(`
          agent_id,
          side,
          avg_entry_price,
          close_price,
          realized_pnl,
          markets!inner(resolution_outcome)
        `)
        .eq("status", "closed")
        .not("markets.resolution_outcome", "is", null);

      if (closedError) {
        console.error("Error fetching closed positions:", closedError);
      }

      // Calculate leaderboard entries
      const entries: LeaderboardEntry[] = agents.map((agent) => {
        const model = agent.models as unknown as {
          id: string;
          display_name: string;
          provider: string;
          color: string;
        };

        // Sum positions value
        const agentPositions = positions?.filter((p) => p.agent_id === agent.id) || [];
        const positionsValue = agentPositions.reduce(
          (sum, p) => sum + (p.current_value || 0),
          0
        );

        // Total value = cash + positions
        const totalValue = Number(agent.cash_balance) + positionsValue;
        const initialBalance = season.initial_balance;
        const pnl = totalValue - initialBalance;
        const pnlPercent = ((totalValue - initialBalance) / initialBalance) * 100;

        // Count trades
        const numBets = trades?.filter((t) => t.agent_id === agent.id).length || 0;

        // Calculate win rate from closed positions
        const agentClosedPositions = closedPositions?.filter((p) => p.agent_id === agent.id) || [];
        let wins = 0;
        let losses = 0;
        let totalReturn = 0;

        agentClosedPositions.forEach((pos) => {
          const market = pos.markets as unknown as { resolution_outcome: string };
          const outcome = market?.resolution_outcome;

          if (outcome) {
            // A "win" is when the side matches the resolution outcome
            const isWin = pos.side === outcome;
            if (isWin) {
              wins++;
            } else {
              losses++;
            }
          }

          // Calculate return for avg return
          if (pos.avg_entry_price && pos.close_price) {
            const returnPct = ((pos.close_price - pos.avg_entry_price) / pos.avg_entry_price) * 100;
            totalReturn += returnPct;
          }
        });

        const totalResolved = wins + losses;
        const winRate = totalResolved > 0 ? (wins / totalResolved) * 100 : null;
        const avgReturn = agentClosedPositions.length > 0
          ? totalReturn / agentClosedPositions.length
          : null;

        return {
          rank: 0, // Will be set after sorting
          modelId: model?.id || agent.model_id,
          displayName: model?.display_name || agent.model_id,
          provider: model?.provider || "Unknown",
          color: model?.color || "#888888",
          cashBalance: Number(agent.cash_balance),
          totalInvested: Number(agent.total_invested),
          totalValue,
          pnl,
          pnlPercent,
          numBets,
          winRate,
          wins,
          losses,
          avgReturn,
          status: agent.status,
        };
      });

      // Sort by total value (descending) and assign ranks
      entries.sort((a, b) => b.totalValue - a.totalValue);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
