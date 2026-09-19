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

const MONTHS = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];

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
    if (!name.trim()) return "ប្រអប់ទី ១ ទទេ។ វាជាប្រអប់ដំបូងគេ។";
    if (!year || !day || !month) return "កាលបរិច្ឆេទមិនពេញលេញ។ លំដាប់នេះគឺដោយចេតនា។";
    if (reason.trim().length <= 3) return "ហេតុផលខ្លីពេក។ យើងទាមទារភាពស្មោះត្រង់យ៉ាងតិចបួនតួអក្សរ។";
    if (!notNotAgree) return "អ្នកមិនបានមិនជំទាស់ទេ។ សូមអានម្តងទៀត។";
    if (!captchaOK) return "ការផ្ទៀងផ្ទាត់បរាជ័យ។ ចម្លើយខ្លីជាងអ្វីដែលអ្នកគិត។";
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
          <div className="mk">ទម្រង់ ២៧-ខ</div>
          <h1 style={{ fontSize: "clamp(26px,6vw,46px)", margin: "10px 0 14px", textTransform: "uppercase" }}>
            បានដាក់ស្នើ
          </h1>
          <div className="readout" style={{ textAlign: "left" }}>
            <p className="rd-line">
              អរគុណ {name.toUpperCase() || "អ្នកដាក់ពាក្យ"}។ ទម្រង់របស់អ្នកត្រូវបានទទួល ហើយត្រូវបានបាត់ភ្លាមៗ។
            </p>
            <p className="rd-sub">
              REFERENCE {Math.random().toString(36).slice(2, 10).toUpperCase()} · NOBODY WILL BE IN TOUCH
            </p>
          </div>
          <p className="tiny" style={{ marginTop: 14 }}>
            អ្នកជាម្នាក់ក្នុងចំណោមមនុស្សតិចតួចណាស់ដែលបំពេញទម្រង់ ២៧-ខ បាន។ ក្រសួងមានការមិនស្រួលចិត្តចំពោះរឿងនេះ។
          </p>
          <button className="btn amber big" style={{ marginTop: 16 }} onClick={() => { setDone(false); trombone(); }}>
            ដាក់ស្នើមួយទៀត (ធ្វើអី)
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
            <div className="mk">ទម្រង់ ២៧-ខ · ពាក្យសុំដាក់ពាក្យ</div>
            <h1>ទម្រង់ ២៧-ខ</h1>
          </div>
          <div className="cert">
            ប្រអប់ទាំងអស់ជាកាតព្វកិច្ច<br />
            រួមទាំងប្រអប់ស្រេចចិត្តផងដែរ<br />
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
            <span className="cap">១. ឈ្មោះ (នាមត្រកូលមុន បន្ទាប់មកនាមត្រកូលមុនម្តងទៀត)</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="cell s12">
            <span className="cap">២. កាលបរិច្ឆេទនៃអ្វីក៏បាន។ ឆ្នាំមុន។ បន្ទាប់មកថ្ងៃ។ បន្ទាប់មកខែ។ ច្បាស់ណាស់។</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select className="field" style={{ flex: 1, minWidth: 100 }} value={year} onChange={(e) => { setYear(e.target.value); beep(500, 0.04); }}>
                <option value="">ឆ្នាំ</option>
                {Array.from({ length: 40 }).map((_, i) => <option key={i}>{2026 - i}</option>)}
              </select>
              <select className="field" style={{ flex: 1, minWidth: 100 }} value={day} onChange={(e) => { setDay(e.target.value); beep(500, 0.04); }}>
                <option value="">ថ្ងៃ</option>
                {Array.from({ length: 31 }).map((_, i) => <option key={i}>{i + 1}</option>)}
              </select>
              <select className="field" style={{ flex: 1, minWidth: 100 }} value={month} onChange={(e) => { setMonth(e.target.value); beep(500, 0.04); }}>
                <option value="">ខែ</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="cell s12">
            <span className="cap">៣. នាយកដ្ឋាន (មានតែមួយជម្រើស តែនៅតែជាកាតព្វកិច្ច)</span>
            <select className="field" defaultValue="ផឹកភ្លាម">
              <option>ផឹកភ្លាម</option>
            </select>
          </div>

          <div className="cell s12">
            <span className="cap">៤. ហេតុផលក្នុងការដាក់ពាក្យសុំដាក់ពាក្យ</span>
            <textarea
              className="field"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: "vertical", fontFamily: "var(--f-read)" }}
            />
            <div className="tiny">យ៉ាងតិចបួនតួអក្សរ។ ភាពស្មោះត្រង់អតិបរមា។</div>
          </div>

          <div className="cell s12">
            <span className="cap">៥. ការផ្ទៀងផ្ទាត់</span>
            <div className="mono" style={{ fontSize: 14, color: "var(--ink)" }}>
              វាយចម្លើយចំពោះសំណួរនេះ៖ <b>តើទម្រង់នេះរចនាបានល្អទេ?</b>
            </div>
            <input className="field" value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="ពីរតួអក្សរ" />
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
                ខ្ញុំមិនបដិសេធមិនរក្សាទុកនូវការមិនជំទាស់របស់ខ្ញុំចំពោះលក្ខខណ្ឌដែលខ្ញុំមិនបានឃើញនោះទេ។
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
              ដាក់ស្នើ
            </button>
            <div className="tiny" style={{ textAlign: "center" }}>
              ប៊ូតុងនឹងស្ងប់ នៅពេលទម្រង់ពេញលេញពិតប្រាកដ។ វាមិនមានចេតនាអាក្រក់ទេ។ វាគ្រាន់តែបែបនេះ។
            </div>
          </div>
        </div>

        <div className="footplate">
          <span>ទម្រង់នេះគឺជាពាក្យសុំដាក់ពាក្យ។ ទម្រង់ពិតប្រាកដគឺទម្រង់ ២៧-គ។</span>
          <span>ទម្រង់ ២៧-គ មិនមានទេ</span>
        </div>
      </div>
    </div>
  );
}
