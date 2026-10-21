import type { Metadata } from "next";
import BookLottery from "@/components/BookLottery";
import BuyDigital from "@/components/BuyDigital";

const desc = "The photography book by bignosemichael. 160 full-color pages, 231 photographs, 7 sections. Digital $5, standard $25, deluxe $50.";

export const metadata: Metadata = {
  title: "They Said You Can't — a photography book by bignosemichael",
  description: desc,
  openGraph: {
    title: "THEY SAID YOU CAN'T",
    description: desc,
    url: "https://456solutions.org/book",
    images: [{ url: "https://456solutions.org/assets/book/cover.jpg", width: 1800, height: 1138 }],
  },
  twitter: { card: "summary_large_image" },
};

const IG = "https://www.instagram.com/bignosemichael";
const MAIL = "michaellinares314@gmail.com";

const editions = [
  { id: "digital", name: "Digital", price: "$5", cta: "Buy digital", href: "#digital",
    points: [
      ["A PDF of the deluxe edition", "No fun compared to the real deal :)"],
      ["Print the book yourself!", "Looks good even on standard office paper. Print it at work lol"],
      ["Free with a physical copy", "Code on page 1. Includes the deluxe-only section"],
    ] },
  { id: "standard", name: "Standard", price: "$25", cta: "Get a copy", href: "#copy", best: true,
    points: [
      ["Paperback with a GLOSSY cover", "160 pages of slammin photography in 7 sections"],
      ["Best deal, physical art!", "This is the one you want. Don't buy the deluxe, trust me"],
      ["Free DIY poster included", "\"Tale of 3 Cities\", a tiled poster you put together yourself"],
    ] },
  { id: "deluxe", name: "Deluxe", price: "$50", cta: "Get a copy", href: "#copy",
    points: [
      ["16 extra pages of spicy, outside-the-box photography", "[MAKING CHOICES while…DRUNK! & HIGH?] aka TEXT"],
      ["Unique front/back MATTE cover", "Better paper and cover stock. Signed by bignosemichael"],
      ["Intentionally overpriced", "Everything in the standard. Don't buy this unless you are rich"],
    ] },
];

const sections: [string, string][] = [
  ["Don't Play Water", "Photo essay of an American's view of the People's Republic of China in 2024. Minimal post-processing, grouped by complementary colors."],
  ["Video Screenshots of America", "Frames from the cross-country trip behind the documentary One Question for America."],
  ["HFI λ", "Hyper-processed images, 2018–2025. λ is Intensity, Information, Vibration, Saturation, the Meaning of Life, all transmitted through a grid of points."],
  ["Roadkill", "Self explanatory. It's ok! Everything will die. Mixed capture medium."],
  ["Double Up!!", "The same subject, shot in quick succession. Barebones point-and-shoot. Don't forget to always DOUBLE UP!!"],
  ["Meditations", "People on the street, paired with creative writing from guest writers."],
  ["Odds & Ends pt.17", "a.eye. generated slop."],
  ["TEXT aka Making Choices while…Drunk! & High?", "Deluxe and digital only. A manifesto in which being intoxicated is required for comprehension."],
];

const css = `
.tsyc { background: #000; color: #fff; min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
.tsyc *, .tsyc *::before, .tsyc *::after { box-sizing: border-box; }
.tsyc a { color: inherit; }
.tsyc-wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
.tsyc-mono { font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #9a9a9a; }
.tsyc-top { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid #262626; }
.tsyc-top a { text-decoration: none; }
.tsyc-cover { display: block; width: 100%; height: auto; margin: 28px 0 0; }
.tsyc-by { text-align: center; margin: 22px 0 4px; font-family: Georgia, "Times New Roman", serif; font-size: 22px; color: #d6d6d6; }
.tsyc-by em { color: #fff; }
.tsyc-isbn { text-align: center; }

.tsyc h2 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 3.6vw, 44px);
  letter-spacing: -.01em; margin: 0 0 20px; }
.tsyc-sec { padding: 56px 0 8px; }

.eds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.ed { display: flex; flex-direction: column; border: 1px solid #383838; background: #0d0d0d; padding: 22px 20px 20px; position: relative; }
.ed.best { border-color: #ffe500; }
.ed-flag { position: absolute; top: -1px; right: -1px; background: #ffe500; color: #000; padding: 5px 9px;
  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.ed h3 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: 26px; }
.ed-price { font-size: 46px; font-weight: 700; letter-spacing: -.04em; margin: 6px 0 14px; }
.ed ul { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.ed li b { display: block; font-size: 15.5px; margin-bottom: 3px; }
.ed li span { color: #9a9a9a; font-size: 14.5px; line-height: 1.4; }
.ed .tsyc-btn { margin-top: auto; text-align: center; }

.tsyc-btn { display: inline-block; padding: 15px 20px; border: 1px solid #ffe500; background: #ffe500; color: #000 !important;
  text-decoration: none; cursor: pointer; font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; transition: background .12s, border-color .12s; }
.tsyc-btn:hover { background: #fff; border-color: #fff; }
.tsyc-btn.ghost { background: transparent; color: #fff !important; border-color: #383838; }
.tsyc-btn.ghost:hover { border-color: #fff; }

.about { display: grid; grid-template-columns: 1fr 1.15fr; gap: 36px; align-items: start; }
.about-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; font-size: 18px; line-height: 1.5; }
.about-list li { display: grid; grid-template-columns: 26px 1fr; }
.about-list i { font-style: normal; }
.about-list .r { color: #ff1f1f; } .about-list .g { color: #00ff41; } .about-list .b { color: #3b6bff; }
.about-risk { margin-top: 6px; font-weight: 700; color: #ffe500; }

.lottery-box { position: relative; display: block; width: 100%; aspect-ratio: 1; padding: 0; border: 1px solid #383838;
  background: #fff; cursor: pointer; overflow: hidden; }
.lottery-box.done { cursor: default; border-color: #ffe500; }
.lottery-box img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
.lottery-box img.on { opacity: 1; }
.lottery-box.idle img { filter: grayscale(1) brightness(.55); }
.lottery-cue { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); white-space: nowrap;
  background: #ffe500; color: #000; padding: 12px 16px; font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.lottery-msg { margin: 12px 0 0; min-height: 1.4em; color: #d6d6d6; font-size: 16px; text-align: center; }
.lottery-msg b { color: #ffe500; font-weight: 600; }

.secs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #383838; }
.secs li { padding: 18px 20px; border-top: 1px solid #383838; }
.secs li:nth-child(even) { border-left: 1px solid #383838; }
.secs li:nth-child(-n+2) { border-top: 0; }
.secs h3 { margin: 0 0 6px; display: inline-block; background: #fff; color: #000; padding: 2px 7px;
  font-size: 14px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
.secs li.dlx h3 { background: #ffe500; }
.secs p { margin: 4px 0 0; color: #9a9a9a; font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 16px; line-height: 1.45; }
.secs-art { display: block; width: 100%; height: auto; margin-top: 16px; border: 1px solid #262626; }

.buybox { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.buybox > div { border: 1px solid #383838; background: #0d0d0d; padding: 24px 22px; }
.buybox h3 { margin: 0 0 14px; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: 26px; }
.buybox p { color: #d6d6d6; font-size: 16px; line-height: 1.5; margin: 0 0 14px; }
.tsyc-step { display: flex; gap: 10px; align-items: baseline; }
.tsyc-step b { color: #ffe500; font-family: ui-monospace, Menlo, Consolas, monospace; }
.buy-pay { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px; }
.buy-pay a, .buy-pay button, .buy-code button { padding: 11px 16px; border: 1px solid #383838; background: #141414; color: #fff;
  text-decoration: none; cursor: pointer; font: 700 12px/1 ui-monospace, Menlo, Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
.buy-pay a:hover, .buy-pay button:hover, .buy-code button:hover { border-color: #fff; }
.buy-zelle { background: #141414; border-left: 3px solid #ffe500; padding: 10px 12px; font-size: 15px !important; }
.buy-code { margin-top: 22px; padding-top: 16px; border-top: 1px solid #262626; }
.buy-code label { display: block; color: #9a9a9a; font-size: 14px; margin-bottom: 8px; }
.buy-code div { display: flex; gap: 8px; }
.buy-code input { flex: 1; min-width: 0; padding: 11px 12px; background: #000; color: #fff; border: 1px solid #383838; font-size: 16px; }
.buy-code input:focus { outline: 2px solid #ffe500; outline-offset: 0; }
.buy-bad { color: #ff1f1f !important; font-size: 14px !important; margin: 8px 0 0 !important; }
.tsyc-note { color: #9a9a9a !important; font-size: 14px !important; margin-top: 12px !important; }
.copy-links { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }

.tsyc-film { display: grid; grid-template-columns: 220px 1fr; gap: 20px; align-items: center; margin-top: 56px;
  padding: 18px; border: 1px solid #262626; text-decoration: none; transition: border-color .12s; }
.tsyc-film:hover { border-color: #ffe500; }
.tsyc-film img { width: 100%; display: block; }
.tsyc-film b { display: block; font-size: 22px; margin: 6px 0; }
.tsyc-film span.d { color: #9a9a9a; }

.tsyc-foot { margin-top: 48px; padding: 26px 0 40px; border-top: 1px solid #262626; display: flex; flex-wrap: wrap;
  gap: 14px 28px; justify-content: space-between; }
.tsyc-foot a { text-decoration: none; border-bottom: 1px solid #ffe500; }

@media (max-width: 860px) {
  .eds, .about, .buybox { grid-template-columns: 1fr; }
  .about .lottery { max-width: 420px; }
  .secs { grid-template-columns: 1fr; }
  .secs li { border-left: 0 !important; border-top: 1px solid #383838 !important; }
  .secs li:first-child { border-top: 0 !important; }
  .tsyc-film { grid-template-columns: 1fr; }
}
`;

export default function Book() {
  return (
    <main className="tsyc">
      <style>{css}</style>
      <div className="tsyc-wrap">
        <header className="tsyc-top tsyc-mono">
          <a href="/">← 456 Solutions</a>
          <span>Photography book · 2025</span>
        </header>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tsyc-cover" src="/assets/book/cover.jpg" width={1800} height={1138}
             alt="THEY SAID YOU CAN'T, front and back cover" />
        <p className="tsyc-by">the new photography book by <em><b>bignosemichael</b></em></p>
        <p className="tsyc-isbn tsyc-mono">ISBN 979-8-9987645-1-6</p>

        <section className="tsyc-sec" id="editions">
          <h2>Pick your edition</h2>
          <div className="eds">
            {editions.map((e) => (
              <article key={e.id} className={`ed${e.best ? " best" : ""}`}>
                {e.best && <span className="ed-flag">Best deal</span>}
                <h3>{e.name} Edition</h3>
                <p className="ed-price">{e.price}</p>
                <ul>
                  {e.points.map(([b, s]) => <li key={b}><b>{b}</b><span>{s}</span></li>)}
                </ul>
                <a className="tsyc-btn" href={e.href}>{e.cta}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="tsyc-sec">
          <h2>About this book</h2>
          <div className="about">
            <BookLottery />
            <ul className="about-list">
              <li><i className="r">●</i><span><b>160 full-color pages</b> [8.5&quot; × 11&quot;] of <em>photography</em> in 7 <u>unique</u> sections.</span></li>
              <li><i className="g">■</i><span>231 <u>traditional</u> street photographs, <em>hyper-processed</em> images, and creative writing from your favorite <b>guest writers!</b></span></li>
              <li><i className="b">▲</i><span>This book may [or may not] contain <b>sexy humans</b>, <em>dead rats</em>, and <u>general nonsense</u>.
                <span className="about-risk" style={{ display: "block" }}>Enjoy at your own risk!</span></span></li>
            </ul>
          </div>
        </section>

        <section className="tsyc-sec">
          <h2>Sections and titles</h2>
          <ol className="secs">
            {sections.map(([t, d]) => (
              <li key={t} className={t.startsWith("TEXT") ? "dlx" : ""}><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="secs-art" src="/assets/book/sections.jpg" alt="The book's credits page and section list" loading="lazy" />
        </section>

        <section className="tsyc-sec" id="buy">
          <h2>Get the book</h2>
          <div className="buybox">
            <div id="digital">
              <h3>Digital edition · $5</h3>
              <BuyDigital />
            </div>
            <div id="copy">
              <h3>Physical copy · $25 / $50</h3>
              <p>Message me to grab a standard or deluxe copy. Pick it up in NYC, or I&apos;ll ship the deluxe for $58 ($50 + $8 shipping).</p>
              <p>Pay cash, Venmo, Cash App, or Zelle.</p>
              <div className="copy-links">
                <a className="tsyc-btn" href={IG} target="_blank" rel="noopener noreferrer">DM @bignosemichael</a>
                <a className="tsyc-btn ghost" href={`mailto:${MAIL}?subject=They%20Said%20You%20Can't%20%E2%80%94%20book%20order`}>Email {MAIL}</a>
              </div>
            </div>
          </div>
        </section>

        <a className="tsyc-film" href="/america">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/america/flag.jpg" alt="" loading="lazy" />
          <span>
            <span className="tsyc-mono">The documentary · 2025</span>
            <b>One Question for America →</b>
            <span className="d">The road trip behind the &quot;Video Screenshots of America&quot; section. Watch it free.</span>
          </span>
        </a>

        <footer className="tsyc-foot tsyc-mono">
          <span>Questions, shipping, or delivery? <a href={`mailto:${MAIL}`}>{MAIL}</a></span>
          <span>Everyone else is on 1, 2, 3. We are on 4, 5, 6?!</span>
        </footer>
      </div>
    </main>
  );
}
