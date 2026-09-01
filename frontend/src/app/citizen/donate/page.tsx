import { redirect } from 'next/navigation';

export default function LegacyDonateRedirect() {
  redirect('/citizen/donation');
}
