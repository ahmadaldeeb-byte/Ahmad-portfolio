import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Lets teachers install the web version as an app (on HTTPS). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "عالم الأبطال التعليمي",
    short_name: "عالم الأبطال",
    description: "منصة ألعاب تعليمية عربية للصفوف الأول والثاني والثالث.",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "fullscreen",
    background_color: "#F7F8FC",
    theme_color: "#4361EE",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
