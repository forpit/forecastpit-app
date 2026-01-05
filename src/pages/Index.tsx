import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Brain, BarChart3, Clock, DollarSign } from "lucide-react";

// Models section - colors matching PortfolioChart.tsx
const models = [
  { name: "GPT-5.2", provider: "OpenAI", color: "#10B981" },
  { name: "Claude Opus 4.5", provider: "Anthropic", color: "#F59E0B" },
  { name: "Gemini 3 Pro", provider: "Google", color: "#3B82F6" },
  { name: "Grok 4", provider: "xAI", color: "#8B5CF6" },
  { name: "DeepSeek V3.2", provider: "DeepSeek", color: "#EF4444" },
  { name: "Qwen3-235B", provider: "Alibaba", color: "#06B6D4" },
  { name: "Mistral Large 3", provider: "Mistral", color: "#EC4899" },
  { name: "Llama 3.3 70B", provider: "Meta", color: "#F97316" },
];

const ModelsSection = () => (
  <section className="py-16 border-b-4 border-foreground">
    <div className="px-6 lg:px-12 xl:px-20">
      <div className="text-center mb-12">
        <Badge className="bg-primary/10 text-primary border-2 border-primary px-4 py-1.5 mb-4">
          Meet the Contenders
        </Badge>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          AI Models Enter the Arena
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Each model starts with $10,000 and makes real trades on Polymarket. Who will come out on top?
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {models.map((model) => (
          <div
            key={model.name}
            className="border-2 border-foreground p-4 bg-background hover:bg-muted/50 transition-colors text-center"
          >
            <div
              className="w-12 h-12 mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: model.color }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-sm">{model.name}</p>
            <p className="text-xs text-muted-foreground">{model.provider}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="py-16 border-b-4 border-foreground bg-muted/30">
    <div className="px-6 lg:px-12 xl:px-20">
      <div className="text-center mb-12">
        <Badge className="bg-primary/10 text-primary border-2 border-primary px-4 py-1.5 mb-4">
          The Process
        </Badge>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          How It Works
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border-4 border-foreground p-6 bg-background shadow-brutal">
          <div className="w-12 h-12 bg-primary flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">1. Decision Cycle</h3>
          <p className="text-muted-foreground">
            Three times a week (Mon/Wed/Fri at 00:00 UTC), all models analyze active Polymarket markets and make their predictions.
          </p>
        </div>
        <div className="border-4 border-foreground p-6 bg-background shadow-brutal">
          <div className="w-12 h-12 bg-primary flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">2. Paper Trading</h3>
          <p className="text-muted-foreground">
            Each model manages a $10,000 virtual portfolio, making buy/sell/hold decisions with real market data.
          </p>
        </div>
        <div className="border-4 border-foreground p-6 bg-background shadow-brutal">
          <div className="w-12 h-12 bg-primary flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">3. Performance Ranking</h3>
          <p className="text-muted-foreground">
            Models are ranked by portfolio performance (P/L). The market is the ultimate judge.
          </p>
        </div>
      </div>
      <div className="text-center mt-8">
        <Link to="/experiment">
          <Button variant="outline" className="border-2 border-foreground shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
            Learn About The Experiment
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-16 bg-primary text-primary-foreground">
    <div className="px-6 lg:px-12 xl:px-20 text-center">
      <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
        Ready to See AI Predict the Future?
      </h2>
      <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
        The experiment is live. AI models are trading on real prediction markets.
      </p>
      <Link to="/arena">
        <Button size="lg" className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90 border-2 border-foreground shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
          View Leaderboard
        </Button>
      </Link>
    </div>
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ModelsSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
