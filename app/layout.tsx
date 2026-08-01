import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "District Emergency Operations Centre (DEOC) | Panvel, Raigad",
  description: "Government of Maharashtra - District Disaster Management Authority (DDMA)",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F7F9] text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}