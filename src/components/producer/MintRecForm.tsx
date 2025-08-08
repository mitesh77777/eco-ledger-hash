import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const MintRecForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    energySource: "solar",
    location: "California Solar Farm",
    mwh: 100,
    price: 45,
    generationDate: new Date().toISOString().split("T")[0],
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "REC minted", description: `Minted ${form.mwh} MWh (${form.energySource}).` });
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
      <Button type="submit" variant="hero" className="w-full">Mint REC</Button>
    </form>
  );
};

export default MintRecForm;
