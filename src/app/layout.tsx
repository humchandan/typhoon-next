import { WagmiWrapper } from "@/components/WagmiWrapper";
import { Navbar } from "@/components/Navbar";
import { NetworkCheck } from "@/components/NetworkCheck";
import "./globals.css";

export const metadata = {
  title: "Typhoon Investment",
  description: "Decentralized Investment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <WagmiWrapper>
          <Navbar />
          <NetworkCheck />
          <main>{children}</main>
        </WagmiWrapper>
      </body>
    </html>
  );
}
