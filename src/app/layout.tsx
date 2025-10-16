import { WagmiWrapper } from "@/components/WagmiWrapper";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WagmiWrapper>{children}</WagmiWrapper>
      </body>
    </html>
  );
}
