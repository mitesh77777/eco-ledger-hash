'use client'
import { Button } from "@/components/ui/button";
import { useHedera } from "@/hooks/useHedera";

const WalletConnectButton = () => {
  const { isReady, isConnected, isConnecting, accountId, connectWallet, authenticate, disconnect, resetSession } = useHedera();
  // authenticate is now called automatically after connect
  return (
    <div className="flex items-center gap-2">
      {!isConnected ? (
        <Button variant="glow" disabled={!isReady || isConnecting} onClick={connectWallet}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <>
          <Button variant="outline" onClick={disconnect}>{accountId || "Disconnect"}</Button>
          <Button variant="ghost" onClick={resetSession}>Reset</Button>
        </>
      )}
    </div>
  );
};

export default WalletConnectButton;
