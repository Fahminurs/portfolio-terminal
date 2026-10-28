import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const departure = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-display-face",
  display: "swap",
});

// JetBrains Mono's latin subset has no box-drawing glyphs, so ─┌┤ fell back to a ~1.6× wider
// font and every ASCII diagram drifted. Departure Mono has them; scale its 0.636em advance
// down to JetBrains' 0.6em so box art and text share one grid.
const boxDrawing = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-box",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    { prop: "unicode-range", value: "U+2500-259F" },
    { prop: "size-adjust", value: "94.3%" },
  ],
});

export const metadata: Metadata = {
  title: "Fahmi Nursafaat — Computer Engineer · Software & Embedded",
  description:
    "Portofolio Fahmi Nursafaat, Computer Engineer dari Bandung. Software, embedded systems (ESP32), IoT, dan computer vision (YOLOv8, PaddleOCR).",
  authors: [{ name: "Fahmi Nursafaat" }],
  openGraph: {
    title: "Fahmi Nursafaat — Computer Engineer",
    description: "Software · Embedded · Networking · Computer Vision. Bandung, ID.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0a",
};

// runs before paint: mark JS (scan-in reveals; auto-revoked after 4s if the reveal observer never boots),
// restore theme + plain mode (?plain=1 or saved) + skip boot screen if already seen
const preload = `try{var d=document.documentElement;d.dataset.js='1';setTimeout(function(){if(!d.dataset.revealReady)delete d.dataset.js},4000);var t=localStorage.getItem('fahmi:theme');if(t&&t!=='amber')d.dataset.theme=t;var p=new URLSearchParams(location.search).get('plain');if(p==='1')localStorage.setItem('fahmi:plain','1');if(p==='0')localStorage.removeItem('fahmi:plain');if(localStorage.getItem('fahmi:plain'))d.dataset.plain='1';if(d.dataset.plain||sessionStorage.getItem('fahmi:booted')||matchMedia('(prefers-reduced-motion: reduce)').matches)d.dataset.booted='1'}catch(e){}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Fahmi Nursafaat",
  jobTitle: "Computer Engineer",
  address: { "@type": "PostalAddress", addressLocality: "Bandung", addressCountry: "ID" },
  alumniOf: "Universitas Pendidikan Indonesia",
  sameAs: ["https://github.com/Fahminurs"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${jetbrains.variable} ${plex.variable} ${departure.variable} ${boxDrawing.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preload }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="backdrop grain min-h-dvh">{children}</body>
    </html>
  );
}
