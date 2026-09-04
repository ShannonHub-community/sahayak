import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resource Ledger',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
