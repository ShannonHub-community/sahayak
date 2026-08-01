import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Sahayak - Gov Portal",
  description: "Government Emergency Management Portal",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}