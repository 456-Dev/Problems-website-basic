import type { Metadata } from "next";

const desc = "A report from Nepal by Michael Linares, after the Gen Z protests of September 2025. Plus the moderator of the Discord election and a Question The Day episode from Kathmandu.";

export const metadata: Metadata = {
  title: "The Nepal Problem Solver Report — 456 Solutions",
  description: desc,
  openGraph: {
    title: "The Nepal Problem Solver Report",
    description: desc,
    url: "https://456solutions.org/nepal",
    type: "video.other",
    images: [{ url: "https://456solutions.org/assets/nepal/og.jpg", width: 1280, height: 720 }],
  },
  twitter: { card: "summary_large_image" },
};

// Everything here comes from the report's YouTube description.
const more = [
  { id: "Tob8zDtRcg4", title: "Shaswot Lamichhane: Moderator of The Discord Election",
    note: "His “Youth’s Against Corruption” Discord server organized the protesters and picked the interim Prime Minister." },
  { id: "pJHwP59uonE", title: "What Is Communism In Nepal?",
    note: "Question The Day, episode 204. Nepali subtitles. Recorded March 5th–9th 2026." },
];

const links = [
  { label: "Balen Battle Rap", href: "https://www.youtube.com/watch?v=zek-Cgr8Mg4" },
  { label: "RSP Election Song", href: "https://www.youtube.com/watch?v=M3f_XYzDa4o" },
  { label: "Estonia Digital State Explainer", href: "https://www.youtube.com/watch?v=I5krZBe0Dck" },
  { label: "Intro Song", href: "https://www.youtube.com/watch?v=74-7pEfJr34" },
  { label: "Outro Song", href: "https://www.youtube.com/watch?v=hlyJPvsAQC4" },
];

const css = `
.np { min-height: 100vh; background: #000; color: #fff; padding: 32px 20px 72px;
  font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
.np-in { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }
.np-top { display: flex; align-items: center; justify-content: space-between; }
.np-top img { width: 64px; height: auto; display: block; }
.np-mono { font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
.np-top a.np-mono { color: #ffe500; text-decoration: none; font-weight: 700; }
.np h1 { margin: 6px 0 0; font-size: clamp(30px, 6vw, 52px); font-weight: 700; letter-spacing: -.03em; line-height: 1.02; }
.np-years { color: #9a9a9a; font-size: 11px; }
.np-lede { margin: 0; color: #bdbdbd; max-width: 640px; }
.np-video { position: relative; aspect-ratio: 16 / 9; background: #070707; border: 1px solid #383838; }
.np-video iframe, .np-short iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.np h2 { margin: 18px 0 0; font-size: 23px; font-weight: 700; letter-spacing: -.02em; }
.np-more { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; max-width: 680px; }
.np-card { background: #0d0d0d; border: 1px solid #383838; display: flex; flex-direction: column; }
.np-short { position: relative; aspect-ratio: 9 / 16; max-height: 640px; background: #070707; border-bottom: 1px solid #262626; }
.np-card div.np-cap { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px; }
.np-card h3 { margin: 0; font-size: 18px; line-height: 1.2; }
.np-card p { margin: 0; color: #9a9a9a; font-size: 15px; }
.np-links { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
.np-links a { display: inline-block; padding: 9px 12px; border: 1px solid #383838; color: #fff;
  text-decoration: none; font-size: 14px; }
.np-links a:hover, .np-links a:focus-visible { border-color: #ffe500; color: #ffe500; }
.np-foot { color: #9a9a9a; margin: 0; }
.np-foot a { color: #ffe500; }
@media (max-width: 700px) { .np-more { grid-template-columns: 1fr; } }
`;

const yt = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

export default function Nepal() {
  return (
    <main className="np">
      <style>{css}</style>
      <div className="np-in">
        <div className="np-top">
          <a href="/" aria-label="456 Solutions home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="456 Solutions" width={370} height={370} />
          </a>
          <a className="np-mono" href="/">← All projects</a>
        </div>

        <header>
          <span className="np-mono np-years">[2026]</span>
          <h1>The Nepal Problem Solver Report</h1>
        </header>
        <p className="np-lede">
          A 30-minute report from Nepal, after the Gen Z protests of September 2025 brought down the government.
        </p>

        <div className="np-video">
          <iframe src={yt("l6PIh58C-qU")} title="The Nepal Problem Solver Report" loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen />
        </div>

        <h2>More from Nepal</h2>
        <div className="np-more">
          {more.map((v) => (
            <div key={v.id} className="np-card">
              <div className="np-short">
                <iframe src={yt(v.id)} title={v.title} loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen />
              </div>
              <div className="np-cap">
                <h3>{v.title}</h3>
                <p>{v.note}</p>
              </div>
            </div>
          ))}
        </div>

        <h2>Links from the report</h2>
        <ul className="np-links">
          {links.map((l) => (
            <li key={l.href}><a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a></li>
          ))}
        </ul>

        <p className="np-foot">
          If you learned something, share it with another problem solver. Tell us how to make the next report better
          in the <a href="https://www.youtube.com/watch?v=l6PIh58C-qU" target="_blank" rel="noopener noreferrer">YouTube comments</a>.
        </p>
      </div>
    </main>
  );
}
