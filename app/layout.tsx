import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Headroom drops the row your question names",
  description:
    "SmartCrusher cuts the exact row a question asks about, and in Claude Code the proxy scores against \"Tool loaded.\" instead of the question. Recorded runs before and after a small fix. Unofficial demo by Cheryl Aurelia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
