import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RankChange {
  modelId: string;
  modelName: string;
  modelColor: string;
  previousRank: number;
  currentRank: number;
  previousValue: number;
  currentValue: number;
  overtookModel?: string;
  overtookModelColor?: string;
  timestamp: string;
}

interface RankedSnapshot {
  agentId: string;
  modelId: string;
  modelName: string;
  modelColor: string;
  totalValue: number;
  timestamp: string;
}

export function useRankChanges() {
  return useQuery({
    queryKey: ["rank-changes"],
    queryFn: async (): Promise<RankChange[]> => {
      // Get the last 48 hours of snapshots
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      const { data: snapshots, error } = await supabase
        .from("portfolio_snapshots")
        .select(`
          id,
          agent_id,
          total_value,
          snapshot_timestamp,
          agents!inner(
            id,
            models!inner(id, display_name, color)
          )
        `)
        .gte("snapshot_timestamp", cutoff.toISOString())
        .order("snapshot_timestamp", { ascending: true });

      if (error) throw error;
      if (!snapshots || snapshots.length === 0) return [];

      // Group snapshots by timestamp (rounded to hour)
      const snapshotsByTime = new Map<string, RankedSnapshot[]>();

      snapshots.forEach((s) => {
        const model = (s.agents as any)?.models;
        if (!model) return;

        const hourKey = new Date(s.snapshot_timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH

        if (!snapshotsByTime.has(hourKey)) {
          snapshotsByTime.set(hourKey, []);
        }

        snapshotsByTime.get(hourKey)!.push({
          agentId: s.agent_id,
          modelId: model.id,
          modelName: model.display_name,
          modelColor: model.color,
          totalValue: s.total_value,
          timestamp: s.snapshot_timestamp,
        });
      });

      // Sort time keys
      const timeKeys = Array.from(snapshotsByTime.keys()).sort();
      if (timeKeys.length < 2) return [];

      // Calculate rankings for each time period
      const rankingsByTime = new Map<string, Map<string, number>>();

      timeKeys.forEach((timeKey) => {
        const snaps = snapshotsByTime.get(timeKey)!;
        // Take only the latest snapshot per model for this time period
        const latestByModel = new Map<string, RankedSnapshot>();
        snaps.forEach((s) => {
          if (!latestByModel.has(s.modelId) || new Date(s.timestamp) > new Date(latestByModel.get(s.modelId)!.timestamp)) {
            latestByModel.set(s.modelId, s);
          }
        });

        // Sort by value and assign ranks
        const sorted = Array.from(latestByModel.values()).sort((a, b) => b.totalValue - a.totalValue);
        const ranks = new Map<string, number>();
        sorted.forEach((s, i) => ranks.set(s.modelId, i + 1));
        rankingsByTime.set(timeKey, ranks);
      });

      // Find rank changes
      const changes: RankChange[] = [];
      const modelInfo = new Map<string, { name: string; color: string }>();

      // Populate model info
      snapshots.forEach((s) => {
        const model = (s.agents as any)?.models;
        if (model && !modelInfo.has(model.id)) {
          modelInfo.set(model.id, { name: model.display_name, color: model.color });
        }
      });

      for (let i = 1; i < timeKeys.length; i++) {
        const prevKey = timeKeys[i - 1];
        const currKey = timeKeys[i];
        const prevRanks = rankingsByTime.get(prevKey)!;
        const currRanks = rankingsByTime.get(currKey)!;
        const currSnaps = snapshotsByTime.get(currKey)!;
        const prevSnaps = snapshotsByTime.get(prevKey)!;

        currRanks.forEach((currentRank, modelId) => {
          const previousRank = prevRanks.get(modelId);
          if (previousRank !== undefined && currentRank < previousRank) {
            // This model moved up!
            const info = modelInfo.get(modelId);
            if (!info) return;

            // Find who they overtook
            let overtookModel: string | undefined;
            let overtookModelColor: string | undefined;

            prevRanks.forEach((prevR, otherModelId) => {
              const otherCurrRank = currRanks.get(otherModelId);
              if (otherModelId !== modelId &&
                  prevR === currentRank &&
                  otherCurrRank !== undefined &&
                  otherCurrRank > currentRank) {
                const otherInfo = modelInfo.get(otherModelId);
                if (otherInfo) {
                  overtookModel = otherInfo.name;
                  overtookModelColor = otherInfo.color;
                }
              }
            });

            // Get values
            const currSnap = currSnaps.find((s) => s.modelId === modelId);
            const prevSnap = prevSnaps.find((s) => s.modelId === modelId);

            changes.push({
              modelId,
              modelName: info.name,
              modelColor: info.color,
              previousRank,
              currentRank,
              previousValue: prevSnap?.totalValue || 0,
              currentValue: currSnap?.totalValue || 0,
              overtookModel,
              overtookModelColor,
              timestamp: currSnaps[0]?.timestamp || currKey,
            });
          }
        });
      }

      // Return most recent changes first, limit to 5
      return changes.reverse().slice(0, 5);
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
