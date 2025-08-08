import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSampleRECs } from "@/services/mock";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

const COLORS: Record<string, string> = {
  solar: "#10B981",
  wind: "#3B82F6",
  hydro: "#06B6D4",
};

const Impact = () => {
  useEffect(() => {
    document.title = "Impact Dashboard | Eco Ledger";
    const desc = document.querySelector('meta[name="description"]') || (() => { const m = document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m); return m; })();
    desc.setAttribute('content', 'Environmental impact from your Renewable Energy Certificates (RECs): carbon offset, source mix, and progress.');
  }, []);

  const recs = useMemo(() => getSampleRECs(), []);
  const totals = useMemo(() => {
    const totalMWh = recs.reduce((s, r) => s + r.mwh, 0);
    const totalSpent = recs.reduce((s, r) => s + r.mwh * r.price, 0);
    const mix = recs.reduce<Record<string, number>>((acc, r) => { acc[r.energy_source] = (acc[r.energy_source] || 0) + r.mwh; return acc; }, {});
    const carbonOffset = totalMWh * 0.4;
    return { totalMWh, totalSpent, mix, carbonOffset };
  }, [recs]);

  const pieData = Object.entries(totals.mix).map(([k, v]) => ({ name: k, value: v }));
  const monthly = [
    { month: 'Jan', clean: 120, other: 80 },
    { month: 'Feb', clean: 150, other: 70 },
    { month: 'Mar', clean: 180, other: 60 },
    { month: 'Apr', clean: 220, other: 40 },
    { month: 'May', clean: 280, other: 20 },
    { month: 'Jun', clean: 320, other: 10 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-6 md:px-8 pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Environmental Impact Dashboard – Renewable Energy Certificates</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Track carbon offset, energy source composition, and progress powered by Hedera’s efficient ledger.</p>
      </header>

      <main className="container mx-auto px-6 md:px-8 py-12 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Total RECs</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary">{recs.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Clean Energy</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-accent">{totals.totalMWh} MWh</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Carbon Offset</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{totals.carbonOffset.toFixed(0)} tCO₂</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Investment</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">${totals.totalSpent.toLocaleString()}</div></CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle>Energy Source Mix</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${((value/(totals.totalMWh||1))*100).toFixed(1)}%`}>
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} MWh`, 'Energy']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Renewable Progress</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clean" name="Renewable" fill="#10B981" />
                  <Bar dataKey="other" name="Other" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Impact Equivalents */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl mb-2">🌱</div><div className="text-2xl font-bold text-primary">{(totals.carbonOffset * 2.5).toFixed(0)}</div><div className="text-sm text-muted-foreground">Trees Equivalent</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl mb-2">🚗</div><div className="text-2xl font-bold text-accent">{(totals.carbonOffset * 2500).toFixed(0)}</div><div className="text-sm text-muted-foreground">Miles Not Driven</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl mb-2">🏠</div><div className="text-2xl font-bold">{Math.floor(totals.totalMWh / 10.8)}</div><div className="text-sm text-muted-foreground">Homes Powered</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl mb-2">⚡</div><div className="text-2xl font-bold">{totals.totalMWh}</div><div className="text-sm text-muted-foreground">Clean MWh</div></CardContent></Card>
        </section>
      </main>
    </div>
  );
};

export default Impact;
