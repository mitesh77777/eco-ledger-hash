import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useHedera } from "@/hooks/useHedera";

const Portfolio = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ recs: any[]; stats: any } | null>(null);
  const { isConnected, isAuthed, connectWallet } = useHedera();
  const canView = useMemo(() => isConnected && isAuthed, [isConnected, isAuthed]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.portfolio();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      load();
    }
  }, [canView]);

  const retire = async (id: string) => {
    await api.retireREC(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 md:px-8 py-12 space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">Your Portfolio</h1>
        {!canView && (
          <div className="rounded-md border bg-card p-6">
            <div className="font-medium mb-2">Connect and authenticate</div>
            <p className="text-sm text-muted-foreground mb-3">Please connect your Hedera wallet and complete the sign-in challenge to view your portfolio.</p>
            <Button onClick={connectWallet}>Connect wallet</Button>
          </div>
        )}
        {canView && loading && <div>Loading...</div>}
        {canView && !loading && data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total RECs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{data.stats.totalRECs}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total MWh</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-accent">{data.stats.totalMWh}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Spent</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">${data.stats.totalSpent.toLocaleString()}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Carbon Offset</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{data.stats.carbonOffset}</div></CardContent></Card>
            </div>

            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b font-medium">Holdings</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-2 text-left">Source</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">MWh</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recs.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-2 capitalize">{r.energy_source}</td>
                        <td className="px-4 py-2">{r.location}</td>
                        <td className="px-4 py-2">{r.mwh}</td>
                        <td className="px-4 py-2">{r.status}</td>
                        <td className="px-4 py-2">
                          {r.status === 'active' && <Button size="sm" onClick={() => retire(r.id)}>Retire</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
  )}
      </main>
    </div>
  );
};

export default Portfolio;
