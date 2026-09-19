import { ImageResponse } from "next/og";
import { Mark } from "@/lib/mark";

/**
 * PWA icons at stable URLs, so the manifest can point at them by name:
 *   /pwa-icon/192   /pwa-icon/512   /pwa-icon/512-maskable
 *
 * Next's own icon convention appends a content hash, which is right for a
 * <link> tag it writes itself but wrong for a manifest we maintain by hand.
 * These are prerendered at build time, which also means the service worker can
 * cache them like any other static asset.
 */

export const dynamic = "force-static";

const VARIANTS = {
  "192": { s: 192, safe: false },
  "512": { s: 512, safe: false },
  "512-maskable": { s: 512, safe: true },
} as const;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((size) => ({ size }));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ size: string }> },
) {
  const { size } = await ctx.params;
  const v = VARIANTS[size as keyof typeof VARIANTS] ?? VARIANTS["512"];
  return new ImageResponse(<Mark s={v.s} safe={v.safe} />, {
    width: v.s,
    height: v.s,
  });
}
