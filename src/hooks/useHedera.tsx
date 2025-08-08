import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authApi, session } from "@/services/auth";
import type SignClient from "@walletconnect/sign-client";

export type HederaContextType = {
  accountId: string | null;
  isConnected: boolean;
  isConnecting?: boolean;
  isAuthed?: boolean;
  isReady: boolean;
  connectWallet: () => Promise<void>;
  authenticate: () => Promise<void>;
  disconnect: () => void;
  pairingString?: string; // not used by HWC, kept for UI compatibility
  resetSession?: () => void;
};
const HederaContext = createContext<HederaContextType | undefined>(undefined);

export const HederaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const signClientRef = useRef<SignClient | null>(null);
  const sessionRef = useRef<any>(null);
  const wcModalRef = useRef<any>(null);

  const projectId = (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || "0713d5bba570b1fa6a176fd49fbf1dc6";
  const appMetadata = {
    name: "Eco Ledger",
    description: "REC trading on Hedera",
    url: window.location.origin,
    icons: ["/favicon.ico"],
  };

  // Dynamically import WC SignClient and Modal
  useEffect(() => {
    (async () => {
      try {
        const [{ default: SignClient }, { WalletConnectModal }] = await Promise.all([
          import("@walletconnect/sign-client"),
          import("@walletconnect/modal"),
        ]);

        signClientRef.current = await SignClient.init({ projectId, metadata: appMetadata });
        wcModalRef.current = new WalletConnectModal({ projectId, themeMode: "dark" });

        setReady(true);
      } catch (e) {
        console.error("WalletConnect init failed", e);
        toast({ title: "WalletConnect failed to load", description: "Please refresh or check network.", duration: 5000 });
      }
    })();
  }, [toast, projectId]);

  const parseAccounts = (session: any): string[] => {
    try {
      const namespaces = session?.namespaces || {};
      const all: string[] = [];
      Object.values(namespaces).forEach((ns: any) => {
        (ns?.accounts || []).forEach((acct: string) => all.push(acct));
      });
      // Expected format: "hedera:testnet:0.0.x"
      const parsed = all
        .map((s) => s.split(":").pop() as string)
        .filter((v) => v && v.includes("."));
      return parsed;
    } catch {
      return [];
    }
  };

  const connectWallet = useCallback(async () => {
    if (!signClientRef.current) return;
    if (!ready) {
      toast({ title: "Initializing wallet...", description: "Please try again in a second." });
      return;
    }
    try {
      setConnecting(true);
      // Open modal and start connect
      const { uri, approval } = await signClientRef.current.connect({
        requiredNamespaces: {
          hedera: {
            chains: ["hedera:testnet"],
            methods: [
              "hedera_signMessage",
              "hedera_sign",
              "sign_message",
              "signMessage",
            ],
            events: [],
          },
        },
      });
      if (uri) wcModalRef.current?.openModal({ uri });
      const session = await approval();
      wcModalRef.current?.closeModal();
      sessionRef.current = session;
      const accounts = parseAccounts(session);
      const acc = accounts[0] || null;
      setAccountId(acc);
      if (acc) toast({ title: "Wallet connected", description: acc });
      // Auto-authenticate right after connect
      if (acc) {
        try {
          await doAuthenticate(acc);
        } catch (e) {
          // Non-fatal: remain connected even if auth fails
        }
      }
    } catch (e) {
      console.error("WC connect error", e);
      toast({ title: "Connection failed", description: "Approve in your wallet or try again." });
    } finally {
      setConnecting(false);
    }
  }, [ready, toast]);

  // Internal authenticate helper allowing an explicit accountId override
  const doAuthenticate = useCallback(async (accountOverride?: string) => {
    const acct = accountOverride || accountId;
    if (!signClientRef.current || !sessionRef.current || !acct) {
      toast({ title: "Connect wallet", description: "Please connect your wallet first." });
      return;
    }
    try {
      const { nonce } = await authApi.nonce(acct);
      const message = `EcoLedger Login\nAccount: ${acct}\nNonce: ${nonce}`;
  const messageBytes = new TextEncoder().encode(message);
  const messageBase64 = btoa(String.fromCharCode(...messageBytes));
  const toHex = (u8: Uint8Array) => Array.from(u8).map((b) => b.toString(16).padStart(2, '0')).join('');
  const messageHex = toHex(messageBytes);
      toast({ title: "Check Wallet", description: "Approve the sign-in message." });

      // Determine chainId and allowed methods from session to avoid undefined errors
  const sess = sessionRef.current;
      const namespaces = sess?.namespaces || {};
      const hederaNs: any = namespaces['hedera'] || Object.values(namespaces)[0];
  let derivedChainId = Array.isArray(hederaNs?.chains) && hederaNs.chains.length > 0
        ? hederaNs.chains[0]
        : (hederaNs?.accounts?.[0]?.split(':').slice(0,2).join(':')) || undefined;
  if (!derivedChainId) derivedChainId = 'hedera:testnet';
      const allowedMethods: string[] = Array.isArray(hederaNs?.methods) ? hederaNs.methods : [];
      const accountsList: string[] = Array.isArray(hederaNs?.accounts) ? hederaNs.accounts : [];
  const caipAccount = accountsList[0] || `hedera:testnet:${acct}`;
      if (derivedChainId && typeof derivedChainId !== 'string') {
        throw new Error('Wallet session missing Hedera chain');
      }
  // Proceed even if methods are not advertised; some wallets accept default method

      // Pick a supported signing method
      const methodCandidates = ['hedera_signMessage', 'hedera_sign', 'sign_message', 'signMessage'];
  const method = methodCandidates.find((m) => allowedMethods.includes(m)) || 'hedera_signMessage';
      if (!method) {
        console.warn('No compatible sign method in wallet', { allowedMethods });
        throw new Error('Wallet does not support message signing');
      }

      let signatureHex: string | null = null;
      let res: any = null;
      // Request signature via Hedera JSON-RPC (try a few param shapes for wallet compatibility)
      const tryRequest = async (params: any) => {
        const base: any = { topic: sess.topic, chainId: derivedChainId, request: { method, params } };
        return await signClientRef.current!.request(base);
      };
      try {
        // Prefer CAIP account with base64
        res = await tryRequest({ account: caipAccount, message: messageBase64, isBase64: true });
      } catch (e1: any) {
        try { res = await tryRequest({ account: acct, message: messageBase64, isBase64: true }); }
        catch (e2: any) {
          try { res = await tryRequest({ account: caipAccount, message }); }
          catch (e3: any) {
            try { res = await tryRequest({ account: caipAccount, message: messageHex, encoding: 'hex' }); }
            catch (e4: any) {
              try { res = await tryRequest([caipAccount, messageBase64]); }
              catch (e5: any) {
                try { res = await tryRequest([acct, messageBase64]); }
                catch (e6: any) {
                  // last fallback
                  res = await tryRequest([messageBase64, acct]);
                }
              }
            }
          }
        }
      }
      signatureHex = res?.signatureHex || res?.signature || res || null;
      if (!signatureHex) throw new Error("Wallet signature not available");

      const { token } = await authApi.verify(acct, signatureHex);
      session.set(token);
      setAuthed(true);
      toast({ title: "Authenticated", description: "Session established" });
    } catch (e: any) {
      console.warn("Auth failed", e);
      const desc = (e?.message || String(e)).toString();
      toast({ title: "Auth failed", description: desc.includes('includes') ? 'Wallet request failed; reconnect and try again.' : desc });
    }
  }, [accountId, toast]);

  // Public authenticate uses current state
  const authenticate = useCallback(async () => doAuthenticate(), [doAuthenticate]);

  const disconnect = useCallback(() => {
    try {
  const t = sessionRef.current?.topic;
  if (t && signClientRef.current) signClientRef.current.disconnect({ topic: t, reason: { code: 6000, message: "User disconnected" } });
    } catch {}
    setAccountId(null);
    setAuthed(false);
    session.clear();
  }, []);

  const resetSession = useCallback(() => {
    try {
  const t = sessionRef.current?.topic;
  if (t && signClientRef.current) signClientRef.current.disconnect({ topic: t, reason: { code: 6000, message: "Reset" } });
      // also nuke any wc storage keys
      const clear = (store: Storage) => {
        const keys: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i); if (!k) continue;
          if (k.includes("walletconnect") || k.startsWith("wc@")) keys.push(k);
        }
        keys.forEach((k) => store.removeItem(k));
      };
      clear(localStorage); clear(sessionStorage);
    } finally {
      window.location.reload();
    }
  }, []);

  const value = useMemo(() => ({
    accountId,
    isConnected: !!accountId,
    isConnecting: connecting,
    isAuthed: authed,
    isReady: ready,
    connectWallet,
  authenticate,
    disconnect,
    pairingString: undefined,
    resetSession,
  }), [accountId, connecting, authed, ready, connectWallet, authenticate, disconnect, resetSession]);

  return <HederaContext.Provider value={value}>{children}</HederaContext.Provider>;
};

export const useHedera = () => {
  const ctx = useContext(HederaContext);
  if (!ctx) {
    return {
      accountId: null,
      isConnected: false,
      connectWallet: async () => console.warn("HederaProvider not mounted yet"),
      disconnect: () => undefined,
    } as HederaContextType;
  }
  return ctx;
};
