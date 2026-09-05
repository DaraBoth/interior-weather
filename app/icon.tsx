import { ImageResponse } from "next/og";

/**
 * The building's mark: the big red button on its enamel panel.
 * It is the one object every visitor touches, so it is what the tab should show.
 * Generated as a PNG at build time so it works in every browser and on iOS.
 */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg,#dcd6c4,#a79f8a)",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 42,
            display: "flex",
            background: "radial-gradient(circle at 36% 30%,#e8574c,#c8342b 55%,#8e211a)",
            boxShadow: "0 3px 0 #8e211a",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
