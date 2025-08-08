import { useMemo, useState } from "react";
import { getSampleRECs, type REC } from "@/services/mock";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const [recs, setRecs] = useState<REC[]>(getSampleRECs());

  const filtered = useMemo(
    () =>
      recs.filter((r) => (filter === "all" ? true : r.energy_source === (filter as REC["energy_source"]))),
    [recs, filter]
  );

  const onPurchase = (rec: REC) => {
    toast({ title: "REC purchased", description: `${rec.id} purchased successfully.` });
    setRecs((prev) => prev.filter((r) => r.id !== rec.id));
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
