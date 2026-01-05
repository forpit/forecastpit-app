import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Clock,
  DollarSign,
  Brain,
  RefreshCw,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Position {
  id: string;
  side: string;
  shares: number;
  avg_entry_price: number;
  current_value: number;
  unrealized_pnl: number;
  model_name: string;
  model_color: string;
}

interface Market {
  id: string;
  question: string;
  description: string | null;
  category: string | null;
  current_price: number | null;
  volume: number | null;
  close_date: string;
  status: string;
  slug: string;
  positions: Position[];
  total_invested: number;
}

interface MarketOpinion {
  model_id: string;
  display_name: string;
  provider: string;
  probability: number;
  action: string;
  reasoning: string;
  response_time_ms: number;
  created_at: string;
  error?: string;
}

interface OpinionsResponse {
  market: Market;
  opinions: MarketOpinion[];
  cached: boolean;
  cache_age_hours?: number;
}

const SUPABASE_URL = "https://jsqkpqjtznrakembjzyt.supabase.co";
const LOCAL_API_URL = "http://localhost:3001";
const API_URL = import.meta.env.DEV ? LOCAL_API_URL : SUPABASE_URL + "/functions/v1";

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

const getDaysUntilClose = (closeDate: string) => {
  const close = new Date(closeDate);
  const now = new Date();
  const days = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return days;
};

const MarketCard = ({
  market,
  onClick,
}: {
  market: Market;
  onClick: () => void;
}) => {
  const daysLeft = getDaysUntilClose(market.close_date);
  const price = market.current_price || 0;

  // Group positions by side
  const yesPositions = market.positions.filter((p) => p.side === "YES");
  const noPositions = market.positions.filter((p) => p.side === "NO");

  return (
    <div
      className="border-2 border-foreground bg-background p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <p className="font-bold text-lg leading-tight group-hover:text-primary transition-colors flex-1">
              {market.question}
            </p>
            <a
              href={`https://polymarket.com/event/${market.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              title="View on Polymarket"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {market.category && (
              <Badge variant="outline" className="text-xs">
                {market.category}
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(market.volume || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {formatPercent(price)}
              </p>
              <p className="text-xs text-muted-foreground">YES</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>

      {/* Model positions */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{market.positions.length} AI positions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {yesPositions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded">
              <span className="text-xs font-medium text-green-500">YES:</span>
              {yesPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex items-center gap-1"
                  title={`${pos.model_name}: ${pos.shares.toFixed(1)} shares @ ${formatPercent(pos.avg_entry_price)} (${pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toFixed(1)}%)`}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-foreground/30"
                    style={{ backgroundColor: pos.model_color }}
                  />
                  <span className="text-xs">{pos.model_name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
          {noPositions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded">
              <span className="text-xs font-medium text-red-500">NO:</span>
              {noPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex items-center gap-1"
                  title={`${pos.model_name}: ${pos.shares.toFixed(1)} shares @ ${formatPercent(pos.avg_entry_price)} (${pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toFixed(1)}%)`}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-foreground/30"
                    style={{ backgroundColor: pos.model_color }}
                  />
                  <span className="text-xs">{pos.model_name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OpinionCard = ({ opinion }: { opinion: MarketOpinion }) => {
  const actionColor =
    opinion.action === "BUY YES"
      ? "text-green-500 bg-green-500/10 border-green-500"
      : opinion.action === "BUY NO"
      ? "text-red-500 bg-red-500/10 border-red-500"
      : "text-yellow-500 bg-yellow-500/10 border-yellow-500";

  return (
    <div className="border-2 border-foreground bg-background p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">{opinion.display_name}</p>
            <p className="text-sm text-muted-foreground">{opinion.provider}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{opinion.probability}%</p>
          <Badge className={`border-2 ${actionColor}`}>{opinion.action}</Badge>
        </div>
      </div>
      {opinion.error ? (
        <p className="text-sm text-red-500">Error: {opinion.error}</p>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {opinion.reasoning}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Response: {(opinion.response_time_ms / 1000).toFixed(1)}s
      </p>
    </div>
  );
};

const MarketOpinionsModal = ({
  market,
  open,
  onClose,
}: {
  market: Market | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [streamingOpinions, setStreamingOpinions] = useState<MarketOpinion[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const [cached, setCached] = useState(false);
  const [cacheAgeHours, setCacheAgeHours] = useState<number | null>(null);

  const startStreaming = async (refresh: boolean) => {
    if (!market?.id) return;

    setIsStreaming(true);
    setStreamComplete(false);
    setStreamingOpinions([]);
    setCached(false);
    setCacheAgeHours(null);

    try {
      const response = await fetch(
        `${API_URL}/get-market-opinions-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ market_id: market.id, refresh }),
        }
      );

      // Check if it's a cached JSON response (not streaming)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        setStreamingOpinions(data.opinions || []);
        setStreamComplete(true);
        setIsStreaming(false);
        setCached(data.cached || false);
        setCacheAgeHours(data.cache_age_hours || null);
        return;
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "opinion") {
                setStreamingOpinions((prev) => [...prev, data.opinion]);
              } else if (data.type === "done") {
                setStreamComplete(true);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await startStreaming(true);
    },
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStreamingOpinions([]);
      setIsStreaming(false);
      setStreamComplete(false);
      setCached(false);
      setCacheAgeHours(null);
    }
  }, [open]);

  if (!market) return null;

  const price = market.current_price || 0;
  const daysLeft = getDaysUntilClose(market.close_date);

  const opinions = streamingOpinions;
  const successfulOpinions = opinions.filter((o) => !o.error);
  const avgProbability =
    successfulOpinions.length > 0
      ? successfulOpinions.reduce((sum, o) => sum + o.probability, 0) /
        successfulOpinions.length
      : 0;

  const buyYes = successfulOpinions.filter((o) => o.action === "BUY YES").length;
  const buyNo = successfulOpinions.filter((o) => o.action === "BUY NO").length;
  const hold = successfulOpinions.filter((o) => o.action === "HOLD").length;

  const totalExpected = 8;
  const loadingCount = isStreaming ? totalExpected - opinions.length : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl leading-tight pr-8">
            {market.question}
          </DialogTitle>
        </DialogHeader>

        {/* Market Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-foreground/20">
          <div>
            <p className="text-sm text-muted-foreground">Market Price</p>
            <p className="text-2xl font-bold text-green-500">
              {formatPercent(price)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="text-2xl font-bold">
              {formatCurrency(market.volume || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Closes</p>
            <p className="text-2xl font-bold">
              {daysLeft <= 0 ? "Expired" : `${daysLeft}d`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">AI Average</p>
            <p className="text-2xl font-bold">
              {opinions.length === 0 ? "-" : `${avgProbability.toFixed(1)}%`}
            </p>
          </div>
        </div>

        {/* Summary */}
        {(successfulOpinions.length > 0 || isStreaming) && (
          <div className="flex items-center justify-between py-4 border-b border-foreground/20">
            <div className="flex gap-4">
              <Badge className="bg-green-500/10 text-green-500 border-2 border-green-500">
                BUY YES: {buyYes}
              </Badge>
              <Badge className="bg-red-500/10 text-red-500 border-2 border-red-500">
                BUY NO: {buyNo}
              </Badge>
              <Badge className="bg-yellow-500/10 text-yellow-500 border-2 border-yellow-500">
                HOLD: {hold}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {cached && !isStreaming && cacheAgeHours !== null && (
                <span className="text-xs text-muted-foreground">
                  Cached {cacheAgeHours}h ago
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={isStreaming || refreshMutation.isPending}
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">{isStreaming ? "Loading..." : "Refresh"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Opinions Grid */}
        <div className="py-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            AI Model Opinions
            {isStreaming && (
              <span className="text-sm font-normal text-muted-foreground">
                ({opinions.length}/{totalExpected} loaded)
              </span>
            )}
          </h3>
          {opinions.length === 0 && !isStreaming ? (
            <div className="text-center py-12 border-2 border-dashed border-foreground/30 bg-muted/20">
              <Brain className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              <h4 className="text-lg font-bold mb-2">Get AI Insights</h4>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Ask our AI models what they think about this market.
                Results are cached for 24 hours.
              </p>
              <Button
                size="lg"
                onClick={() => startStreaming(false)}
                disabled={isStreaming}
                className="border-2 border-foreground shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <Brain className="w-5 h-5 mr-2" />
                Get AI Insights
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Real opinions */}
              {opinions.map((opinion) => (
                <OpinionCard key={opinion.model_id} opinion={opinion} />
              ))}
              {/* Loading skeletons for remaining */}
              {[...Array(loadingCount)].map((_, i) => (
                <div key={`loading-${i}`} className="border-2 border-foreground p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-muted flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MarketsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: markets, isLoading } = useQuery({
    queryKey: ["markets-with-positions"],
    queryFn: async () => {
      // Get active season
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!season) return [];

      // Get all open positions with market and agent/model info
      const { data: positions, error } = await supabase
        .from("positions")
        .select(`
          id,
          side,
          shares,
          avg_entry_price,
          current_value,
          unrealized_pnl,
          total_cost,
          market_id,
          markets!inner(
            id,
            question,
            description,
            category,
            current_price,
            volume,
            close_date,
            status,
            slug
          ),
          agents!inner(
            season_id,
            models!inner(
              display_name,
              color
            )
          )
        `)
        .eq("status", "open")
        .eq("agents.season_id", season.id);

      if (error) throw error;
      if (!positions) return [];

      // Group positions by market
      const marketMap = new Map<string, Market>();

      for (const pos of positions) {
        const marketData = pos.markets as any;
        const marketId = marketData.id;

        if (!marketMap.has(marketId)) {
          marketMap.set(marketId, {
            id: marketId,
            question: marketData.question,
            description: marketData.description,
            category: marketData.category,
            current_price: marketData.current_price,
            volume: marketData.volume,
            close_date: marketData.close_date,
            status: marketData.status,
            slug: marketData.slug,
            positions: [],
            total_invested: 0,
          });
        }

        const market = marketMap.get(marketId)!;
        const totalCost = parseFloat((pos as any).total_cost || 0);
        const currentValue = parseFloat(pos.current_value as any) || 0;
        const pnlPercent = totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0;

        const position: Position = {
          id: pos.id,
          side: pos.side,
          shares: parseFloat(pos.shares as any),
          avg_entry_price: parseFloat(pos.avg_entry_price as any),
          current_value: currentValue,
          unrealized_pnl: pnlPercent,
          model_name: (pos.agents as any).models.display_name,
          model_color: (pos.agents as any).models.color,
        };

        market.positions.push(position);
        market.total_invested += totalCost;
      }

      // Sort markets by total invested (most invested first)
      return Array.from(marketMap.values()).sort(
        (a, b) => b.total_invested - a.total_invested
      );
    },
  });

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    if (!searchQuery.trim()) return markets;

    const query = searchQuery.toLowerCase();
    return markets.filter(
      (m) =>
        m.question.toLowerCase().includes(query) ||
        m.category?.toLowerCase().includes(query)
    );
  }, [markets, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 xl:px-20 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Badge className="bg-primary/10 text-primary border-2 border-primary px-4 py-1.5 mb-4">
            AI Positions
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Markets
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Markets where AI models have active positions. Click to see details.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-2 border-foreground"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>{filteredMarkets.length} markets with positions</span>
          <span className="hidden sm:inline">
            {filteredMarkets.reduce((sum, m) => sum + m.positions.length, 0)} total positions
          </span>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Markets List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(10)].map((_, i) => (
              <div key={i} className="border-2 border-foreground p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-12 border-2 border-foreground bg-muted/30">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Positions Found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "AI models haven't taken any positions yet"}
              </p>
            </div>
          ) : (
            filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onClick={() => navigate(`/markets/${market.slug}`)}
              />
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketsPage;
