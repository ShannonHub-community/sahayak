import { redirect } from 'next/navigation';

export default function AdminRootRedirect() {
  redirect('/admin/twin');
}