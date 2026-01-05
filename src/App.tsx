import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";
import Index from "./pages/Index";
import ArenaPage from "./pages/ArenaPage";
import ActivityPage from "./pages/ActivityPage";
import MarketsPage from "./pages/MarketsPage";
import MarketDetailPage from "./pages/MarketDetailPage";
import ModelDetailPage from "./pages/ModelDetailPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ExperimentPage from "./pages/ExperimentPage";
import SeasonsPage from "./pages/SeasonsPage";
import SeasonDetailPage from "./pages/SeasonDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Analytics tracker component
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="forecastpit-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <ScrollToTop />
          <ScrollToTopButton />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/arena" element={<ArenaPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/seasons/:number" element={<SeasonDetailPage />} />
            <Route path="/models/:id" element={<ModelDetailPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/markets/:slug" element={<MarketDetailPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/experiment" element={<ExperimentPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
