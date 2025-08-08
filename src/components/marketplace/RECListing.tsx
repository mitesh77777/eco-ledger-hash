import { useEffect, useMemo, useState } from "react";
import type { REC } from "@/services/mock";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { useHedera } from "@/hooks/useHedera";

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
    {children}
  </span>
);

const RecCard = ({ rec, onPurchase }: { rec: REC; onPurchase: (rec: REC) => void }) => (
  <div className="rounded-lg border p-5 transition-transform hover:-translate-y-0.5">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2">
        <Badge>{rec.energy_source}</Badge>
        <span className="text-sm text-muted-foreground">{rec.location}</span>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">${rec.price}</div>
        <div className="text-xs text-muted-foreground">per MWh</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
      <div className="text-muted-foreground">Size</div>
      <div className="font-medium">{rec.mwh} MWh</div>
      <div className="text-muted-foreground">Generated</div>
      <div className="font-medium">{new Date(rec.generation_date).toLocaleDateString()}</div>
    </div>
    <Button variant="glow" className="w-full" onClick={() => onPurchase(rec)}>
      Purchase REC
    </Button>
  </div>
);

const RECListing = () => {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const [recs, setRecs] = useState<REC[]>([]);
  const { accountId, isConnected, isAuthed, authenticate } = useHedera();
  const [assocInfo, setAssocInfo] = useState<{ tokenId: string; recId: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.listRECs();
        setRecs(data as REC[]);
      } catch (e: any) {
        toast({ title: "Failed to load RECs", description: e?.message || String(e) });
      }
    })();
  }, [toast]);

  const filtered = useMemo(
    () =>
      recs.filter((r) => (filter === "all" ? true : r.energy_source === (filter as REC["energy_source"]))),
    [recs, filter]
  );

  const onPurchase = async (rec: REC) => {
    try {
      if (!isConnected || !accountId) {
        toast({ title: "Connect wallet", description: "Please connect your Hedera wallet to purchase." });
        return;
      }
      if (!isAuthed) {
        toast({ title: "Authenticate", description: "Please authenticate to continue." });
        try { await authenticate(); } catch {}
        if (!isAuthed) return;
      }
      await api.purchaseREC(rec.id, accountId);
      toast({ title: "REC purchased", description: `${rec.id} purchased successfully.` });
      setRecs((prev) => prev.filter((r) => r.id !== rec.id));
    } catch (e: any) {
      const msg = e?.message || String(e);
      const data = e?.data || {};
      if (data?.error === 'TOKEN_NOT_ASSOCIATED' && data?.tokenId) {
        setAssocInfo({ tokenId: data.tokenId, recId: rec.id });
        toast({ title: "Token association required", description: "Please associate the token in HashPack and retry." });
      } else if (msg.includes('Hedera not configured')) {
        toast({ title: "Server not configured", description: 'Set backend .env (HEDERA_ACCOUNT_ID & HEDERA_PRIVATE_KEY) and restart.' });
      } else {
        toast({ title: "Purchase failed", description: msg });
      }
    }
  };

  return (
    <section id="market" className="container mx-auto px-6 md:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Marketplace</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="all">All sources</option>
          <option value="solar">Solar</option>
          <option value="wind">Wind</option>
          <option value="hydro">Hydro</option>
        </select>
      </div>

      {assocInfo && (
        <div className="mb-6 rounded-md border bg-card p-4">
          <div className="font-medium mb-2">Token association needed</div>
          <p className="text-sm text-muted-foreground mb-3">
            Your wallet must associate the token before purchase. In HashPack, go to Tokens → Associate → paste token ID.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(assocInfo.tokenId); }}>Copy Token ID</Button>
            <Button onClick={() => onPurchase(recs.find(r => r.id === assocInfo.recId) as REC)}>I associated, retry</Button>
            <span className="text-xs text-muted-foreground">Token: {assocInfo.tokenId}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <RecCard key={r.id} rec={r} onPurchase={onPurchase} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No RECs available.</div>
      )}
    </section>
  );
};

export default RECListing;
