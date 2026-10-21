"use client";

import { useEffect, useState } from "react";

// The "image lottery" from the old book page: click to spin through 12 pages,
// click again to stop on one. One try per visit.
const captions = [
  "Diego Sanchez's page [Meditations]",
  "Untitled photo [Don't Play Water]",
  "λ = NotMYdog [HFI λ]",
  "Untitled photo [Don't Play Water]",
  "why? GOD. [Odds & Ends pt.17]",
  "Untitled photo [Roadkill]",
  "Untitled photo [Roadkill]",
  "5G [Video Screenshots of America]",
  "λ = inverted [HFI λ]",
  "Untitled photo [Double Up!!]",
  "Elvis's jet [Video Screenshots of America]",
  "Untitled photo [Double Up!!]",
];
const frames = captions.map((_, n) => `/assets/book/lottery/${String(n + 1).padStart(2, "0")}.jpg`);

export default function BookLottery() {
  const [state, setState] = useState<"idle" | "spin" | "done">("idle");
  const [i, setI] = useState(0);

  useEffect(() => {
    if (state !== "spin") return;
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), 110);
    return () => clearInterval(t);
  }, [state]);

  const click = () => setState((s) => (s === "idle" ? "spin" : s === "spin" ? "done" : s));

  return (
    <div className="lottery">
      <button className={`lottery-box ${state}`} onClick={click} disabled={state === "done"}
              aria-label={state === "idle" ? "Spin the image lottery" : state === "spin" ? "Stop" : captions[i]}>
        {frames.map((f, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f} src={f} alt="" className={n === i ? "on" : ""} />
        ))}
        {state === "idle" && <span className="lottery-cue">Image lottery · tap to spin</span>}
      </button>
      <p className="lottery-msg" aria-live="polite">
        {state === "idle" && "Win a random page from the book."}
        {state === "spin" && "Tap again to stop!"}
        {state === "done" && <>You got: <b>{captions[i]}</b></>}
      </p>
    </div>
  );
}
