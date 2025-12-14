import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { authOptions } from '../api/auth/authOptions';
import MainLayoutClient from './MainLayoutClient';
import PCLayout from '@/src/layout/PCLayout';

export default async function MainLayout() {
  const session = await getServerSession(authOptions as NextAuthOptions);
  const userName = session?.user?.name || 'User';

  return (
    <PCLayout>
      <MainLayoutClient userName={userName} />
    </PCLayout>
  );
}
