/**
 * The mark of the ministry: a serrated official seal with the big red button at
 * its centre.
 *
 * The button was already the building's emblem — it is the one object every
 * visitor touches. Ringing it in a seal says the rest: this is a government
 * department that has formally approved your drinking.
 *
 * The teeth around the rim are what make it a seal rather than a target. Two
 * plain concentric circles read as a dartboard at any size, and a rotation does
 * nothing to a circle, so the silhouette has to carry the meaning.
 *
 * Deliberately wordless. Text in an icon fails twice over: unreadable at 32px,
 * and Khmer glyphs would need a font shipped into the image generator.
 *
 * Shared by the favicon, the iOS icon and the PWA icons so the app has one face.
 */

type Props = {
  /** Canvas size in px. Every measurement below scales from this. */
  s: number;
  /** Maskable icons get padding so a circular crop cannot clip the seal. */
  safe?: boolean;
};

const TEETH = 24;

export function Mark({ s, safe = false }: Props) {
  // A maskable icon must keep its content inside the middle 80%.
  const inset = safe ? s * 0.1 : 0;
  const box = s - inset * 2;

  const rim = box * 0.94; // where the teeth sit
  const ring = box * 0.78; // the solid ring inside them
  const button = box * 0.44; // the red button
  const stroke = Math.max(2, box * 0.05);
  const tooth = Math.max(2, box * 0.035);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // the building's enamel, not a flat colour
        background: "linear-gradient(155deg,#2f322c,#191b17)",
      }}
    >
      <div
        style={{
          width: box,
          height: box,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* serrated rim: the thing that says "seal" */}
        {Array.from({ length: TEETH }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: tooth,
              height: tooth,
              borderRadius: tooth,
              display: "flex",
              background: "#c8342b",
              transform: `rotate(${(360 / TEETH) * i}deg) translateY(${-rim / 2}px)`,
            }}
          />
        ))}

        {/* the solid ring */}
        <div
          style={{
            position: "absolute",
            width: ring,
            height: ring,
            borderRadius: ring,
            border: `${stroke}px solid #c8342b`,
            display: "flex",
          }}
        />

        {/* the button, lit from the top left like the one in the lobby */}
        <div
          style={{
            position: "absolute",
            width: button,
            height: button,
            borderRadius: button,
            display: "flex",
            background:
              "radial-gradient(circle at 36% 30%,#e8574c,#c8342b 55%,#8e211a)",
          }}
        />
      </div>
    </div>
  );
}
