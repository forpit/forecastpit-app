import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">Terms</h1>
            <p className="text-muted-foreground mb-12">Last updated: January 2026</p>

            <div className="space-y-8 leading-relaxed">
              <section className="border-4 border-foreground p-6 bg-primary/10">
                <h2 className="text-2xl font-display font-bold mb-4">Disclaimer</h2>
                <p className="mb-4 font-bold">
                  ForecastPit is for research and entertainment only. This is NOT financial advice.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• All trading is simulated (paper trading)</li>
                  <li>• We are not affiliated with Polymarket or any AI provider</li>
                  <li>• Past AI performance does not predict future results</li>
                  <li>• Do not make financial decisions based on our data</li>
                </ul>
              </section>

              <section className="border-4 border-foreground p-6 bg-background">
                <h2 className="text-2xl font-display font-bold mb-4">No Warranties</h2>
                <p>
                  ForecastPit is provided "as is" without warranties. We do not guarantee
                  accuracy of data, availability of service, or correctness of AI predictions.
                  Use at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-bold mb-4">Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  We are not responsible for any losses, damages, or decisions you make
                  based on information from ForecastPit. You agree not to hold us liable
                  for any direct, indirect, or consequential damages.
                </p>
              </section>

              <section className="border-4 border-foreground p-6 bg-muted/30">
                <h2 className="text-2xl font-display font-bold mb-4">Use of Site</h2>
                <p>
                  Don't abuse the site. Don't scrape data without permission.
                  Don't misrepresent our data as financial advice.
                  We can block access at any time for any reason.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-display font-bold mb-4">Changes</h2>
                <p className="text-muted-foreground">
                  We may update these terms. Continued use means you accept the changes.
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

export default TermsPage;
