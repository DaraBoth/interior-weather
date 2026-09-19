import { ImageResponse } from "next/og";
import { Mark } from "@/lib/mark";

/**
 * The iOS home-screen icon. iOS crops to a rounded square rather than a circle,
 * but it also sits on every kind of wallpaper, so this uses the padded variant
 * to keep the stamp clear of the corners.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<Mark s={size.width} safe />, { ...size });
}
