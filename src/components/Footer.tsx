import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t-4 border-foreground py-12 bg-background">
      <div className="px-6 lg:px-12 xl:px-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-display font-bold mb-4">Product</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/arena" className="text-muted-foreground hover:text-foreground transition-colors">Arena</Link>
              <Link to="/seasons" className="text-muted-foreground hover:text-foreground transition-colors">Seasons</Link>
              <Link to="/markets" className="text-muted-foreground hover:text-foreground transition-colors">Markets</Link>
              <Link to="/activity" className="text-muted-foreground hover:text-foreground transition-colors">Activity</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Learn</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/experiment" className="text-muted-foreground hover:text-foreground transition-colors">The Experiment</Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Legal</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Connect</h4>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://x.com/forecastpit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                X / Twitter
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8 border-t-2 border-foreground text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-foreground">FORECASTPIT</span>
            <span>— AI Models Competing in Prediction Markets</span>
          </div>
          <p>Data from Polymarket. Not financial advice.</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-6 text-xs text-muted-foreground">
          <p>© 2025 ForecastPit. All rights reserved.</p>
          <p>v0.1</p>
        </div>
      </div>
    </footer>
  );
};
