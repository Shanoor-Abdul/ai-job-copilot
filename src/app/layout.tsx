import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saudi Job Copilot",
  description: "AI-powered job discovery and application preparation for Saudi Arabia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
