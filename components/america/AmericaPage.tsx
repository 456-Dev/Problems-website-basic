"use client";

import RoadRail from "./RoadRail";
import { VIDEO_ID, questions } from "@/lib/america";

const WATCH = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const MAIL = "michaellinares314@gmail.com";
const embed = (start: number, autoplay: boolean) =>
  `https://www.youtube.com/embed/${VIDEO_ID}?rel=0&playsinline=1&start=${Math.max(0, start)}${autoplay ? "&autoplay=1" : ""}`;

const PLAYLIST = "https://open.spotify.com/playlist/2UalUa7nhW74YeW9MRVKI7";

export default function AmericaPage() {
  return (
    <div className="oqa">
      {/* behind everything, in 8-bit */}
      <div className="oqa-bgword" aria-hidden>
        {Array.from({ length: 4 }, (_, k) => <p key={k}>i deserve a little bit more</p>)}
      </div>
      <header className="oqa-top">
        <a href="/">456 Solutions</a>
        <a href={WATCH} target="_blank" rel="noopener noreferrer">YouTube ↗</a>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="oqa-hero">
        <div className="oqa-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/america/film/poster-wall.jpg" alt="One Question for America — poster" />
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
            <a className="oqa-btn ghost" href={PLAYLIST} target="_blank" rel="noopener noreferrer">♫ The playlist</a>
          </div>
          <div className="oqa-runtime">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="oqa-r-logo" src="/assets/america/rated-r.svg" alt="Rated R" />
            <span>75 min · free · for cursing, guns, politics</span>
          </div>
        </div>
      </section>

      {/* ---------------- the film ---------------- */}
      <section className="oqa-film" id="film">
        <h2><span>Watch the film</span></h2>
        <div className="oqa-player">
          <iframe src={embed(0, false)} title="One Question for America"
                  allow="encrypted-media; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>
        <p className="oqa-hint">75 minutes · free · <a href={WATCH} target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a></p>
      </section>

      {/* ---------------- the three questions ---------------- */}
      <section className="oqa-three">
        <h2><span>Everyone got the same</span> <span>three questions</span></h2>
        <ol>
          {questions.map((q, n) => {
            return (
              <li key={q}>
                <span className="oqa-q-num">{String(n + 1).padStart(2, "0")}</span>
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
          <p><small>Edited by</small> Michael Linares</p>
          <p className="oqa-oneline"><small>Editing consultant</small> Luciano Cecchi</p>
          <p><small>First screening</small> Hoboken Public Library, NJ <small>· June 14th</small></p>
          <p><small>Screened at</small> The Frida Cinema, Santa Ana, CA</p>
        </div>
        <div className="oqa-rating">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/america/rated-r.svg" alt="Rated R, Restricted" />
          <p>Cursing, guns, politics. And one hermit crab.</p>
        </div>
        <p className="oqa-contact">
          Want to screen it, write about it, or just talk? <a href={`mailto:${MAIL}`}>{MAIL}</a>
        </p>
        <p className="oqa-contact">
          <a href="/book/">They Said You Can&apos;t</a>, the photo book, has a whole section of screenshots from this trip.
        </p>
      </footer>

      <RoadRail />

      {/* ---------------- the very bottom: promote the movie ---------------- */}
      <section className="oqa-promo" aria-label="Watch One Question for America">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="#film"><img src="/assets/america/film/poster-wall.jpg" alt="One Question for America — poster" /></a>
        <div>
          <p className="oqa-promo-kick">YOU JUST DROVE IT. NOW WATCH IT.</p>
          <h2>“One Question for America”</h2>
          <p>Eleven days, LA to New York, over 200 strangers, three questions. 75 minutes, free.</p>
          <div className="oqa-actions">
            <a className="oqa-btn" href="#film">▶ Watch the film</a>
            <a className="oqa-btn ghost" href={PLAYLIST} target="_blank" rel="noopener noreferrer">♫ Spotify playlist</a>
          </div>
        </div>
      </section>
    </div>
  );
}
