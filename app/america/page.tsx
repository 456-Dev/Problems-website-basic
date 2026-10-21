import type { Metadata } from "next";
import Stills from "@/components/Stills";

const VIDEO = "rypQce5ik7w";
const WATCH = `https://www.youtube.com/watch?v=${VIDEO}`;
const desc = "A road-trip documentary. The same 3 questions, asked to 221 people across 14 states, from Los Angeles to New York City.";

export const metadata: Metadata = {
  title: "One Question for America (2025) — a documentary by Michael Linares",
  description: desc,
  openGraph: {
    title: "One Question for America",
    description: desc,
    url: "https://456solutions.org/america",
    type: "video.movie",
    images: [{ url: "https://456solutions.org/assets/america/poster.jpg", width: 1280, height: 720 }],
  },
  twitter: { card: "summary_large_image" },
};

const stills = Array.from({ length: 18 }, (_, n) => `/assets/america/stills/${String(n + 1).padStart(2, "0")}.jpg`);

const questions = [
  "What is one question you would ask everyone in America?",
  "Answer your own question.",
  "Are you happy?",
];

const asked = [
  "Do you have a sister?",
  "Do you know where you will spend eternity?",
  "Where did you learn how to drive?",
  "Dementia patient or felon?",
];

const facts: [string, string][] = [
  ["Director", "Michael Linares"],
  ["Year", "2025"],
  ["Genre", "Documentary"],
  ["Runtime", "75 minutes"],
  ["Rated", "R (cursing, guns, politics)"],
  ["Shot in", "14 states, LA → NYC"],
];

const css = `
.oqa { background: #070707; color: #fff; min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
.oqa *, .oqa *::before, .oqa *::after { box-sizing: border-box; }
.oqa a { color: inherit; }
.oqa-wrap { max-width: 1040px; margin: 0 auto; padding: 0 20px; }
.oqa-mono { font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #9a9a9a; }
.oqa-top { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid #262626; }
.oqa-top a { text-decoration: none; }
.oqa-top a:hover { color: #fff; }

.oqa-hero { padding: 44px 0 28px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 36px; align-items: center; }
.oqa-hero h1 { margin: 12px 0 16px; font-size: clamp(38px, 6vw, 72px); line-height: .95; letter-spacing: -.04em; }
.oqa-hero h1 span { color: #ff1f1f; }
.oqa-lede { font-size: 19px; line-height: 1.5; color: #d6d6d6; margin: 0 0 26px; max-width: 40ch; }
.oqa-cta { display: flex; flex-wrap: wrap; gap: 10px; }
.oqa-btn { display: inline-block; padding: 16px 22px; text-decoration: none;
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  border: 1px solid #ffe500; background: #ffe500; color: #000 !important; transition: background .12s, border-color .12s; }
.oqa-btn:hover { background: #fff; border-color: #fff; }
.oqa-btn.ghost { background: transparent; color: #fff !important; border-color: #383838; }
.oqa-btn.ghost:hover { border-color: #fff; }
.oqa-poster { width: 100%; display: block; border: 1px solid #262626; }

.oqa-player { position: relative; aspect-ratio: 16 / 9; background: #000; border: 1px solid #262626; margin: 12px 0 8px; }
.oqa-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

.oqa h2 { font-size: clamp(24px, 3vw, 34px); letter-spacing: -.03em; margin: 0 0 18px; }
.oqa-sec { padding: 48px 0 8px; }
.oqa-qs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #383838; }
.oqa-qs li { padding: 20px; border-left: 1px solid #383838; }
.oqa-qs li:first-child { border-left: 0; }
.oqa-qs b { display: block; font-size: 38px; color: #ffe500; letter-spacing: -.04em; margin-bottom: 10px; }
.oqa-qs p { margin: 0; font-size: 18px; line-height: 1.35; }
.oqa-asked { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 0; padding: 0; list-style: none; }
.oqa-asked li { padding: 8px 12px; border: 1px solid #262626; background: #0d0d0d; color: #d6d6d6; font-size: 15px; }
.oqa-asked li.you { border-color: #ffe500; color: #ffe500; }

.stills-frame { position: relative; aspect-ratio: 1786 / 1005; background: #000; border: 1px solid #262626; overflow: hidden; }
.stills-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity .6s; }
.stills-frame img.on { opacity: 1; }
.stills-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 64px; border: 0; cursor: pointer;
  background: rgba(0,0,0,.55); color: #fff; font-size: 34px; line-height: 1; }
.stills-nav:hover { background: rgba(0,0,0,.85); color: #ffe500; }
.stills-nav.prev { left: 0; } .stills-nav.next { right: 0; }
.stills-count { position: absolute; right: 10px; bottom: 8px; padding: 4px 8px; background: rgba(0,0,0,.7);
  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; letter-spacing: .1em; }
.stills-strip { display: flex; gap: 6px; overflow-x: auto; padding: 8px 0 4px; scrollbar-width: thin; }
.stills-strip button { flex: 0 0 auto; width: 96px; aspect-ratio: 16 / 9; padding: 0; border: 1px solid #262626; background: #000; cursor: pointer; opacity: .55; }
.stills-strip button.on, .stills-strip button:hover { opacity: 1; border-color: #ffe500; }
.stills-strip img { width: 100%; height: 100%; object-fit: cover; display: block; }

.oqa-facts { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0; border: 1px solid #383838; }
.oqa-facts div { padding: 14px 18px; border-left: 1px solid #383838; border-top: 1px solid #383838; }
.oqa-facts div:nth-child(3n+1) { border-left: 0; }
.oqa-facts div:nth-child(-n+3) { border-top: 0; }
.oqa-facts dt { margin-bottom: 6px; }
.oqa-facts dd { margin: 0; font-size: 17px; }

.oqa-foot { margin-top: 56px; padding: 26px 0 40px; border-top: 1px solid #262626; display: flex; flex-wrap: wrap; gap: 14px 28px; justify-content: space-between; }
.oqa-foot a { text-decoration: none; border-bottom: 1px solid #ffe500; }

@media (max-width: 820px) {
  .oqa-hero { grid-template-columns: 1fr; padding-top: 28px; }
  .oqa-poster { order: -1; }
  .oqa-qs { grid-template-columns: 1fr; }
  .oqa-qs li { border-left: 0; border-top: 1px solid #383838; }
  .oqa-qs li:first-child { border-top: 0; }
  .oqa-facts { grid-template-columns: 1fr 1fr; }
  .oqa-facts div { border-left: 1px solid #383838 !important; border-top: 1px solid #383838 !important; }
  .oqa-facts div:nth-child(2n+1) { border-left: 0 !important; }
  .oqa-facts div:nth-child(-n+2) { border-top: 0 !important; }
}
`;

export default function America() {
  return (
    <main className="oqa">
      <style>{css}</style>
      <div className="oqa-wrap">
        <header className="oqa-top oqa-mono">
          <a href="/">← 456 Solutions</a>
          <span>Documentary · 2025</span>
        </header>

        <section className="oqa-hero">
          <div>
            <span className="oqa-mono">A film by Michael Linares</span>
            <h1>One Question for <span>America</span></h1>
            <p className="oqa-lede">
              Come along on a road trip as America learns what it wants to know about itself. The same 3 questions, asked to 221 people across
              14 states, from Los Angeles to New York City.
            </p>
            <div className="oqa-cta">
              <a className="oqa-btn" href="#watch">▶ Watch the film</a>
              <a className="oqa-btn ghost" href={WATCH} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="oqa-poster" src="/assets/america/poster.jpg" alt="One Question for America poster" />
        </section>

        <section className="oqa-sec" id="watch">
          <h2>Watch the full film</h2>
          <div className="oqa-player">
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO}?rel=0`}
              title="One Question for America"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="oqa-mono">Free on YouTube · 75 min · Rated R</p>
        </section>

        <section className="oqa-sec">
          <h2>The same 3 questions, 221 times</h2>
          <ol className="oqa-qs">
            {questions.map((q, n) => (
              <li key={q}><b>#{n + 1}</b><p>{q}</p></li>
            ))}
          </ol>
          <p className="oqa-mono" style={{ marginTop: 22 }}>Some of what America asked</p>
          <ul className="oqa-asked">
            {asked.map((q) => <li key={q}>{q}</li>)}
            <li className="you">What would you ask America?</li>
          </ul>
        </section>

        <section className="oqa-sec">
          <h2>Stills</h2>
          <Stills srcs={stills} />
        </section>

        <section className="oqa-sec">
          <h2>Film information</h2>
          <dl className="oqa-facts">
            {facts.map(([k, v]) => (
              <div key={k}><dt className="oqa-mono">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>

        <footer className="oqa-foot oqa-mono">
          <span>Screenings, press, or just want to talk? <a href="mailto:michaellinares314@gmail.com">michaellinares314@gmail.com</a></span>
          <span><a href="/book">The book: They Said You Can&apos;t →</a></span>
        </footer>
      </div>
    </main>
  );
}
