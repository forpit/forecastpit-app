import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Clock,
  Brain,
} from "lucide-react";

interface MarketData {
  id: string;
  question: string;
  description: string | null;
  category: string | null;
  current_price: number;
  volume: number;
  close_date: string;
  slug: string;
  event_slug: string | null;
}

interface Position {
  id: string;
  side: string;
  shares: number;
  avg_entry_price: number;
  total_cost: number;
  current_value: number;
  unrealized_pnl: number;
  model_name: string;
  model_color: string;
  reasoning: string | null;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

const MarketDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch market data and positions from our database
  const { data, isLoading } = useQuery({
    queryKey: ["market-detail", slug],
    queryFn: async () => {
      // Get market by slug
      const { data: market, error: marketError } = await supabase
        .from("markets")
        .select("id, question, description, category, current_price, volume, close_date, slug, event_slug")
        .eq("slug", slug)
        .single();

      if (marketError || !market) return { market: null, positions: [] };

      // Get active season
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!season) return { market, positions: [] };

      // Get positions on this market
      const { data: positions } = await supabase
        .from("positions")
        .select(`
          id,
          side,
          shares,
          avg_entry_price,
          total_cost,
          current_value,
          unrealized_pnl,
          agents!inner(
            id,
            season_id,
            models!inner(display_name, color)
          )
        `)
        .eq("market_id", market.id)
        .eq("status", "open")
        .eq("agents.season_id", season.id);

      // Get trades with reasoning for this market
      const { data: trades } = await supabase
        .from("trades")
        .select(`
          agent_id,
          market_id,
          decisions(parsed_response)
        `)
        .eq("market_id", market.id);

      // Build reasoning map: agent_id -> reasoning
      const reasoningMap = new Map<string, string>();
      trades?.forEach((t: any) => {
        const decision = Array.isArray(t.decisions) ? t.decisions[0] : t.decisions;
        if (decision?.parsed_response?.bets) {
          const bet = decision.parsed_response.bets.find(
            (b: any) => b.market_id === t.market_id
          );
          if (bet?.reasoning && !reasoningMap.has(t.agent_id)) {
            reasoningMap.set(t.agent_id, bet.reasoning);
          }
        }
      });

      const mappedPositions = (positions || []).map((p: any) => ({
        id: p.id,
        side: p.side,
        shares: parseFloat(p.shares),
        avg_entry_price: parseFloat(p.avg_entry_price),
        total_cost: parseFloat(p.total_cost),
        current_value: parseFloat(p.current_value),
        unrealized_pnl: parseFloat(p.unrealized_pnl),
        model_name: p.agents.models.display_name,
        model_color: p.agents.models.color,
        reasoning: reasoningMap.get(p.agents.id) || null,
      })) as Position[];

      return { market: market as MarketData, positions: mappedPositions };
    },
    enabled: !!slug,
  });

  const market = data?.market;
  const positions = data?.positions || [];

  const yesPrice = market?.current_price || 0;
  const noPrice = 1 - yesPrice;
  const volume = market?.volume || 0;

  const daysLeft = market
    ? Math.ceil(
        (new Date(market.close_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const totalInvested = positions?.reduce((sum, p) => sum + p.total_cost, 0) || 0;
  const yesPositions = positions?.filter((p) => p.side === "YES") || [];
  const noPositions = positions?.filter((p) => p.side === "NO") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 xl:px-20 py-8">
        {/* Back link */}
        <Link
          to="/markets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !market ? (
          <div className="text-center py-12 border-2 border-foreground bg-muted/30">
            <p className="text-lg font-medium">Market not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">
                  {market.question}
                </h1>
                {market.event_slug && (
                  <a
                    href={`https://polymarket.com/event/${market.event_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {market.category && (
                  <Badge variant="outline">{market.category}</Badge>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {daysLeft > 0 ? `${daysLeft} days left` : "Ended"}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(volume)} volume
                </span>
              </div>
            </div>

            {/* Price cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="border-2 border-foreground bg-green-500/10 p-6">
                <p className="text-sm font-medium text-green-600 mb-2">YES</p>
                <p className="text-4xl font-bold text-green-500">
                  {formatPercent(yesPrice)}
                </p>
              </div>
              <div className="border-2 border-foreground bg-red-500/10 p-6">
                <p className="text-sm font-medium text-red-600 mb-2">NO</p>
                <p className="text-4xl font-bold text-red-500">
                  {formatPercent(noPrice)}
                </p>
              </div>
            </div>

            {/* AI Positions */}
            <div className="border-2 border-foreground bg-background mb-8">
              <div className="p-4 border-b-2 border-foreground bg-muted/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Positions
                  </h2>
                  {totalInvested > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(totalInvested)} invested
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                {!positions?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No AI models have positions on this market
                  </p>
                ) : (
                  <div className="space-y-3">
                    {yesPositions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-500 mb-2">
                          Betting YES ({yesPositions.length})
                        </p>
                        <div className="space-y-2">
                          {yesPositions.map((pos) => (
                            <div
                              key={pos.id}
                              className="p-3 border border-green-500/30 bg-green-500/5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: pos.model_color }}
                                  />
                                  <span className="font-medium">{pos.model_name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">
                                    {formatCurrency(pos.total_cost)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {pos.shares.toFixed(1)} shares @ {formatPercent(pos.avg_entry_price)}
                                  </p>
                                </div>
                              </div>
                              {pos.reasoning && (
                                <p className="text-xs italic text-muted-foreground mt-2 border-l-2 border-green-500/50 pl-2">
                                  "{pos.reasoning}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {noPositions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-500 mb-2">
                          Betting NO ({noPositions.length})
                        </p>
                        <div className="space-y-2">
                          {noPositions.map((pos) => (
                            <div
                              key={pos.id}
                              className="p-3 border border-red-500/30 bg-red-500/5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: pos.model_color }}
                                  />
                                  <span className="font-medium">{pos.model_name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">
                                    {formatCurrency(pos.total_cost)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {pos.shares.toFixed(1)} shares @ {formatPercent(pos.avg_entry_price)}
                                  </p>
                                </div>
                              </div>
                              {pos.reasoning && (
                                <p className="text-xs italic text-muted-foreground mt-2 border-l-2 border-red-500/50 pl-2">
                                  "{pos.reasoning}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {market.description && (
              <div className="border-2 border-foreground bg-background">
                <div className="p-4 border-b-2 border-foreground bg-muted/30">
                  <h2 className="font-bold">Resolution Criteria</h2>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {market.description}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MarketDetailPage;
