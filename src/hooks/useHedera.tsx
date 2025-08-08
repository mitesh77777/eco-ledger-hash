import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Using any to be resilient to SDK type changes at runtime
let HashConnectRef: any = null;

export type HederaContextType = {
  accountId: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  pairingString?: string;
};

const HederaContext = createContext<HederaContextType | undefined>(undefined);

export const HederaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [pairingString, setPairingString] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const hashconnect = useRef<any>();

  useEffect(() => {
    (async () => {
      try {
        const mod = await import("@hashgraph/hashconnect");
        HashConnectRef = mod.HashConnect || (mod as any).default || mod;
        hashconnect.current = new HashConnectRef();

        const appMetadata = {
          name: "Eco Ledger",
          description: "REC trading on Hedera",
          icon: `${window.location.origin}/favicon.ico`,
        };
        const initData = await hashconnect.current.init(appMetadata, "testnet", true);
        setPairingString(initData.pairingString);

        hashconnect.current.pairingEvent.on((data: any) => {
          const acc = data?.accountIds?.[0] || null;
          setAccountId(acc);
          if (acc) toast({ title: "Wallet connected", description: acc });
        });
        setReady(true);
      } catch (e) {
        console.error("HashConnect init error", e);
        toast({ title: "Wallet SDK failed to load", description: "Install HashPack or try again.", duration: 5000 });
      }
    })();
  }, [toast]);

  const connectWallet = useCallback(async () => {
    if (!ready || !hashconnect.current) return;
    try {
      const state = await hashconnect.current.connect();
      const pairing = state?.pairingString || pairingString;
      if (pairing) await hashconnect.current.connectToLocalWallet(pairing);
    } catch (e) {
      console.error("connectWallet error", e);
      toast({ title: "Connection failed", description: "Open HashPack and try again." });
    }
  }, [ready, pairingString, toast]);

  const disconnect = useCallback(() => {
    setAccountId(null);
    toast({ title: "Disconnected" });
  }, [toast]);

  const value = useMemo(() => ({ accountId, isConnected: !!accountId, connectWallet, disconnect, pairingString }), [accountId, connectWallet, disconnect, pairingString]);

  return <HederaContext.Provider value={value}>{children}</HederaContext.Provider>;
};

export const useHedera = () => {
  const ctx = useContext(HederaContext);
  if (!ctx) throw new Error("useHedera must be used within HederaProvider");
  return ctx;
};
