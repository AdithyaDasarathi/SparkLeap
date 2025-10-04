import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./chat-bubbles.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SparkLeap Tasks",
  description: "Task management application with AI chat assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true} data-qb-installed="true">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          // Global gradient background persisted for every page
          minHeight: '100vh',
          background: `radial-gradient(1200px 600px at 50% -10%, rgba(255, 88, 24, 0.35), rgba(0,0,0,0) 60%),
                       radial-gradient(900px 500px at 85% 20%, rgba(220, 38, 38, 0.30), rgba(0,0,0,0) 60%),
                       radial-gradient(900px 500px at 10% 35%, rgba(14, 165, 233, 0.22), rgba(0,0,0,0) 60%),
                       linear-gradient(180deg, #0b0b0d 0%, #0a0a0c 60%, #09090b 100%)`,
          color: '#ffffff'
        }}
      >
        {/* Fixed ambient glow layer */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -220, left: '50%', transform: 'translateX(-50%)', width: 820, height: 520, borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%, rgba(249,115,22,0.5), rgba(220,38,38,0.4) 55%, rgba(236,72,153,0.25))', filter: 'blur(90px)' }} />
          <div style={{ position: 'absolute', top: 140, left: 40, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle at 45% 50%, rgba(59,130,246,0.28), rgba(6,182,212,0.2))', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: -60, right: 0, width: 620, height: 440, borderRadius: '50%', background: 'radial-gradient(circle at 60% 40%, rgba(147,51,234,0.32), rgba(236,72,153,0.22))', filter: 'blur(90px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
