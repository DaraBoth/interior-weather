import type { Metadata, Viewport } from "next";
import "./globals.css";
import Ministry from "@/components/Ministry";
import OfflineReady from "@/components/OfflineReady";

export const metadata: Metadata = {
  title: "ផឹកភ្លាម",
  description:
    "ក្រសួងមួយដែលមិនធ្វើអ្វីទាំងអស់ ធ្វើមិនល្អ ហើយធ្វើដោយចេតនា។ ហ្គេម ការភ្នាល់ កាមេរ៉ាដែលសម្រេចថានរណាត្រូវផឹក និងរឿងឥតបានការលាក់ទុកយ៉ាងច្រើន។",
  applicationName: "ផឹកភ្លាម",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ផឹកភ្លាម",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "ផឹកភ្លាម",
    description:
      "អគាររាជការដ៏ធ្ងន់ធ្ងរមួយ ដែលពោរពេញដោយម៉ាស៊ីនឆ្កួតៗ។ នាំមិត្តភក្តិមកជាមួយ។",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#22241f",
  width: "device-width",
  initialScale: 1,
  // installed as an app it should feel like one: no accidental pinch-zoom
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="km">
      <body>
        <Ministry>{children}</Ministry>
        <OfflineReady />
      </body>
    </html>
  );
}
