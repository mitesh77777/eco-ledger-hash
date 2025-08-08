import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import logoMark from "@/assets/ecoledger-mark.png";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-30 bg-gradient-to-b from-background/60 to-background/0 supports-[backdrop-filter]:bg-background/30 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 hover-scale">
          <img src={logoMark} alt="EcolLedger logo" className="h-8 w-8 rounded-md" />
          <span className="font-semibold tracking-tight">EcolLedger</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#producer" className="story-link text-muted-foreground hover:text-foreground transition-colors">Producer</a>
          <a href="#market" className="story-link text-muted-foreground hover:text-foreground transition-colors">Marketplace</a>
          <Link to="/impact" className="story-link text-muted-foreground hover:text-foreground transition-colors">Impact</Link>
          <Link to="/portfolio" className="story-link text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline">Docs</Button>
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
