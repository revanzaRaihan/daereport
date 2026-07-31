import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LocaleProvider from "@/components/LocaleProvider";
import ThemeProvider from "@/components/ThemeProvider";
import LenisProvider from "@/components/LenisProvider";
import ConfirmProvider from "@/components/ConfirmProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Report Studio",
  description: "Dashboard laporan progres murid dengan AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black font-sans select-none overflow-x-hidden">
        <LocaleProvider>
          <ThemeProvider>
            <ConfirmProvider>
              <LenisProvider>
                {children}
              </LenisProvider>
            </ConfirmProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
