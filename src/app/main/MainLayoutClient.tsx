'use client';

import { useState } from 'react';
import Image from 'next/image';
import DashboardPage from './pages/DashboardPage';
import SchedulesPage from './pages/SchedulesPage';
import ArtistsPage from './pages/ArtistsPage';
import Button from '@/src/components/Button';
import { signOut } from 'next-auth/react';

type MenuType = 'dashboard' | 'schedules' | 'artists';

interface MainLayoutClientProps {
  userName: string;
}

export default function MainLayoutClient({ userName }: MainLayoutClientProps) {
  const [currentMenu, setCurrentMenu] = useState<MenuType>('dashboard');

  const menuItems: { key: MenuType; label: string; icon: string }[] = [
    {
      key: 'dashboard',
      label: '대시보드',
      icon: '/dashboard.svg',
    },
    {
      key: 'schedules',
      label: '일정관리',
      icon: 'schedules.svg',
    },
    { key: 'artists', label: '작가관리', icon: '/artists.svg' },
  ];

  const renderPage = () => {
    switch (currentMenu) {
      case 'dashboard':
        return <DashboardPage />;
      case 'schedules':
        return <SchedulesPage />;
      case 'artists':
        return <ArtistsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className='flex w-full h-screen bg-light'>
      {/* Sidebar - 1440px 고정, 왼쪽 정렬 */}
      <aside className='w-[240px] px-[45px] pt-[46px] pb-[30px] bg-white flex flex-col items-center h-full border-r border-line-base flex-shrink-0'>
        {/* Logo & Title */}
        <div className='flex flex-col items-center gap-[10px] mb-[40px]'>
          <div className='relative w-[70px] h-[70px]'>
            <Image
              src='/images/icons/camera.png'
              alt='camera icon'
              fill
              className='object-contain'
              priority
              unoptimized
            />
          </div>
          <h1 className='text-body2 text-normal font-bold'>Scheduler</h1>
          <p className='text-caption1 text-normal'>{userName}</p>
        </div>

        {/* Menu Items */}
        <nav className='flex flex-col gap-[10px] w-full'>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentMenu(item.key)}
              className={`w-full flex items-center justify-center gap-[12px] hover:bg-[#f1f1f1] rounded-xl cursor-pointer text-normal-strong text-body4 px-[12px] py-[10px] text-caption1 font-medium transition-colors text-left ${
                currentMenu === item.key ? 'bg-[#f1f1f1]' : 'bg-transparent'
              }`}
            >
              <Image src={item.icon} alt={item.label} width={19} height={19} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <Button
          text='로그아웃'
          onClick={() => signOut({ callbackUrl: '/' })}
          type='button'
          leftIcon={
            <Image src='/sign-out.svg' alt='logout' width={12} height={12} />
          }
          className='w-full bg-transparent text-caption1 !text-normal !font-normal mt-auto'
          showShadow={false}
          customShadow='0 1px 1px 0 rgba(0, 0, 0, 0.15)'
          mt='auto'
        />
      </aside>

      {/* Main Content - 나머지 공간 전체 */}
      <main className='flex-1 overflow-auto'>{renderPage()}</main>
    </div>
  );
}
