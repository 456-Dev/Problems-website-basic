"use client";

import { useState } from "react";

// Honor-system checkout for the $5 PDF, carried over from the old 456commercial book page:
// pay any way you like, swear you paid (or enter the code from page 1 of a
// physical copy), get the Google Drive link.
const PDF = "https://drive.google.com/file/d/10boEgUUNLs96TlAIJUo1b_UqRFqnkahN/view?usp=sharing";
const CODES = ["456"];

export default function BuyDigital() {
  const [zelle, setZelle] = useState(false);
  const [code, setCode] = useState("");
  const [bad, setBad] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) {
    return (
      <div className="buy buy-done">
        <h3>Thank you for your support!</h3>
        <a className="tsyc-btn" href={PDF} target="_blank" rel="noopener noreferrer">Open the digital book →</a>
        <p className="tsyc-note">Opens in Google Drive. I promise it won&apos;t hack your device &lt;3</p>
      </div>
    );
  }

  return (
    <div className="buy">
      <p className="tsyc-step"><b>1</b> Send $5 any of these ways:</p>
      <div className="buy-pay">
        <a href="https://venmo.com/michaellinares" target="_blank" rel="noopener noreferrer">Venmo</a>
        <a href="https://cash.app/$michaellinares" target="_blank" rel="noopener noreferrer">Cash App</a>
        <button type="button" onClick={() => setZelle((z) => !z)} aria-expanded={zelle}>Zelle</button>
      </div>
      {zelle && (
        <p className="buy-zelle">Zelle $5 to <b>michaellinaresfilms@gmail.com</b> from your banking app, then come back here.</p>
      )}
      <p className="tsyc-step"><b>2</b> Then:</p>
      <button type="button" className="tsyc-btn" onClick={() => setUnlocked(true)}>I swear to God I paid $5</button>

      <form className="buy-code" onSubmit={(e) => {
        e.preventDefault();
        if (CODES.includes(code.trim())) setUnlocked(true); else setBad(true);
      }}>
        <label htmlFor="promo">Own a physical copy? Enter the code from page 1:</label>
        <div>
          <input id="promo" value={code} onChange={(e) => { setCode(e.target.value); setBad(false); }}
                 placeholder="Code" autoComplete="off" />
          <button type="submit">Apply</button>
        </div>
        {bad && <p className="buy-bad" role="alert">That code didn&apos;t work.</p>}
      </form>
    </div>
  );
}
