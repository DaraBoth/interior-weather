import { ImageResponse } from "next/og";

/**
 * The iOS home-screen icon. Same mark, more room, so it gets the panel edge and
 * a screw — at 180px there is space for the joke to read.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(160deg,#dcd6c4,#c9c2ae 40%,#a79f8a)",
        }}
      >
        {/* corner screws, because it is a panel */}
        {[
          { top: 12, left: 12 },
          { top: 12, right: 12 },
          { bottom: 12, left: 12 },
          { bottom: 12, right: 12 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: 14,
              height: 14,
              borderRadius: 14,
              display: "flex",
              background: "#4a4e4a",
            }}
          />
        ))}

        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: 108,
            display: "flex",
            background: "radial-gradient(circle at 36% 30%,#e8574c,#c8342b 55%,#8e211a)",
            boxShadow: "0 8px 0 #8e211a",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
