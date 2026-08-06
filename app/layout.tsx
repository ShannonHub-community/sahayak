import "./globals.css";

export const metadata = {
  title: "District Emergency Operations Centre (DEOC) | Panvel",
  description: "Government Emergency Command Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F7F9] text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}