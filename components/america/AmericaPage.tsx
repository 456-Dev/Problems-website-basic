"use client";

import { useEffect, useState } from "react";
import { Ask, Flip, Happy } from "./Icons";
import { useYouTube } from "./useYouTube";
import { VIDEO_ID, asked, flipped, HAPPY, happyLines, days, frame, clock } from "@/lib/america";

const WATCH = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const MAIL = "michaellinares314@gmail.com";

type Rail = { place: string; date: string; icon: 0 | 1 | 2 | 3 };

// The film's right-hand rail: place + date written sideways, and the three question marks.
function SideRail({ rail }: { rail: Rail }) {
  return (
    <aside className="oqa-rail" aria-hidden="true">
      <div className="oqa-rail-text">
        <b>{rail.place}</b>
        <span>{rail.date}</span>
      </div>
      <div className="oqa-rail-icons">
        <Ask className={rail.icon === 1 ? "on" : ""} />
        <Flip className={rail.icon === 2 ? "on" : ""} />
        <Happy className={rail.icon === 3 ? "on" : ""} />
      </div>
    </aside>
  );
}

// A frame from the film, with its subtitle reset in HTML so it stays readable.
function Still({ t, sub, onPlay, label }: { t: number; sub: string; onPlay: () => void; label?: string }) {
  return (
    <button className="oqa-still" onClick={onPlay} aria-label={`Play from ${clock(t)}: ${sub}`}>
      <span className="oqa-still-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frame(t)} alt="" loading="lazy" />
        <span className="oqa-still-play">▶ {clock(t)}</span>
      </span>
      <span className="oqa-sub">{label ?? `-${sub}`}</span>
    </button>
  );
}

export default function AmericaPage() {
  const playAt = useYouTube("oqa-player", VIDEO_ID);
  const [rail, setRail] = useState<Rail>({ place: "Los Angeles to New York", date: "July 2024", icon: 0 });

  const play = (t: number) => {
    document.getElementById("watch")?.scrollIntoView({ behavior: "smooth", block: "start" });
    playAt(Math.max(0, t - 4));
  };

  // Whatever crosses the middle of the screen sets the rail, like the film does per interview.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-place]");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const d = e.target as HTMLElement;
        setRail({ place: d.dataset.place!, date: d.dataset.date ?? "", icon: Number(d.dataset.icon ?? 0) as Rail["icon"] });
      }
    }, { rootMargin: "-48% 0px -48% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="oqa">
      <SideRail rail={rail} />

      <header className="oqa-top">
        <a href="/">456 Solutions</a>
        <a href={WATCH} target="_blank" rel="noopener noreferrer">YouTube ↗</a>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="oqa-hero" data-place="One Question for America" data-date="2025" data-icon="0">
        <div className="oqa-poster">
          {/* swap for the real poster when it lands: public/assets/america/film/poster.jpg */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/america/film/poster.jpg" alt="One Question for America — poster" />
        </div>
        <div className="oqa-hero-text">
          <h1><span>“One Question</span> <span>for America”</span></h1>
          <p className="oqa-credit">A documentary by Michael Linares</p>
          <p className="oqa-log">
            Three questions. 221 strangers. Eleven days in a car from Los Angeles to New York City,
            July 4th to 14th, 2024.
          </p>
          <div className="oqa-actions">
            <button className="oqa-btn" onClick={() => play(4)}>▶ Watch the whole film</button>
            <span className="oqa-runtime">75 min · free · <abbr title="Restricted">R</abbr> for cursing, guns, politics</span>
          </div>
        </div>
      </section>

      {/* ---------------- why ---------------- */}
      <section className="oqa-why" data-place="Manhattan" data-date="June 11th 2025" data-icon="0">
        <p className="oqa-narr">
          This project was created in 2024 in response to a heated election, a profit-driven news media
          amplifying the division, and an online discourse controlled more and more by bots.
        </p>
        <p className="oqa-narr">
          On a road trip from LA to New York City, we spoke to, frankly, anyone who would speak to us.
        </p>
        <p className="oqa-narr dim">Without editorializing or filtering.</p>
        <p className="oqa-from">— from the opening of the film</p>
      </section>

      {/* ---------------- player + question 1 ---------------- */}
      <section className="oqa-q oqa-q1" data-place="Question #1" data-date="221 people" data-icon="1">
        <div className="oqa-q-head">
          <Ask className="oqa-q-icon" />
          <div>
            <p className="oqa-q-num">Question #1</p>
            <h2>What is one question you would ask everyone in America?</h2>
          </div>
        </div>

        <div className="oqa-q1-grid">
          <div className="oqa-watch" id="watch">
            <div className="oqa-player"><div id="oqa-player" /></div>
            <p className="oqa-hint">Pick any question. The film jumps to it.</p>
          </div>
          <div className="oqa-wall">
            {asked.map((a) => (
              <div key={a.t} data-place={a.place} data-date={a.date} data-icon="1">
                <Still t={a.t} sub={a.q} onPlay={() => play(a.t)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- question 2 ---------------- */}
      <section className="oqa-q" data-place="Question #2" data-date="asked right back" data-icon="2">
        <div className="oqa-q-head">
          <Flip className="oqa-q-icon" />
          <div>
            <p className="oqa-q-num">Question #2</p>
            <h2>Answer your own question.</h2>
          </div>
        </div>
        <div className="oqa-pairs">
          {flipped.map((f) => (
            <div className="oqa-pair" key={f.ask} data-place={f.place} data-date="" data-icon="2">
              <Still t={f.ask} sub={f.q} onPlay={() => play(f.ask)} />
              <Flip className="oqa-pair-arrow" />
              <Still t={f.answer} sub={f.a} onPlay={() => play(f.ask)} label={f.a} />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- question 3 ---------------- */}
      <section className="oqa-q" data-place="Question #3" data-date="the last one" data-icon="3">
        <div className="oqa-q-head">
          <Happy className="oqa-q-icon" />
          <div>
            <p className="oqa-q-num">Question #3</p>
            <h2>Are you happy?</h2>
          </div>
        </div>
        <div className="oqa-happy">
          <div className="oqa-faces" role="img"
               aria-label={`${HAPPY.yes} of ${HAPPY.total} faces smiling`}>
            {Array.from({ length: HAPPY.total }, (_, i) => (
              <Happy key={i} sad={i >= HAPPY.yes} className={i >= HAPPY.yes ? "no" : ""} />
            ))}
          </div>
          <div className="oqa-happy-side">
            <p className="oqa-big">83%</p>
            <p className="oqa-happy-cap">said yes. More or less.</p>
            <ul className="oqa-lines">
              {happyLines.map((h) => (
                <li key={h.t}>
                  <button onClick={() => play(h.t)}>
                    <span className="oqa-sub">-{h.a}</span>
                    <span className="oqa-at">{h.place} · {clock(h.t)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- route ---------------- */}
      <section className="oqa-route" data-place="14 states" data-date="July 4th – 14th 2024" data-icon="0">
        <h2>The route</h2>
        <p className="oqa-route-cap">
          Driven Los Angeles to New York. Shown in reverse, starting where we ended and ending where we began.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="oqa-map" src="/assets/america/film/map.jpg" alt="Map of every stop, Los Angeles to New York" loading="lazy" />
        <ol className="oqa-days">
          {days.map((d) => (
            <li key={d.date}>
              <span className="oqa-day">{d.date}</span>
              <span className="oqa-stops">
                {d.stops.map(([name, t], i) => (
                  <span key={name + t}>
                    <button onClick={() => play(t + 4)}>{name}</button>
                    {i < d.stops.length - 1 && <span className="oqa-dot"> · </span>}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- credits ---------------- */}
      <footer className="oqa-credits" data-place="Credits" data-date="2025" data-icon="0">
        <div className="oqa-billing">
          <p><small>Directed by</small> Michael Linares</p>
          <p><small>Created &amp; produced by</small> Michael Linares <small>and</small> Jason Zilberkweit</p>
          <p><small>Interviews and data by</small> Michael Linares <small>and</small> Jason Zilberkweit</p>
          <p><small>Edited by</small> Michael Linares <small>· Editing consultant</small> Luciano Cecchi</p>
          <p><small>Screened at</small> The Frida Cinema, Santa Ana, CA</p>
        </div>
        <div className="oqa-rating">
          <b>R</b>
          <span><strong>RESTRICTED</strong>Cursing, guns, politics. And one hermit crab.</span>
        </div>
        <p className="oqa-contact">
          Want to screen it, write about it, or just talk? <a href={`mailto:${MAIL}`}>{MAIL}</a>
        </p>
        <p className="oqa-contact">
          <a href="/book/">They Said You Can&apos;t</a>, the photo book, has a whole section of screenshots from this trip.
        </p>
      </footer>
    </div>
  );
}
