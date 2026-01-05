import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="max-w-2xl w-full border-2 border-foreground p-8 md:p-12 bg-background text-center">
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Page not found</h2>
          <p className="text-lg text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="default" size="lg" className="bg-emerald-600 text-white border-2 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700">
                Go to Homepage
              </Button>
            </Link>
            <Link to="/games">
              <Button variant="outline" size="lg" className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                Browse Games
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
