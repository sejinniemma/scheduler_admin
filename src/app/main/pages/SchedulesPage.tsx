'use client';

import React, { useEffect, useState } from 'react';
import type { Schedule } from '@/src/types/schedule';

type SubStatusFilter = 'all' | 'unassigned' | 'assigned' | 'completed';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubStatusFilter>('all');

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/schedules/list');
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
    return schedule.subStatus === statusFilter;
  });

  // 전체 스케줄을 날짜와 시간 순으로 정렬
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const getSubStatusLabel = (subStatus: string) => {
    switch (subStatus) {
      case 'assigned':
        return '할당됨';
      case 'completed':
        return '완료됨';
      case 'unassigned':
        return '미할당';
      default:
        return subStatus;
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

  const handleAssign = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/schedules/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId,
          subStatus: 'assigned',
        }),
      });

      if (!response.ok) {
        throw new Error('배정에 실패했습니다.');
      }

      // 성공 시 스케줄 목록 새로고침
      const data = await response.json();
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, subStatus: 'assigned' }
            : schedule
        )
      );
    } catch (err) {
      console.error('배정 오류:', err);
      alert(
        err instanceof Error ? err.message : '배정 중 오류가 발생했습니다.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className='p-[40px]'>
        <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
          일정관리
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
          일정관리
        </h1>
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-red'>{error}</p>
        </div>
      </div>
    );
  }

  const statusTabs: { key: SubStatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'unassigned', label: '미할당' },
    { key: 'assigned', label: '할당됨' },
    { key: 'completed', label: '완료됨' },
  ];

  return (
    <div className='p-[40px]'>
      <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
        일정관리
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
                  <th className='p-[16px]'>신랑/신부</th>
                  <th className='p-[16px]'>시간</th>
                  <th className='p-[16px]'>메인</th>
                  <th className='p-[16px]'>서브</th>
                  <th className='p-[16px]'>상태</th>
                  <th className='p-[16px]'>상세</th>
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
                      {schedule.location && (
                        <p className='text-caption2 text-secondary mt-[5px]'>
                          ({schedule.location})
                        </p>
                      )}
                    </td>
                    {/* 신랑/신부 */}
                    <td className='p-[16px] text-body4 text-normal'>
                      {schedule.groom} · {schedule.bride}
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
                        {getSubStatusLabel(schedule.subStatus)}
                      </span>
                    </td>
                    {/* 상세 - 배정 버튼 */}
                    <td className='p-[16px]'>
                      {schedule.subStatus === 'unassigned' ? (
                        <button
                          onClick={() => handleAssign(schedule.id)}
                          className='px-[12px] py-[6px] bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
                        >
                          배정
                        </button>
                      ) : (
                        <span className='text-body4 text-default'>-</span>
                      )}
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
