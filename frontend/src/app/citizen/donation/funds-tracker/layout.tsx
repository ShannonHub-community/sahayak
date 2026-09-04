import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Funds Tracker',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
