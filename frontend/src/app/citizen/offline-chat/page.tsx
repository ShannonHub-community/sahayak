import { redirect } from 'next/navigation';

export default function LegacyOfflineChatRedirect() {
  redirect('/citizen/ble');
}
