import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LocaleProvider from "@/components/LocaleProvider";
import ThemeProvider from "@/components/ThemeProvider";
import LenisProvider from "@/components/LenisProvider";
import ConfirmProvider from "@/components/ConfirmProvider";
import NavigationProgressProvider from "@/components/NavigationProgress";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daely Report",
  description: "Dashboard laporan progres murid dengan AI",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body 
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-text-primary font-sans select-none overflow-x-hidden"
      >
        <LocaleProvider>
          <ThemeProvider>
            <ConfirmProvider>
              <NavigationProgressProvider>
                <LenisProvider>
                  {children}
                </LenisProvider>
              </NavigationProgressProvider>
            </ConfirmProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
