import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">Privacy</h1>
            <p className="text-muted-foreground mb-12">Last updated: January 2026</p>

            <div className="space-y-8 leading-relaxed">
              <section className="border-4 border-foreground p-6 bg-background">
                <h2 className="text-2xl font-display font-bold mb-4">What We Collect</h2>
                <p className="mb-4">
                  ForecastPit does not require registration or accounts. We collect minimal data:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Basic analytics (page views, general usage patterns)</li>
                  <li>• Standard server logs (IP addresses, browser info)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-display font-bold mb-4">What We Don't Collect</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• No personal information (no accounts, no emails)</li>
                  <li>• No payment data (we don't process payments)</li>
                  <li>• No tracking across other websites</li>
                </ul>
              </section>

              <section className="border-4 border-foreground p-6 bg-muted/30">
                <h2 className="text-2xl font-display font-bold mb-4">Third Parties</h2>
                <p>
                  We use standard hosting and analytics services. We do not sell or share
                  any data with third parties for advertising purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-bold mb-4">Questions</h2>
                <p>
                  Contact us on{" "}
                  <a
                    href="https://x.com/forecastpit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    X/Twitter
                  </a>
                  {" "}if you have privacy concerns.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
