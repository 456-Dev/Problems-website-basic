import type { Metadata } from "next";

// The full homepage is parked in app/_previous-home (a private folder, so it
// isn't a route). To bring it back, move that page.tsx back here.
// The components still import these types from "@/app/page".
export type { Video, AskedQuestion } from "./_previous-home/page";

export const metadata: Metadata = {
  title: "Question The Day",
  description: "One question. About 25 strangers on the street. Watch them answer, then answer it yourself.",
  openGraph: {
    title: "Question The Day",
    description: "One question. About 25 strangers on the street. Watch them answer, then answer it yourself.",
    url: "https://456solutions.org/",
    images: [{ url: "https://456solutions.org/qtd/media/og-card.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

const css = `
.qtd-home {
  min-height: 100vh; min-height: 100svh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 40px; padding: 24px; background: #000;   /* the logo file sits on pure black */
}
.qtd-home img { width: min(200px, 44vw); height: auto; display: block; }
.qtd-go {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 15px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
  color: #000; background: #ffe500; border: 1px solid #ffe500;
  padding: 18px 30px; text-decoration: none;
  transition: background .12s linear, border-color .12s linear;
}
.qtd-go:hover, .qtd-go:focus-visible { background: #fff; border-color: #fff; }
.qtd-go:focus-visible { outline: 2px solid #ffe500; outline-offset: 3px; }
`;

export default function Home() {
  return (
    <main className="qtd-home">
      <style>{css}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Question The Day" width={370} height={370} />
      {/* a plain link: /qtd/ is a static site in public/, not a Next route */}
      <a className="qtd-go" href="/qtd/">Question The Day →</a>
    </main>
  );
}
