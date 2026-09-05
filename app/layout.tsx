import type { Metadata, Viewport } from "next";
import "./globals.css";
import Ministry from "@/components/Ministry";

export const metadata: Metadata = {
  title: "Ministry of Interior Weather",
  description:
    "A government department that does nothing, badly, on purpose. Games, dares, a camera that decides who drinks, and a great deal of hidden nonsense.",
  applicationName: "Ministry of Interior Weather",
  openGraph: {
    title: "Ministry of Interior Weather",
    description:
      "A very serious building full of very stupid machines. Bring friends.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#22241f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Ministry>{children}</Ministry>
      </body>
    </html>
  );
}
