'use client';

import React, { useEffect, useState } from 'react';
import type { Schedule } from '@/src/types/schedule';
import { formatDateForGroup } from '@/src/lib/utiles';

type StatusFilter =
  | 'all'
  | 'pending'
  | 'wakeup'
  | 'departure'
  | 'arrival'
  | 'completed'
  | 'delayed'
  | 'canceled';

export default function DashboardPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 오늘 날짜 포맷팅
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return formatDateForGroup(dateString);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/schedules/all');
        if (!response.ok) {
          throw new Error('스케줄을 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setSchedules(data.schedules || []);
      } catch (err) {
        console.error('스케줄 가져오기 오류:', err);
        setError(
          err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // 상태별 필터링
  const filteredSchedules = schedules.filter((schedule) => {
    if (statusFilter === 'all') return true;
    return schedule.status === statusFilter;
  });

  // 전체 스케줄을 날짜와 시간 순으로 정렬
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기';
      case 'wakeup':
        return '기상';
      case 'departure':
        return '출발';
      case 'arrival':
        return '도착';
      case 'completed':
        return '완료';
      case 'delayed':
        return '지연';
      case 'canceled':
        return '취소';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green';
      case 'pending':
        return 'text-yellow';
      case 'canceled':
        return 'text-red';
      default:
        return 'text-default';
    }
  };

  if (isLoading) {
    return (
      <div className='p-[40px]'>
        <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
          {getTodayDate()}
        </h1>
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-default'>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-[40px]'>
        <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
          {getTodayDate()}
        </h1>
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-red'>{error}</p>
        </div>
      </div>
    );
  }

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '대기' },
    { key: 'wakeup', label: '기상' },
    { key: 'departure', label: '출발' },
    { key: 'arrival', label: '도착' },
    { key: 'completed', label: '완료' },
    { key: 'delayed', label: '지연' },
    { key: 'canceled', label: '취소' },
  ];

  return (
    <div className='p-[40px]'>
      <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
        {getTodayDate()}
      </h1>

      {/* 상태 탭 */}
      <div className='flex gap-[10px] mb-[20px] border-b border-line-base'>
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-[20px] py-[12px] cursor-pointer text-body4 font-medium transition-colors border-b-2 ${
              statusFilter === tab.key
                ? 'border-blue text-blue font-semibold'
                : 'border-transparent text-default hover:text-normal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sortedSchedules.length === 0 ? (
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-default'>등록된 스케줄이 없습니다.</p>
        </div>
      ) : (
        <div className='bg-white rounded-[10px] border border-line-base overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-light border-b border-line-base'>
                <tr className='text-caption1 font-bold text-[#454545] text-center'>
                  <th className='p-[16px]'>번호</th>
                  <th className='p-[16px]'>웨딩홀</th>
                  <th className='p-[16px]'>시간</th>
                  <th className='p-[16px]'>메인</th>
                  <th className='p-[16px]'>서브</th>
                  <th className='p-[16px]'>상태</th>
                </tr>
              </thead>
              <tbody className='text-center'>
                {sortedSchedules.map((schedule, index) => (
                  <tr
                    key={schedule.id}
                    className='border-b border-line-edge hover:bg-lighter transition-colors'
                  >
                    {/* 번호 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {index + 1}
                    </td>
                    {/* 웨딩홀 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {schedule.venue || '-'}
                      <p>{`(${schedule.location})`}</p>
                    </td>
                    {/* 시간 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {schedule.time}
                    </td>
                    {/* mainUser */}
                    <td className='p-[16px] text-body4 text-default'>
                      {schedule.mainUser}
                    </td>
                    {/* subUser */}
                    <td className='p-[16px] text-body4 text-default'>
                      {schedule.subUser}
                    </td>
                    {/* status */}
                    <td className='p-[16px]'>
                      <span
                        className={`text-caption1 font-medium ${getStatusColor(
                          schedule.status
                        )}`}
                      >
                        {getStatusLabel(schedule.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
