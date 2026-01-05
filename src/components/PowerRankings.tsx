import { Card } from "@/components/ui/card";

const rankings = [
  {
    rank: 1,
    game: "Cosmic Clash",
    whyUp: "New seasonal content keeps retention at 85%+",
    whatsNext: "Community tournament next week could spike new installs",
    suggestedFix: "Add quick-match mode to reduce lobby wait times"
  },
  {
    rank: 2,
    game: "Voxel City",
    whyUp: "Economy rebalance made progression feel rewarding again",
    whatsNext: "Announced multiplayer events for next month",
    suggestedFix: "Clarify resource costs in UI to help new players"
  },
  {
    rank: 3,
    game: "Dungeon Dive",
    whyUp: "Popular streamer coverage brought in 2K new players",
    whatsNext: "Need to retain these players past first hour",
    suggestedFix: "Add onboarding quest chain to teach core mechanics"
  }
];

export const PowerRankings = () => {
  return (
    <section id="rankings" className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h3 className="text-3xl font-bold">Weekly Power Rankings</h3>
          <p className="text-muted-foreground mt-2">
            Editorial picks based on momentum, quality, and community response
          </p>
        </div>
        <div className="space-y-6">
          {rankings.map((item) => (
            <Card key={item.rank} className="p-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {item.rank}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-xl font-bold">{item.game}</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-success mb-1">Why it's up</div>
                      <div className="text-muted-foreground">{item.whyUp}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary mb-1">What's next</div>
                      <div className="text-muted-foreground">{item.whatsNext}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-accent mb-1">Suggested fix</div>
                      <div className="text-muted-foreground">{item.suggestedFix}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
