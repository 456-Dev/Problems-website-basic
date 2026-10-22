import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import AmericaPage from "@/components/america/AmericaPage";
import "@/components/america/america.css";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "800"], variable: "--oqa-font" });

const desc = "A documentary by Michael Linares. Three questions, 221 strangers, eleven days in a car from Los Angeles to New York City, July 2024. Watch it free.";

export const metadata: Metadata = {
  title: "One Question for America — a documentary by Michael Linares",
  description: desc,
  openGraph: {
    title: "One Question for America",
    description: desc,
    url: "https://456solutions.org/america",
    type: "video.movie",
    images: [{ url: "https://456solutions.org/assets/america/film/poster.jpg", width: 1280, height: 720 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function America() {
  return (
    <div className={openSans.variable}>
      <AmericaPage />
    </div>
  );
}
