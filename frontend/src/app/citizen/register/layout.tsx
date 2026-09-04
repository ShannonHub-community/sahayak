import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pre-Register',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
