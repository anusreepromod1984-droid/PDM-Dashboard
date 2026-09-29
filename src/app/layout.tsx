import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import { MessageProvider } from "@/context/MessageProvider";
import { AnimationProvider } from "@/components/AnimationProvider";
import { LanguageProvider } from "@/context/LanguageProvider";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full" suppressHydrationWarning>
        <ThemeProvider>
          <AnimationProvider>
            <LanguageProvider>
              <MessageProvider>{children}</MessageProvider>
            </LanguageProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
