import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ExternalLink, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface Trade {
  id: string;
  trade_type: string;
  side: string;
  shares: number;
  price: number;
  total_amount: number;
  cost_basis: number | null;
  realized_pnl: number | null;
  executed_at: string;
  market: {
    question: string;
    slug: string;
    event_slug: string | null;
  };
  model: {
    id: string;
    display_name: string;
    color: string;
  };
  reasoning: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const TradeRow = ({ trade }: { trade: Trade }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-foreground/20 hover:bg-muted/30 transition-colors">
      <div
        className="flex items-center gap-4 py-3 px-4 cursor-pointer"
        onClick={() => trade.reasoning && setExpanded(!expanded)}
      >
        {/* Time */}
        <div className="text-xs text-muted-foreground w-16 flex-shrink-0">
          {formatDistanceToNow(new Date(trade.executed_at), { addSuffix: false })}
        </div>

        {/* Model */}
        <div className="flex items-center gap-2 w-32 flex-shrink-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: trade.model.color }}
          />
          <span className="font-medium text-sm truncate">
            {trade.model.display_name.split(" ")[0]}
          </span>
        </div>

        {/* Trade type badge */}
        <Badge
          variant="outline"
          className={`text-xs w-12 justify-center flex-shrink-0 ${
            trade.trade_type === "BUY"
              ? "border-blue-500 text-blue-500 bg-blue-500/10"
              : "border-orange-500 text-orange-500 bg-orange-500/10"
          }`}
        >
          {trade.trade_type}
        </Badge>

        {/* Side badge */}
        <Badge
          variant="outline"
          className={`text-xs w-12 justify-center flex-shrink-0 ${
            trade.side === "YES"
              ? "border-green-500 text-green-500 bg-green-500/10"
              : "border-red-500 text-red-500 bg-red-500/10"
          }`}
        >
          {trade.side}
        </Badge>

        {/* Amount */}
        <span className="font-bold text-sm w-16 flex-shrink-0">
          {formatCurrency(trade.total_amount)}
        </span>

        {/* Price */}
        <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
          @ {(trade.price * 100).toFixed(0)}%
        </span>

        {/* P/L for SELL trades */}
        {trade.trade_type === "SELL" && trade.realized_pnl !== null ? (
          <span
            className={`text-xs font-medium w-16 flex-shrink-0 ${
              trade.realized_pnl >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {trade.realized_pnl >= 0 ? "+" : ""}
            {formatCurrency(trade.realized_pnl)}
          </span>
        ) : (
          <span className="w-16 flex-shrink-0" />
        )}

        {/* Market question */}
        <div className="flex-1 min-w-0">
          {trade.market?.event_slug ? (
            <a
              href={`https://polymarket.com/event/${trade.market.event_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm truncate block hover:text-primary hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {trade.market?.question}
              <ExternalLink className="w-3 h-3 inline ml-1 opacity-50" />
            </a>
          ) : (
            <span className="text-sm truncate block">
              {trade.market?.question}
            </span>
          )}
        </div>

        {/* Expand indicator */}
        {trade.reasoning && (
          <div className="text-xs text-muted-foreground flex-shrink-0">
            {expanded ? "−" : "+"}
          </div>
        )}
      </div>

      {/* Expanded reasoning */}
      {expanded && trade.reasoning && (
        <div className="px-4 pb-3 pl-20">
          <p className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3">
            "{trade.reasoning}"
          </p>
        </div>
      )}
    </div>
  );
};

const ActivityPage = () => {
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [sideFilter, setSideFilter] = useState<string | null>(null);

  const { data: trades, isLoading, error } = useQuery({
    queryKey: ["activity-trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select(`
          id,
          trade_type,
          side,
          shares,
          price,
          total_amount,
          cost_basis,
          realized_pnl,
          executed_at,
          market_id,
          position_id,
          decision_id,
          markets (
            question,
            slug,
            event_slug
          ),
          agents!inner (
            models!inner (
              id,
              display_name,
              color
            )
          ),
          decisions (
            parsed_response
          )
        `)
        .order("executed_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      return data?.map((t) => {
        // Extract reasoning from decision's parsed_response
        let reasoning: string | null = null;
        const decision = Array.isArray(t.decisions) ? t.decisions[0] : t.decisions;

        if (t.trade_type === "SELL") {
          // For SELL trades, check if there's a decision with sells reasoning
          if (decision?.parsed_response?.sells) {
            const sell = decision.parsed_response.sells.find(
              (s: any) => s.position_id === t.position_id
            );
            reasoning = sell?.reasoning || decision.parsed_response.reasoning || "LLM decided to close position";
          } else if (decision?.parsed_response?.reasoning) {
            reasoning = decision.parsed_response.reasoning;
          } else {
            reasoning = "LLM decided to close position";
          }
        } else if (decision?.parsed_response?.bets) {
          const bet = decision.parsed_response.bets.find(
            (b: any) => b.market_id === t.market_id
          );
          reasoning = bet?.reasoning || null;
        }

        return {
          id: t.id,
          trade_type: t.trade_type,
          side: t.side,
          shares: t.shares,
          price: t.price,
          total_amount: t.total_amount,
          cost_basis: t.cost_basis,
          realized_pnl: t.realized_pnl,
          executed_at: t.executed_at,
          position_id: t.position_id,
          market: t.markets as { question: string; slug: string; event_slug: string | null },
          model: (t.agents as any)?.models as { id: string; display_name: string; color: string },
          reasoning,
        };
      }) || [];
    },
  });

  // Get unique models for filter
  const models = useMemo(() => {
    if (!trades) return [];
    const modelMap = new Map<string, { id: string; name: string; color: string }>();
    trades.forEach((t) => {
      if (t.model && !modelMap.has(t.model.id)) {
        modelMap.set(t.model.id, {
          id: t.model.id,
          name: t.model.display_name,
          color: t.model.color,
        });
      }
    });
    return Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [trades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter((t) => {
      if (modelFilter && t.model?.id !== modelFilter) return false;
      if (sideFilter && t.side !== sideFilter) return false;
      return true;
    });
  }, [trades, modelFilter, sideFilter]);

  const clearFilters = () => {
    setModelFilter(null);
    setSideFilter(null);
  };

  const hasFilters = modelFilter || sideFilter;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 xl:px-20 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <Badge className="bg-primary/10 text-primary border-2 border-primary px-4 py-1.5 mb-4">
            Trade Stream
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            Activity
          </h1>
          <p className="text-lg text-muted-foreground">
            Real-time stream of all AI trading activity
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Model filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={modelFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setModelFilter(null)}
              className="h-7 text-xs"
            >
              All Models
            </Button>
            {models.map((m) => (
              <Button
                key={m.id}
                variant={modelFilter === m.id ? "default" : "outline"}
                size="sm"
                onClick={() => setModelFilter(m.id)}
                className="h-7 text-xs"
              >
                <div
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: m.color }}
                />
                {m.name.split(" ")[0]}
              </Button>
            ))}
          </div>

          {/* Side filter */}
          <div className="flex gap-2 items-center border-l border-foreground/20 pl-4">
            <Button
              variant={sideFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSideFilter(null)}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant={sideFilter === "YES" ? "default" : "outline"}
              size="sm"
              onClick={() => setSideFilter("YES")}
              className="h-7 text-xs border-green-500/50 hover:bg-green-500/10"
            >
              YES
            </Button>
            <Button
              variant={sideFilter === "NO" ? "default" : "outline"}
              size="sm"
              onClick={() => setSideFilter("NO")}
              className="h-7 text-xs border-red-500/50 hover:bg-red-500/10"
            >
              NO
            </Button>
          </div>

          {/* Results count & clear */}
          <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
            <span>{filteredTrades.length} trades</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Trades Table */}
        <div className="border-2 border-foreground bg-background">
          {/* Table Header */}
          <div className="flex items-center gap-4 py-2 px-4 border-b-2 border-foreground bg-muted/50 text-xs text-muted-foreground font-medium">
            <div className="w-16">Time</div>
            <div className="w-32">Model</div>
            <div className="w-12">Type</div>
            <div className="w-12">Side</div>
            <div className="w-16">Amount</div>
            <div className="w-16">Price</div>
            <div className="w-16">P/L</div>
            <div className="flex-1">Market</div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Error loading trades. Please try again.</p>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">
                {hasFilters ? "No Matching Trades" : "No Trades Yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "Trades will appear here as AI models make decisions"}
              </p>
            </div>
          ) : (
            <div>
              {filteredTrades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ActivityPage;
