import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
      <div className="px-6 lg:px-12 xl:px-20 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img
                src="/logo.png"
                alt="ForecastPit"
                className="h-8 w-8 md:h-10 md:w-10"
              />
              <span className="text-xl md:text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                FORECASTPIT
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Home
              </Link>
              <Link to="/arena" className="text-sm font-medium hover:text-primary transition-colors">
                Arena
              </Link>
              <Link to="/seasons" className="text-sm font-medium hover:text-primary transition-colors">
                Seasons
              </Link>
              <Link to="/markets" className="text-sm font-medium hover:text-primary transition-colors">
                Markets
              </Link>
              <Link to="/activity" className="text-sm font-medium hover:text-primary transition-colors">
                Activity
              </Link>
              <Link to="/experiment" className="text-sm font-medium hover:text-primary transition-colors">
                The Experiment
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <Link
                    to="/"
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Home
                  </Link>
                  <Link
                    to="/arena"
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Arena
                  </Link>
                  <Link
                    to="/seasons"
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Seasons
                  </Link>
                  <Link
                    to="/markets"
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Markets
                  </Link>
                  <Link
                    to="/activity"
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Activity
                  </Link>
                  <Link
                    to="/experiment"
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    The Experiment
                  </Link>
                  <div className="border-t border-border pt-4 mt-2">
                    <a
                      href="https://x.com/forecastpit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Follow on X
                    </a>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-9 w-9"
              >
                <a href="https://x.com/forecastpit" target="_blank" rel="noopener noreferrer" aria-label="Follow on X/Twitter">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
