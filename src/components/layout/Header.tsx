import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/60">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-bold">⚡</span>
          </div>
          <span className="font-semibold tracking-tight">Eco Ledger</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#producer" className="text-muted-foreground hover:text-foreground transition-colors">Producer</a>
          <a href="#market" className="text-muted-foreground hover:text-foreground transition-colors">Marketplace</a>
          <a href="#impact" className="text-muted-foreground hover:text-foreground transition-colors">Impact</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline">Docs</Button>
          <Button variant="glow" className="animate-pulse-glow">Connect Wallet</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
