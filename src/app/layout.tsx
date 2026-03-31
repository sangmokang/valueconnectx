import type { Metadata } from "next";
import GNB from "@/components/layout/gnb";
import Providers from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValueConnect X",
  description: "검증된 인재와 기업 리더를 연결하는 Private Talent Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#f0ebe2",
          fontFamily: "Georgia, serif",
        }}
      >
        <GNB />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
