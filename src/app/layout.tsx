import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TopBar } from "@/components/TopBar";
import { ToastContainer } from "@/components/ToastContainer";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KAL'SITE",
    template: "%s | KAL'SITE",
  },
  description:
    "Multipurpose Arknights web platform for games, records, and tools.",
  icons: {
    icon: "/kaltsit-e1.png",
  },
  openGraph: {
    type: "website",
    siteName: "KAL'SITE",
    title: "KAL'SITE",
    description:
      "Multipurpose Arknights web platform for games, records, and tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KAL'SITE",
    description:
      "Multipurpose Arknights web platform for games, records, and tools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-mono bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TopBar />
          <main className="flex-1 flex flex-col">{children}</main>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
