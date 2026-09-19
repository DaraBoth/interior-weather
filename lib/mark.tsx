/**
 * The mark of the ministry: a glass, stamped and approved.
 *
 * The name is ផឹកភ្លាម — drink now — so the icon has to say "drink" before it
 * says anything else. The glass carries that at a glance; the red seal behind it
 * carries the joke, which is that a government department has formally approved
 * it. An earlier version used the lobby's red button: distinctive inside the
 * site, meaningless on a home screen next to twenty other apps.
 *
 * Built only from boxes, borders and border-radius. next/og renders through
 * Satori, which ignores clip-path and most SVG-ish tricks — an earlier attempt
 * at a tapered tumbler silently came out a plain rectangle. Rounded lower
 * corners and a heavy rim do the same job with primitives that actually render.
 *
 * Wordless on purpose: unreadable at 32px, and Khmer glyphs would need a font
 * shipped into the image generator.
 *
 * Shared by the favicon, the iOS icon and the PWA icons so the app has one face.
 */

type Props = {
  /** Canvas size in px. Every measurement below scales from this. */
  s: number;
  /** Maskable icons get padding so a circular crop cannot clip the seal. */
  safe?: boolean;
};

const TEETH = 20;

export function Mark({ s, safe = false }: Props) {
  // A maskable icon must keep its content inside the middle 80%.
  const inset = safe ? s * 0.1 : 0;
  const box = s - inset * 2;

  const rim = box * 0.96; // where the seal's teeth sit
  const tooth = Math.max(2, box * 0.03);

  const gW = box * 0.4; // the glass
  const gH = box * 0.5;
  const wall = Math.max(2, box * 0.055); // its cream walls
  const foot = box * 0.1; // rounded base, which is what reads as "glass"
  const head = gH * 0.22; // the froth line

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
        {/* the seal's serrated rim */}
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

        {/* the glass: cream walls, open at the top, rounded at the foot */}
        <div
          style={{
            width: gW,
            height: gH,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            borderLeft: `${wall}px solid #e8e2d2`,
            borderRight: `${wall}px solid #e8e2d2`,
            borderBottom: `${wall}px solid #e8e2d2`,
            borderBottomLeftRadius: foot,
            borderBottomRightRadius: foot,
            background: "#1b1d18",
            overflow: "hidden",
          }}
        >
          {/* the head on the drink */}
          <div
            style={{
              width: "100%",
              height: head,
              display: "flex",
              background: "#f4efe2",
            }}
          />
          {/* and what is under it */}
          <div
            style={{
              width: "100%",
              height: gH * 0.58,
              display: "flex",
              background: "linear-gradient(180deg,#f0b93a,#d98f0c)",
              borderBottomLeftRadius: foot * 0.7,
              borderBottomRightRadius: foot * 0.7,
            }}
          />
        </div>
      </div>
    </div>
  );
}
