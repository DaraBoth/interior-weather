"use client";

/**
 * FORM 27-B — deliberately terrible interface design.
 *
 * The rule that keeps this funny rather than merely annoying: it is always
 * completable. Every obstacle is surmountable within a few seconds once you
 * work out the joke. Nothing here is a dead end.
 */

import { useState } from "react";
import * as S from "@/lib/secrets";
import { beep, raspberry, fanfare, trombone } from "@/lib/audio";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Form27B() {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [reason, setReason] = useState("");
  const [notNotAgree, setNotNotAgree] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [dodge, setDodge] = useState(0);
  const [done, setDone] = useState(false);
  const [shout, setShout] = useState<string | null>(null);

  const captchaOK = captcha.trim().toLowerCase() === "no";
  const complete = name.trim().length > 1 && year && day && month && reason.trim().length > 3 && notNotAgree && captchaOK;

  const missing = () => {
    if (!name.trim()) return "FIELD 1 IS EMPTY. IT IS THE FIRST ONE.";
    if (!year || !day || !month) return "THE DATE IS INCOMPLETE. THE ORDER IS DELIBERATE.";
    if (reason.trim().length <= 3) return "REASON TOO SHORT. WE REQUIRE AT LEAST FOUR CHARACTERS OF SINCERITY.";
    if (!notNotAgree) return "YOU HAVE NOT NOT DISAGREED. READ IT AGAIN.";
    if (!captchaOK) return "VERIFICATION FAILED. THE ANSWER IS SHORTER THAN YOU THINK.";
    return null;
  };

  const trySubmit = () => {
    const m = missing();
    if (m) {
      setShout(m);
      raspberry();
      setDodge((d) => d + 1);
      return;
    }
    setDone(true);
    fanfare();
    S.discover("form27b");
  };

  if (done) {
    return (
      <div className="wrap">
        <div className="machine" style={{ textAlign: "center" }}>
          <span className="screw tl" /><span className="screw tr" />
          <span className="screw bl" /><span className="screw br" />
          <div className="mk">Form 27-B</div>
          <h1 style={{ fontSize: "clamp(26px,6vw,46px)", margin: "10px 0 14px", textTransform: "uppercase" }}>
            Submitted
          </h1>
          <div className="readout" style={{ textAlign: "left" }}>
            <p className="rd-line">
              THANK YOU, {name.toUpperCase() || "APPLICANT"}. YOUR FORM HAS BEEN RECEIVED AND IMMEDIATELY MISPLACED.
            </p>
            <p className="rd-sub">
              REFERENCE {Math.random().toString(36).slice(2, 10).toUpperCase()} · NOBODY WILL BE IN TOUCH
            </p>
          </div>
          <p className="tiny" style={{ marginTop: 14 }}>
            You are one of very few people to complete Form 27-B. The Ministry is unsettled by this.
          </p>
          <button className="btn amber big" style={{ marginTop: 16 }} onClick={() => { setDone(false); trombone(); }}>
            Submit another (why)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Form 27-B · Application to Apply</div>
            <h1>Form 27-B</h1>
          </div>
          <div className="cert">
            ALL FIELDS MANDATORY<br />
            INCLUDING THE OPTIONAL ONES<br />
            v1.0.0 (1998)
          </div>
        </div>

        {shout && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", background: "var(--red)",
            border: "3px solid #241f0e", borderRadius: 8, color: "#fff",
            fontFamily: "var(--f-read)", fontWeight: 700, fontSize: 13,
          }}>
            {shout}
          </div>
        )}

        <div className="grid">
          <div className="cell s12">
            <span className="cap">1. Name (surname first, then also surname first again)</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="cell s12">
            <span className="cap">2. Date of anything. Year first. Then day. Then month. Obviously.</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select className="field" style={{ flex: 1, minWidth: 100 }} value={year} onChange={(e) => { setYear(e.target.value); beep(500, 0.04); }}>
                <option value="">Year</option>
                {Array.from({ length: 40 }).map((_, i) => <option key={i}>{2026 - i}</option>)}
              </select>
              <select className="field" style={{ flex: 1, minWidth: 100 }} value={day} onChange={(e) => { setDay(e.target.value); beep(500, 0.04); }}>
                <option value="">Day</option>
                {Array.from({ length: 31 }).map((_, i) => <option key={i}>{i + 1}</option>)}
              </select>
              <select className="field" style={{ flex: 1, minWidth: 100 }} value={month} onChange={(e) => { setMonth(e.target.value); beep(500, 0.04); }}>
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="cell s12">
            <span className="cap">3. Department (one option, still required)</span>
            <select className="field" defaultValue="Interior Weather">
              <option>Interior Weather</option>
            </select>
          </div>

          <div className="cell s12">
            <span className="cap">4. Reason for applying to apply</span>
            <textarea
              className="field"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: "vertical", fontFamily: "var(--f-read)" }}
            />
            <div className="tiny">Minimum four characters. Maximum sincerity.</div>
          </div>

          <div className="cell s12">
            <span className="cap">5. Verification</span>
            <div className="mono" style={{ fontSize: 14, color: "var(--ink)" }}>
              Type the answer to this question: <b>Is this form well designed?</b>
            </div>
            <input className="field" value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="two letters" />
          </div>

          <div className="cell s12">
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={notNotAgree}
                onChange={(e) => { setNotNotAgree(e.target.checked); beep(700, 0.05); }}
                style={{ width: 22, height: 22, flex: "none", marginTop: 2, cursor: "pointer" }}
              />
              <span className="mono" style={{ fontSize: 13, lineHeight: 1.6 }}>
                I do not decline to not withhold my non-disagreement with the terms I have not been shown.
              </span>
            </label>
          </div>

          <div className="cell s12" style={{ alignItems: "center" }}>
            <button
              className="btn amber big"
              onClick={trySubmit}
              onMouseEnter={() => { if (missing()) setDodge((d) => d + 1); }}
              style={{
                transform: missing()
                  ? `translate(${Math.sin(dodge * 2.7) * 90}px, ${Math.cos(dodge * 1.9) * 22}px)`
                  : "none",
                transition: "transform .2s cubic-bezier(.3,1.5,.5,1)",
              }}
            >
              Submit
            </button>
            <div className="tiny" style={{ textAlign: "center" }}>
              The button settles down once the form is genuinely complete. It is not malicious. It is just like this.
            </div>
          </div>
        </div>

        <div className="footplate">
          <span>THIS FORM IS AN APPLICATION TO APPLY. THE ACTUAL FORM IS FORM 27-C.</span>
          <span>FORM 27-C DOES NOT EXIST</span>
        </div>
      </div>
    </div>
  );
}
