import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { WagmiWrapper } from "@/components/WagmiWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WagmiWrapper>{children}</WagmiWrapper>
      </body>
    </html>
  );
}
