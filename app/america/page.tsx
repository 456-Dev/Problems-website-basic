import type { Metadata } from "next";
import { Open_Sans, Press_Start_2P } from "next/font/google";
import AmericaPage from "@/components/america/AmericaPage";
import { buildMap } from "@/lib/americaMap";
import "@/components/america/america.css";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "800"], variable: "--oqa-font" });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--oqa-pixel" });

const desc = "A documentary by Michael Linares. Three questions, over 200 strangers, eleven days in a car from Los Angeles to New York City, July 2024. Take the trip, then watch it free.";

export const metadata: Metadata = {
  title: "One Question for America — a documentary by Michael Linares",
  description: desc,
  openGraph: {
    title: "One Question for America",
    description: desc,
    url: "https://456solutions.org/america",
    type: "video.movie",
    images: [{ url: "https://456solutions.org/assets/america/film/og.jpg", width: 1280, height: 720 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function America() {
  // the map is drawn at build time, so the browser only gets finished SVG paths
  const map = buildMap();
  return (
    <div className={`${openSans.variable} ${pixel.variable}`}>
      <AmericaPage map={map} />
    </div>
  );
}
