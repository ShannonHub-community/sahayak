import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Alerts & News',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
