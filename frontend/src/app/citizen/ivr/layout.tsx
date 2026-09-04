import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IVR Call Simulator',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
