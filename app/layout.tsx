import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Emergency Command Portal | District Disaster Management Authority",
  description: "Official Emergency Operations Center (EOC) Command System",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}