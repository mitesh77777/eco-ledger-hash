import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSolarSnapshot } from "@/services/mock";
import { cn } from "@/lib/utils";
import MintRecForm from "./MintRecForm";

const MetricCard = ({ title, value, accent }: { title: string; value: string; accent: "primary" | "accent" | "muted" }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={cn("text-3xl font-bold", accent === "primary" ? "text-primary" : accent === "accent" ? "text-accent" : "text-muted-foreground")}>{value}</div>
    </CardContent>
  </Card>
);

const EnergyDashboard = () => {
  const [snapshot, setSnapshot] = useState(generateSolarSnapshot());

  useEffect(() => {
    const i = setInterval(() => setSnapshot(generateSolarSnapshot()), 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <section id="producer" className="container mx-auto px-6 md:px-8 py-12">
      <h2 className="text-2xl font-semibold tracking-tight mb-6">Producer dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Current Output" value={`${snapshot.currentOutput.toFixed(1)} MW`} accent="primary" />
          <MetricCard title="Efficiency" value={`${snapshot.efficiency.toFixed(1)}%`} accent="accent" />
          <MetricCard title="Weather" value={snapshot.weather} accent="muted" />
        </div>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mint new REC</CardTitle>
          </CardHeader>
          <CardContent>
            <MintRecForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default EnergyDashboard;
