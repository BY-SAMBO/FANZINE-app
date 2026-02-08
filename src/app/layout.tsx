import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceBrutal = Space_Grotesk({
  variable: "--font-brutal",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FANZINE — Cine & Tex-Mex",
  description: "Sistema de gestion de restaurante FANZINE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${spaceBrutal.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
