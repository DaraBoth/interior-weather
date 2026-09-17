"use client";

/** នាយកដ្ឋានសម្រេចចិត្តរាវ — ច្បាប់ ការប្រកួត និងការសារភាព។ */

import { useState } from "react";
import { beep, boing, clunk, raspberry, trombone } from "@/lib/audio";

const RULES = [
  "អ្នកណាដែលឈ្មោះមានអក្សរ រ ត្រូវផឹក។",
  "អ្នកខ្ពស់ជាងគេត្រូវផឹក។ ហាមវាស់។ ជជែកតវ៉ាគ្នាទៅ។",
  "អ្នកណាកាន់ទូរស័ព្ទត្រូវផឹក។ បាទ អ្នកនោះហើយ។",
  "អ្នកក្មេងជាងគេបង្កើតច្បាប់មួយ។ ច្បាប់នោះជាធរមាន។",
  "អ្នកណាពាក់អ្វីពណ៌ខ្មៅត្រូវផឹក។ នេះគឺភាគច្រើននៃពួកអ្នក។",
  "អ្នកនិយាយចុងក្រោយត្រូវផឹក។ អ្នកនិយាយបន្ទាប់ក៏ត្រូវផឹកដែរ។",
  "អ្នកនៅខាងឆ្វេងម្ចាស់ផ្ទះត្រូវផឹកពីរដង ជំនួសម្ចាស់ផ្ទះ។",
  "អ្នកណាបានមើលម៉ោងក្នុងមួយនាទីចុងក្រោយត្រូវផឹក។",
  "អ្នកប្រើដៃឆ្វេងរួចផុតពីច្បាប់នេះ ហើយក្អេងក្អាងអំពីវា។",
  "អ្នកណាធ្លាប់មកផ្ទះនេះពីមុនត្រូវផឹក។",
  "អ្នកណាស្នើលេងហ្គេមនេះត្រូវផឹក។ គំនិតរបស់អ្នកហើយ។",
  "គ្មាននរណាផឹកទេ។ អង្គុយជាមួយការខកចិត្តទៅ។",
  "គ្រប់គ្នាចង្អុលទៅនរណាម្នាក់។ អ្នកដែលគេចង្អុលច្រើនជាងគេត្រូវផឹក។",
  "អ្នកដែលមានសារមិនទាន់អានច្រើនជាងគេត្រូវផឹក។",
  "អ្នកណានិយាយពាក្យ 'ផឹក' ក្នុងវគ្គបន្ទាប់ត្រូវផឹក។",
];

const NEVER = [
  "ខ្ញុំមិនដែលធ្វើពុតថាស្គាល់បទចម្រៀងដែលខ្ញុំមិនស្គាល់ទេ។",
  "ខ្ញុំមិនដែលចាកចេញពីក្រុមឆាត រួចចូលវិញស្ងាត់ៗទេ។",
  "ខ្ញុំមិនដែលថតរូបម្ហូប រួចទុករហូតត្រជាក់ទេ។",
  "ខ្ញុំមិនដែលព្រមទទួលការណាត់ជួប ទាំងគិតទុកជាមុនថានឹងលុបចោលទេ។",
  "ខ្ញុំមិនដែលស្វែងរកឈ្មោះខ្លួនឯងក្នុងហ្គូហ្គលទេ។ ពីរដង។",
  "ខ្ញុំមិនដែលសើចនឹងរឿងកំប្លែងដែលខ្ញុំមិនបានឮទេ។",
  "ខ្ញុំមិនដែលនិយាយថា 'នៅប្រាំនាទីទៀតដល់' ទាំងដេកលើគ្រែទេ។",
  "ខ្ញុំមិនដែលជជែកតវ៉ាអំពីរឿងដែលខ្ញុំទើបតែអានដប់នាទីមុនទេ។",
  "ខ្ញុំមិនដែលចិញ្ចឹមដើមឈើឱ្យរស់បានពេញមួយឆ្នាំទេ។",
  "ខ្ញុំមិនដែលហាត់ជជែកតវ៉ាក្នុងបន្ទប់ទឹក រួចចាញ់ទេ។",
  "ខ្ញុំមិនដែលធ្វើពុតថាវ៉ាយហ្វាយដាច់ទេ។",
  "ខ្ញុំមិនដែលយកដុំចុងក្រោយ ហើយមិននិយាយអ្វីទេ។",
];

const DARES = [
  "ធ្វើត្រាប់តាមអ្នកនៅខាងឆ្វេងអ្នកឱ្យអស់ពីសមត្ថភាព។ គេជាអ្នកកាត់សេចក្តីថាល្អឬអត់។",
  "ផ្ញើសារទៅមនុស្សទីប្រាំក្នុងបញ្ជីថ្មីៗរបស់អ្នក ត្រឹមពាក្យ 'បញ្ជាក់'។ គ្មានអ្វីផ្សេងទេ។",
  "និយាយតែជាសំណួរប៉ុណ្ណោះ រហូតដល់វេនបន្ទាប់របស់អ្នក។",
  "ទុកឱ្យក្រុមជ្រើសរើសបទចម្រៀងបន្ទាប់របស់អ្នក។ ហាមបដិសេធ។",
  "ពិពណ៌នាការងាររបស់អ្នកទៅក្រុម ដូចជាវាជាបទល្មើសព្រហ្មទណ្ឌ។",
  "ប្តូរកន្លែងអង្គុយជាមួយនរណាម្នាក់ ហើយការពារមតិរបស់គេមួយវគ្គ។",
  "និយាយរឿងល្អពិតប្រាកដអំពីមនុស្សគ្រប់រូបនៅទីនេះ។ បាទ គ្រប់គ្នា។",
  "បង្ហាញក្រុមនូវរូបថតចុងក្រោយដែលអ្នកថត។ ហាមពន្យល់បរិបទ។",
  "រាំឱ្យអាក្រក់បំផុតតាមដែលអាចធ្វើបានដប់វិនាទី។ ធ្វើឱ្យអស់ពីចិត្ត។",
  "និទានរឿងមួយដែលពិត ៩០%។ ក្រុមទាយ ១០% ដែលនៅសល់។",
];

type Mode = "rule" | "never" | "dare";

const LABEL: Record<Mode, string> = { rule: "ច្បាប់មួយ", never: "ការសារភាព", dare: "ការប្រកួត" };
const POOL: Record<Mode, string[]> = { rule: RULES, never: NEVER, dare: DARES };

export default function Drink() {
  const [mode, setMode] = useState<Mode>("rule");
  const [text, setText] = useState("ទាញដងកាន់។ ទទួលយកផលវិបាក។");
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
            <div className="mk">នាយកដ្ឋានសម្រេចចិត្តរាវ · ជាន់ទី ១</div>
            <h1>ច្បាប់ដែលគ្មាននរណាព្រមព្រៀង</h1>
          </div>
          <div className="cert">
            ក្រសួងចេញឱ្យ<br />
            សេចក្តីណែនាំ មិនមែនការអនុញ្ញាតទេ<br />
            វគ្គ {String(round).padStart(3, "0")}
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
                setText("គ្រប់គ្នាត្រូវផឹក។ គ្មានហេតុផលទេ។ ក្រសួងមិនពន្យល់ខ្លួនឯងទេ។");
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
