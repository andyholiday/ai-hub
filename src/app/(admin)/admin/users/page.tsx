import { Metadata } from 'next';
import { AdminUsersTab } from '@/components/features/admin/admin-users';

export const metadata: Metadata = {
  title: 'Admin · Users',
};

export default function AdminUsersPage() {
  return <AdminUsersTab />;
}
