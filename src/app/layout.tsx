import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MuiProvider } from "./components/MuiProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catan Tracker",
  description: "Track your Catan game statistics and settlements",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
