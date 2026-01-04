'use client';

import { useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import SchedulesPage from './pages/SchedulesPage';
import HistoryPage from './pages/HistoryPage';
import ArtistsPage from './pages/ArtistsPage';
import { ScheduleProvider } from '@/src/contexts/ScheduleContext';
import { ApolloClientProvider } from '@/src/client/ApolloClientProvider';
import Sidebar from '../../components/Sidebar';

type MenuType = 'dashboard' | 'schedules' | 'artists' | 'history';

interface MainLayoutClientProps {
  userName: string;
}

export default function MainLayoutClient({ userName }: MainLayoutClientProps) {
  const [currentMenu, setCurrentMenu] = useState<MenuType>('dashboard');

  return (
    <ApolloClientProvider>
      <div className='flex w-full h-screen bg-light'>
        <Sidebar
          userName={userName}
          currentMenu={currentMenu}
          onMenuChange={setCurrentMenu}
        />

        {/* Main Content - 모든 페이지를 미리 마운트하고 display로 제어 */}
        <main className='flex-1 overflow-auto'>
          {/* Dashboard Page */}
          <div className={currentMenu === 'dashboard' ? 'block' : 'hidden'}>
            <ScheduleProvider endpoint='today'>
              <DashboardPage />
            </ScheduleProvider>
          </div>

          {/* Schedules Page */}
          <div className={currentMenu === 'schedules' ? 'block' : 'hidden'}>
            <ScheduleProvider endpoint='list'>
              <SchedulesPage />
            </ScheduleProvider>
          </div>

          {/* History Page */}
          <div className={currentMenu === 'history' ? 'block' : 'hidden'}>
            <ScheduleProvider endpoint='history'>
              <HistoryPage />
            </ScheduleProvider>
          </div>

          {/* Artists Page */}
          <div className={currentMenu === 'artists' ? 'block' : 'hidden'}>
            <ArtistsPage />
          </div>
        </main>
      </div>
    </ApolloClientProvider>
  );
}
