import { ImageResponse } from "next/og";
import { Mark } from "@/lib/mark";

/**
 * The tab icon: the ministry stamp. Generated as a PNG at build time so it works
 * in every browser and on iOS, where SVG favicons are still unreliable.
 */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Mark s={size.width} />, { ...size });
}
