import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "عالم الأبطال التعليمي",
  description: "تعلّم، العب، واكتشف! منصة ألعاب تعليمية عربية للصفوف الأول والثاني والثالث.",
};

export const viewport: Viewport = {
  themeColor: "#4361EE",
  width: "device-width",
  initialScale: 1,
  // Phones with a notch / gesture bar: the app draws edge to edge and keeps content inside the safe area (globals.css).
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Android app: the page the WebView was asked for, before the app starts (see Providers). */}
        <script dangerouslySetInnerHTML={{ __html: "window.__heroesEntry=location.pathname+location.search" }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
