"use client";

import { useCallback, useEffect, useState } from "react";
import { Ask, Flip, Happy } from "./Icons";
import { VIDEO_ID, stops, questions, frame } from "@/lib/america";
import type { MapData } from "@/lib/americaMap";

const WATCH = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const MAIL = "michaellinares314@gmail.com";
const embed = (start: number, autoplay: boolean) =>
  `https://www.youtube.com/embed/${VIDEO_ID}?rel=0&playsinline=1&start=${Math.max(0, start)}${autoplay ? "&autoplay=1" : ""}`;

const days = Array.from(new Set(stops.map((s) => s.day)));

// The film's right-hand rail: place + date written sideways, and the three question marks.
function SideRail({ place, date, lit }: { place: string; date: string; lit: number }) {
  return (
    <aside className="oqa-rail" aria-hidden="true">
      <div className="oqa-rail-text"><b>{place}</b><span>{date}</span></div>
      <div className="oqa-rail-icons">
        <Ask className={lit === 1 ? "on" : ""} />
        <Flip className={lit === 2 ? "on" : ""} />
        <Happy className={lit === 3 ? "on" : ""} />
      </div>
    </aside>
  );
}

function Car() {
  return (
    <g className="oqa-car-body">
      <path d="M-13 1h26v-5l-4-1-4-6h-11l-5 6-2 1z" />
      <circle cx="-7" cy="2" r="3.2" />
      <circle cx="7" cy="2" r="3.2" />
    </g>
  );
}

export default function AmericaPage({ map }: { map: MapData }) {
  const [i, setI] = useState(0);
  const stop = stops[i];
  const last = stops.length - 1;

  const go = useCallback((n: number) => {
    setI(Math.min(last, Math.max(0, n)));
  }, [last]);

  // arrow keys drive while the map is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const trip = document.getElementById("trip")?.getBoundingClientRect();
      if (!trip || trip.bottom < 0 || trip.top > innerHeight) return;
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [i, go]);

  const route = map.pts.map((p) => p.join(",")).join(" ");
  const driven = map.pts.slice(0, i + 1).map((p) => p.join(",")).join(" ");
  const [cx, cy] = map.pts[i];
  const flip = i < last && map.pts[i + 1][0] < cx; // face the way the road goes

  return (
    <div className="oqa">
      <SideRail place={stop.place} date={stop.date} lit={stop.ask ? 1 : 0} />

      <header className="oqa-top">
        <a href="/">456 Solutions</a>
        <a href={WATCH} target="_blank" rel="noopener noreferrer">YouTube ↗</a>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="oqa-hero">
        <div className="oqa-poster">
          {/* swap for the real poster when it lands: public/assets/america/film/poster.jpg */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/america/film/poster.jpg" alt="One Question for America — poster" />
        </div>
        <div className="oqa-hero-text">
          <h1><span>“One Question</span> <span>for America”</span></h1>
          <p className="oqa-credit">A documentary by Michael Linares</p>
          <p className="oqa-log">
            Three questions. Over 200 strangers. Eleven days in a car from Los Angeles to New York City,
            July 4th to 14th, 2024.
          </p>
          <div className="oqa-actions">
            <a className="oqa-btn" href="#film">▶ Watch the film</a>
            <a className="oqa-btn ghost" href="#trip">Take the trip ↓</a>
          </div>
          <p className="oqa-runtime">75 min · free · <abbr title="Restricted">R</abbr> for cursing, guns, politics</p>
        </div>
      </section>

      {/* ---------------- the film ---------------- */}
      <section className="oqa-film" id="film">
        <h2>Watch the film</h2>
        <div className="oqa-player">
          <iframe src={embed(0, false)} title="One Question for America"
                  allow="encrypted-media; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>
        <p className="oqa-hint">75 minutes · free · <a href={WATCH} target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a></p>
      </section>

      {/* ---------------- the road trip ---------------- */}
      <section className="oqa-trip" id="trip">
        <div className="oqa-trip-head">
          <h2>The road trip</h2>
          <p>{stops.length} stops. Pick a pin, or drive it one stop at a time.</p>
        </div>

        <div className="oqa-days" role="tablist" aria-label="Days">
          {days.map((d) => {
            const first = stops.findIndex((s) => s.day === d);
            return (
              <button key={d} role="tab" aria-selected={stop.day === d}
                      className={stop.day === d ? "on" : stop.day > d ? "past" : ""}
                      onClick={() => go(first)}>
                <b>Day {d}</b><span>July {d + 3}</span>
              </button>
            );
          })}
        </div>

        <div className="oqa-trip-grid">
          <svg className="oqa-map" viewBox="0 0 960 560" role="group" aria-label="Map of the drive from Los Angeles to New York">
            <path className="oqa-map-nation" d={map.nation} />
            <path className="oqa-map-states" d={map.states} />
            <polyline className="oqa-road" points={route} />
            <polyline className="oqa-road-done" points={driven} />
            {map.pts.map(([x, y], n) => (
              <g key={n} className={`oqa-pin${n === i ? " on" : n < i ? " past" : ""}`}
                 transform={`translate(${x} ${y})`} onClick={() => go(n)}
                 role="button" tabIndex={0} aria-label={`${stops[n].place}, ${stops[n].date}`}
                 onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(n); } }}>
                <circle className="hit" r="15" />
                <circle className="dot" r={n === i ? 8 : 5.5} />
                {n === i && <circle className="ring" r="15" />}
              </g>
            ))}
            <g className="oqa-car" style={{ transform: `translate(${cx}px, ${cy}px) scale(var(--cs)) translateY(-14px) scaleX(${flip ? -1 : 1})` }}>
              <Car />
            </g>
            <text className="oqa-map-label" x={cx} y={cy + 38} textAnchor="middle">{stop.place}</text>
          </svg>

          <article className="oqa-card" aria-live="polite">
            <div className="oqa-card-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame(stop.img)} alt={`${stop.place}, ${stop.date}`} />
            </div>
            <p className="oqa-card-meta">Day {stop.day} of 11 · Stop {i + 1} of {stops.length}</p>
            <h3>{stop.place}{stop.where ? <small>{stop.where}</small> : null}</h3>
            <p className="oqa-card-date">{stop.date}</p>
            {stop.ask ? (
              <div className="oqa-tease">
                <p>Someone here asked America:</p>
                <p className="oqa-sub">-{stop.ask}</p>
              </div>
            ) : (
              <div className="oqa-tease"><p>No spoilers from this stop. You&apos;ll have to watch.</p></div>
            )}
            <div className="oqa-card-nav">
              <button onClick={() => go(i - 1)} disabled={i === 0}>← Back</button>
              <button onClick={() => go(i + 1)} disabled={i === last}>Next stop →</button>
            </div>
          </article>
        </div>
        <p className="oqa-trip-foot">
          The film runs this trip backwards, starting where it ended (Staten Island) and ending where it began (Venice Beach).
        </p>
      </section>

      {/* ---------------- the three questions ---------------- */}
      <section className="oqa-three">
        <h2>Everyone got the same three questions</h2>
        <ol>
          {questions.map((q, n) => {
            const Icon = [Ask, Flip, Happy][n];
            return (
              <li key={q}>
                <Icon className="oqa-three-icon" />
                <span className="oqa-q-num">Question #{n + 1}</span>
                <p>{q}</p>
              </li>
            );
          })}
        </ol>
        <p className="oqa-three-foot">Over 200 people answered. We&apos;re not telling you what they said.</p>
      </section>

      {/* ---------------- credits ---------------- */}
      <footer className="oqa-credits">
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
