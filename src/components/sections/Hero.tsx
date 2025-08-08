import heroImage from "@/assets/hero-rec.jpg";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    containerRef.current!.style.setProperty("--mouse-x", `${x}%`);
    containerRef.current!.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <section
      aria-label="REC Trading Hero"
      className="relative overflow-hidden"
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative bg-hero"
      >
        <img
          src={heroImage}
          alt="Futuristic renewable energy trading hero image with wind turbines and solar panels"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none"
          loading="eager"
        />
        <div className="relative container mx-auto px-6 md:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Renewable Energy Certificates, settled in seconds on Hedera
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              Mint, trade, and retire RECs with instant, transparent settlement and rich impact insights.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" variant="hero" className="animate-float">Mint REC</Button>
              <Button size="lg" variant="outline">Explore Marketplace</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
