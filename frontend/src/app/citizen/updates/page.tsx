import { redirect } from 'next/navigation';

export default function LegacyUpdatesRedirect() {
  redirect('/citizen/news-report');
}
