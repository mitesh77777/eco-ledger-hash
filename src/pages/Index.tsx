import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import EnergyDashboard from "@/components/producer/EnergyDashboard";
import RECListing from "@/components/marketplace/RECListing";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main>
        <Hero />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Eco Ledger',
              url: 'https://eco-ledger-hash.lovable.app/',
              description: 'Mint, trade, and retire Renewable Energy Certificates (RECs) on Hedera Hashgraph.'
            }),
          }}
        />
        <EnergyDashboard />
        <RECListing />
      </main>
      <footer id="impact" className="border-t mt-12">
        <div className="container mx-auto px-6 md:px-8 py-12">
          <p className="text-sm text-muted-foreground">Built for REC trading demos on Hedera Hashgraph.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

