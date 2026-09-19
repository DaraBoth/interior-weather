import type { MetadataRoute } from "next";

/**
 * Installable as an app. The building is a party tool: phones, a table, bad
 * signal in someone's kitchen. Standalone display and offline caching matter
 * more here than they would for a normal site.
 */

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ផឹកភ្លាម",
    short_name: "ផឹកភ្លាម",
    description:
      "ក្រសួងមួយដែលមិនធ្វើអ្វីទាំងអស់ ធ្វើមិនល្អ ហើយធ្វើដោយចេតនា។ ហ្គេម ការភ្នាល់ និងរឿងឥតបានការលាក់ទុកយ៉ាងច្រើន។",
    lang: "km",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#22241f",
    theme_color: "#22241f",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa-icon/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "កង់មូល", short_name: "កង់មូល", url: "/wheel" },
      { name: "គ្រាប់បែក", short_name: "គ្រាប់បែក", url: "/bomb" },
      { name: "នរណាផឹក", short_name: "នរណាផឹក", url: "/pick" },
    ],
  };
}
