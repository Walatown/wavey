import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wavey - Surf Conditions",
  description: "Real-time surf conditions with AI-powered explanations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}