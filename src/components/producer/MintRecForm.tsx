import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { useHedera } from "@/hooks/useHedera";

const MintRecForm = () => {
  const { toast } = useToast();
  const { isConnected, isAuthed, authenticate } = useHedera();
  const [form, setForm] = useState({
    energySource: "solar",
    location: "California Solar Farm",
    mwh: 100,
    price: 45,
    generationDate: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast({ title: "Connect wallet", description: "Please connect your Hedera wallet to mint." });
      return;
    }
    if (!isAuthed) {
      toast({ title: "Authenticate", description: "Please authenticate to continue." });
      try { await authenticate(); } catch {}
      return;
    }
    setLoading(true);
    try {
      const res = await api.mintREC({
        energySource: form.energySource,
        location: form.location,
        mwh: form.mwh,
        price: form.price,
        generationDate: form.generationDate,
        // ownerId is set server-side to the treasury (operator) for transfer simplicity
      });
      toast({ title: "REC minted", description: `Token ${res.tokenId} | ${res.rec.id}` });
    } catch (e: any) {
      const msg: string = e?.message || String(e);
      const detail = msg.includes("Hedera not configured") ? "Set backend .env (HEDERA_ACCOUNT_ID & HEDERA_PRIVATE_KEY) and restart." : undefined;
      toast({ title: "Mint failed", description: detail ? `${msg}. ${detail}` : msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Energy Source</Label>
        <select
          value={form.energySource}
          onChange={(e) => setForm((f) => ({ ...f, energySource: e.target.value }))}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="solar">Solar</option>
          <option value="wind">Wind</option>
          <option value="hydro">Hydro</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Location</Label>
        <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Energy (MWh)</Label>
          <Input type="number" value={form.mwh} onChange={(e) => setForm((f) => ({ ...f, mwh: Number(e.target.value) }))} />
        </div>
        <div className="grid gap-2">
          <Label>Price ($/MWh)</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Generation Date</Label>
        <Input type="date" value={form.generationDate} onChange={(e) => setForm((f) => ({ ...f, generationDate: e.target.value }))} />
      </div>
  <Button type="submit" variant="hero" className="w-full" disabled={loading || !isConnected}>{loading ? "Minting..." : "Mint REC"}</Button>
    </form>
  );
};

export default MintRecForm;
