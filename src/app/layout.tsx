import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Excel Comparison",
  description: "High-performance Excel file comparison tool optimized for processing files with 150,000+ rows. Compare, analyze, and export results instantly.",
  keywords: ["Excel", "Comparison", "File Analysis", "Data Processing", "Next.js", "TypeScript", "Big Data"],
  authors: [{ name: "9arifrah" }],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Excel Comparison",
    description: "Compare Excel files with 150,000+ rows instantly. Fast, accurate, and easy-to-use.",
    url: "https://github.com/9arifrah/excel-comparison",
    siteName: "Excel Comparison",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel Comparison",
    description: "Compare Excel files with 150,000+ rows instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
