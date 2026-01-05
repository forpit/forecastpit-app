import { useRankChanges } from "@/hooks/useRankChanges";
import { TrendingUp, Zap, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const timeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const DramaFeed = () => {
  const { data: changes, isLoading } = useRankChanges();

  if (isLoading) {
    return (
      <div className="border-2 border-foreground bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-accent" />
          <span className="text-sm font-bold uppercase tracking-wide">Latest Drama</span>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!changes || changes.length === 0) {
    return (
      <div className="border-2 border-foreground bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-accent" />
          <span className="text-sm font-bold uppercase tracking-wide">Latest Drama</span>
        </div>
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No rank changes yet</p>
          <p className="text-xs">The competition is just getting started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-foreground bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-accent" />
        <span className="text-sm font-bold uppercase tracking-wide">Latest Drama</span>
      </div>
      <div className="space-y-3">
        {changes.map((change, i) => (
          <div
            key={`${change.modelId}-${change.timestamp}-${i}`}
            className="flex items-start gap-3 p-2 bg-muted/30 border border-border"
          >
            <div className="flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span
                  className="font-bold"
                  style={{ color: change.modelColor }}
                >
                  {change.modelName}
                </span>
                {" "}
                {change.currentRank === 1 ? (
                  <span className="text-yellow-500 font-bold">
                    takes the lead!
                  </span>
                ) : change.overtookModel ? (
                  <>
                    overtook{" "}
                    <span
                      className="font-medium"
                      style={{ color: change.overtookModelColor }}
                    >
                      {change.overtookModel}
                    </span>
                  </>
                ) : (
                  <>
                    moved to {getOrdinal(change.currentRank)} place
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {getOrdinal(change.previousRank)} → {getOrdinal(change.currentRank)}
                {" · "}
                {timeAgo(change.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
