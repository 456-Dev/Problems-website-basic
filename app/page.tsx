import type { Metadata } from "next";

// The full homepage is parked in app/_previous-home (a private folder, so it
// isn't a route). To bring it back, move that page.tsx back here.
// The components still import these types from "@/app/page".
export type { Video, AskedQuestion } from "./_previous-home/page";

export const metadata: Metadata = {
  title: "456 Solutions — Michael Linares",
  description: "Question The Day, One Question for America, and They Said You Can't. Street interviews, a documentary, and a photography book by Michael Linares.",
  openGraph: {
    title: "456 Solutions",
    description: "Question The Day, One Question for America, and They Said You Can't.",
    url: "https://456solutions.org/",
    images: [{ url: "https://456solutions.org/qtd/media/og-card.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

// One panel per project. QTD is a static site in public/qtd, so these are plain links.
const panels = [
  { href: "/qtd/", img: "/qtd/media/og-card.png", years: "2025–2026", title: "Question The Day",
    blurb: "One question. About 25 strangers on the street. Watch them answer, then suggest the next one." },
  { href: "/america", img: "/assets/america/flag.jpg", years: "2025", title: "One Question for America",
    blurb: "A road-trip documentary. 3 questions, over 200 strangers, 14 states, Los Angeles to New York." },
  { href: "/book/", img: "/assets/book/cover.jpg", years: "2025", title: "They Said You Can't",
    blurb: "The photography book. 160 full-color pages in 7 sections. Digital, standard, and deluxe." },
];

const css = `
.qtd-home {
  min-height: 100vh; min-height: 100svh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 44px; padding: 48px 20px; background: #000;   /* the logo file sits on pure black */
}
.qtd-home > img { width: min(170px, 40vw); height: auto; display: block; }
.panels {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
  width: 100%; max-width: 1120px;
}
.panel {
  display: flex; flex-direction: column; background: #0d0d0d; border: 1px solid #383838;
  color: #fff; text-decoration: none; transition: border-color .12s linear, transform .12s linear;
}
.panel:hover, .panel:focus-visible { border-color: #ffe500; transform: translateY(-2px); }
.panel:focus-visible { outline: 2px solid #ffe500; outline-offset: 3px; }
.panel-img { aspect-ratio: 1.9 / 1; overflow: hidden; background: #070707; border-bottom: 1px solid #262626; }
.panel-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.panel-body { display: flex; flex-direction: column; gap: 10px; padding: 18px 18px 20px; flex: 1; }
.panel-years {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px; letter-spacing: .14em; color: #9a9a9a;
}
.panel h2 {
  margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 23px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1;
}
.panel p { margin: 0; color: #9a9a9a; font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
.panel-go {
  margin-top: auto; padding-top: 6px; align-self: flex-start;
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #ffe500;
}
@media (max-width: 860px) {
  .panels { grid-template-columns: 1fr; max-width: 520px; }
}
`;

export default function Home() {
  return (
    <main className="qtd-home">
      <style>{css}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="456 Solutions" width={370} height={370} />
      <nav className="panels" aria-label="Projects">
        {panels.map((p) => (
          <a key={p.href} className="panel" href={p.href}>
            <div className="panel-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" loading="lazy" />
            </div>
            <div className="panel-body">
              <span className="panel-years">[{p.years}]</span>
              <h2>{p.title}</h2>
              <p>{p.blurb}</p>
              <span className="panel-go">Open →</span>
            </div>
          </a>
        ))}
      </nav>
    </main>
  );
}
