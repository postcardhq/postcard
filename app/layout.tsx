import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/navbar";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  weight: ["400", "600", "700", "900"],
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

import { getBaseUrl } from "@/src/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "Postcard — Democratizing the truth",
  description:
    "Honesty-as-a-Service: Forensic-grade source verification for the post-truth era.",
};

import { LandingHook } from "@/components/features/landing";
import { Footer } from "@/components/ui/footer";

const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  8px,
  var(--postal-paper) 8px 10px,
  var(--postal-blue) 10px 18px,
  var(--postal-paper) 18px 20px
)`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", playfair.variable, garamond.variable)}
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
        style={{ background: "var(--postal-paper)" }}
      >
        <Navbar />
        <main className="flex-1">{children}</main>

        {/* Global Branding & Marketing */}
        <div
          className="h-2"
          style={{ backgroundImage: AIRMAIL_BG }}
          aria-hidden="true"
        />
        <LandingHook />
        <Footer />

        <Toaster position="bottom-center" theme="light" />
      </body>
    </html>
  );
}
