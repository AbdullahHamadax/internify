import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Sora, DM_Sans } from "next/font/google";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Internify",
  description:
    "Internify is an AI powered, two-sided learning-to-hiring platform that closes the gap between university training and industry needs by hosting employer-authored, real-world challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${dmSans.variable} antialiased`}>
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
