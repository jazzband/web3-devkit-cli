import type { ReactNode } from "react";
import { SolanaProviders } from "./solana-providers";

export const metadata = {
  title: "{{projectName}}",
  description: "Solana dApp with wallet adapter",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}
