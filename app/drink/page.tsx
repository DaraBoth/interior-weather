"use client";

/** DEPARTMENT OF LIQUID DECISIONS — rules, dares, and confessions. */

import { useState } from "react";
import { beep, boing, clunk, raspberry, trombone } from "@/lib/audio";

const RULES = [
  "Everyone whose name contains an R drinks.",
  "The tallest person drinks. No measuring. Argue instead.",
  "Anyone holding a phone drinks. Yes, you.",
  "Youngest person invents a rule. It is binding.",
  "Everyone wearing something black drinks. This is most of you.",
  "Whoever spoke last drinks. Whoever speaks next also drinks.",
  "The person to the left of the host drinks twice, for the host.",
  "Anyone who has checked the time in the last minute drinks.",
  "Left-handed people are exempt from this rule and smug about it.",
  "Everyone who has been to this house before drinks.",
  "Whoever suggested this game drinks. It was your idea.",
  "Nobody drinks. Sit with the disappointment.",
  "Everyone points at someone. Most-pointed drinks.",
  "The person with the most unread messages drinks.",
  "Anyone who says the word 'drink' for the next round drinks.",
];

const NEVER = [
  "Never have I ever pretended to know a song I did not know.",
  "Never have I ever left a group chat and rejoined quietly.",
  "Never have I ever taken a photo of food and not eaten it warm.",
  "Never have I ever agreed to plans I intended to cancel.",
  "Never have I ever googled myself. Twice.",
  "Never have I ever laughed at a joke I did not hear.",
  "Never have I ever said 'I'm five minutes away' from bed.",
  "Never have I ever argued about something I first read ten minutes earlier.",
  "Never have I ever kept a plant alive for a full year.",
  "Never have I ever rehearsed an argument in the shower and lost.",
  "Never have I ever pretended the wifi cut out.",
  "Never have I ever taken the last one and said nothing.",
];

const DARES = [
  "Do your best impression of the person on your left. They choose if it was good.",
  "Text the fifth person in your recent list the word 'confirmed'. Nothing else.",
  "Speak only in questions until your next turn.",
  "Let the group choose your next song. No vetoes.",
  "Describe your job to the group as if it were a crime.",
  "Swap seats with someone and defend their opinions for one round.",
  "Say something genuinely nice about everyone here. Yes, everyone.",
  "Show the group the last photo you took. Context is not permitted.",
  "Do the worst dance you can for ten seconds. Commit fully.",
  "Tell a story that is 90% true. The group guesses the 10%.",
];

type Mode = "rule" | "never" | "dare";

const LABEL: Record<Mode, string> = { rule: "A RULE", never: "A CONFESSION", dare: "A DARE" };
const POOL: Record<Mode, string[]> = { rule: RULES, never: NEVER, dare: DARES };

export default function Drink() {
  const [mode, setMode] = useState<Mode>("rule");
  const [text, setText] = useState("PULL THE LEVER. ACCEPT THE CONSEQUENCE.");
  const [round, setRound] = useState(0);
  const [pulled, setPulled] = useState(false);

  const dispense = (m: Mode) => {
    setMode(m);
    setPulled(true);
    clunk();
    setTimeout(() => {
      const pool = POOL[m];
      setText(pool[Math.floor(Math.random() * pool.length)]);
      setRound((r) => r + 1);
      if (m === "dare") boing();
      else if (m === "never") raspberry();
      else beep(620, 0.12);
      setPulled(false);
    }, 320);
  };

  const water = round > 0 && round % 7 === 0;

  return (
    <div className="wrap">
      <div className="machine">
        <span className="screw tl" /><span className="screw tr" />
        <span className="screw bl" /><span className="screw br" />

        <div className="plate">
          <div>
            <div className="mk">Department of Liquid Decisions · Floor 1</div>
            <h1>Rules Nobody Agreed To</h1>
          </div>
          <div className="cert">
            THE MINISTRY DISPENSES<br />
            INSTRUCTIONS, NOT PERMISSION<br />
            ROUND {String(round).padStart(3, "0")}
          </div>
        </div>

        <div className="readout">
          <p className="rd-line">{pulled ? "DISPENSING…" : text}</p>
          <p className="rd-sub">
            {LABEL[mode]} · ROUND {round} · COMPLIANCE ASSUMED
          </p>
        </div>

        {water && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", background: "#4c9a56",
            border: "3px solid #241f0e", borderRadius: 8, color: "#0f1a10",
            fontFamily: "var(--f-read)", fontWeight: 700, fontSize: 13,
          }}>
            MANDATORY BULLETIN: A GLASS OF WATER. THIS IS THE ONLY RULE THE MINISTRY ACTUALLY MEANS.
          </div>
        )}

        <div className="grid">
          <div className="cell s4">
            <span className="cap">Make a rule</span>
            <button className="btn amber wide big" onClick={() => dispense("rule")}>Rule</button>
            <div className="tiny">Binding until someone objects loudly enough.</div>
          </div>
          <div className="cell s4">
            <span className="cap">Never have I ever</span>
            <button className="btn wide big" onClick={() => dispense("never")}>Confess</button>
            <div className="tiny">Drink if you have. Lie if you must.</div>
          </div>
          <div className="cell s4">
            <span className="cap">A dare</span>
            <button className="btn red wide big" onClick={() => dispense("dare")}>Dare</button>
            <div className="tiny">Refusal is permitted and will be remembered.</div>
          </div>

          <div className="cell s12">
            <span className="cap">Escalation</span>
            <button
              className="btn wide"
              onClick={() => {
                trombone();
                setText("EVERYONE DRINKS. NO REASON GIVEN. THE MINISTRY DOES NOT EXPLAIN ITSELF.");
                setRound((r) => r + 1);
              }}
            >
              Invoke Ministerial Override
            </button>
          </div>
        </div>

        <div className="footplate">
          <span>PLEASE DRINK RESPONSIBLY · THE MINISTRY WILL NOT BE HELD LIABLE FOR ANY OF THIS</span>
          <span>SEE ALSO: THE SELECTION CHAMBER</span>
        </div>
      </div>
    </div>
  );
}
