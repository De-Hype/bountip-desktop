import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";



export const metadata: Metadata = {
  title: "Bountip Desktop",
  description: "Offline-first bountip",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        // className={`${nunito.variable} font-sans antialiased`}
        // style={{ fontFamily: "var(--font-nunito)" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
