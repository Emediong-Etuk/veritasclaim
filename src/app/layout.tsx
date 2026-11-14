import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeritasClaim",
  description: "Multi-LLM consensus for trustworthy on-chain claim resolution. Powered by Chainlink CRE.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
