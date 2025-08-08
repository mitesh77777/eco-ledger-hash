import { Button } from "@/components/ui/button";
import { useHedera } from "@/hooks/useHedera";
import { useMemo } from "react";

const formatId = (id: string) => (id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id);

const WalletConnectButton = () => {
  const { accountId, isConnected, connectWallet, disconnect } = useHedera();
  const label = useMemo(() => (isConnected && accountId ? formatId(accountId) : "Connect Wallet"), [isConnected, accountId]);

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <Button variant="glow" onClick={disconnect}>{label}</Button>
      ) : (
        <Button variant="glow" className="animate-pulse-glow" onClick={connectWallet}>{label}</Button>
      )}
    </div>
  );
};

export default WalletConnectButton;
