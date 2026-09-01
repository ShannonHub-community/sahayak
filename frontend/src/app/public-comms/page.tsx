import { redirect } from 'next/navigation';

export default function LegacyPublicCommsRedirect() {
  redirect('/admin/public-comms');
}
