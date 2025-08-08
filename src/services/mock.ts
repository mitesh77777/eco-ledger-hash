export type REC = {
  id: string;
  energy_source: "solar" | "wind" | "hydro";
  location: string;
  mwh: number;
  price: number;
  generation_date: string;
};

export const getSampleRECs = (): REC[] => [
  {
    id: "REC-SOLAR-001",
    energy_source: "solar",
    location: "Mojave Desert, CA",
    mwh: 100,
    price: 45,
    generation_date: "2024-07-01",
  },
  {
    id: "REC-WIND-002",
    energy_source: "wind",
    location: "Texas Wind Farm",
    mwh: 150,
    price: 42,
    generation_date: "2024-07-01",
  },
  {
    id: "REC-HYDRO-003",
    energy_source: "hydro",
    location: "Columbia River Basin",
    mwh: 80,
    price: 39,
    generation_date: "2024-06-15",
  },
];

export const generateSolarSnapshot = () => {
  const hour = new Date().getHours();
  const base = Math.sin(((hour - 6) * Math.PI) / 12) * 80 + 20;
  return {
    currentOutput: Math.max(0, base + Math.random() * 20 - 10),
    efficiency: 92 + Math.random() * 6,
    weather: hour > 6 && hour < 18 ? "sunny" : "night",
  };
};
