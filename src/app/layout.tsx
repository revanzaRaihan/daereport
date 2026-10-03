import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LocaleProvider from "@/components/LocaleProvider";
import ThemeProvider from "@/components/ThemeProvider";
import LenisProvider from "@/components/LenisProvider";
import ConfirmProvider from "@/components/ConfirmProvider";
import NavigationProgressProvider from "@/components/NavigationProgress";

import { APP_CONFIG } from "@/lib/branding";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  icons: {
    icon: APP_CONFIG.logoPath,
    shortcut: APP_CONFIG.logoPath,
    apple: APP_CONFIG.logoPath,
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
