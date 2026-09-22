import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import { MessageProvider } from "@/context/MessageProvider";
import { AnimationProvider } from "@/components/AnimationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDM Sensor Portal",
  description: "Live and historical predictive-maintenance telemetry for factory motors.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    localStorage.setItem("pdm-theme", "dark");
    document.documentElement.dataset.theme = "dark";
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

// Same "run before paint" reasoning as the theme script above, for the /3d flow's
// transparent-background override (see globals.css's html[data-flow="3d"] rules) —
// app/3d/layout.tsx sets the same attribute in a useEffect for client-side navigation
// into /3d, but that runs after first paint, which would flash the regular opaque
// background for a moment on a hard page load. No-op for every other route.
const FLOW_INIT_SCRIPT = `
(function () {
  if (location.pathname === "/3d" || location.pathname.indexOf("/3d/") === 0) {
    document.documentElement.dataset.flow = "3d";
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint so the correct theme applies with no flash of the wrong palette. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: FLOW_INIT_SCRIPT }} />
      </head>
      <body className="h-full" suppressHydrationWarning>
        <ThemeProvider>
          <AnimationProvider>
            <MessageProvider>{children}</MessageProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
