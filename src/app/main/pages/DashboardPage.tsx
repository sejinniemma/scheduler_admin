'use client';

import React, { useState } from 'react';
import { formatDateForGroup } from '@/src/lib/utiles';
import { useSchedule } from '@/src/contexts/ScheduleContext';
import StatusBadge from '@/src/components/StatusBadge';
import ScheduleMemoModal from '@/src/components/ScheduleMemoModal';
import type { Schedule } from '@/src/types/schedule';

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
  const { schedules, isLoading, error } = useSchedule();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 오늘 날짜 포맷팅
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return formatDateForGroup(dateString);
  };

  // 상태별 필터링 (Report status 기준)
  const filteredSchedules = schedules.filter((schedule) => {
    if (statusFilter === 'all') return true;
    // MAIN Report status 또는 SUB Report status가 필터와 일치하는지 확인
    return (
      schedule.mainUserReportStatus === statusFilter ||
      schedule.subUserReportStatus === statusFilter
    );
  });

  // 전체 스케줄을 날짜와 시간 순으로 정렬
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

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
                  <th className='p-[16px]'>상태</th>{' '}
                  <th className='p-[16px]'>메모</th>
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
                      {schedule.mainUserReportStatus ? (
                        <div className='flex flex-col gap-[4px] items-center'>
                          {/* MAIN Report가 있으면 위에 표시 */}
                          <StatusBadge status={schedule.mainUserReportStatus} />
                          {/* SUB Report가 있으면 아래에 표시 */}
                          {schedule.subUserReportStatus && (
                            <StatusBadge
                              status={schedule.subUserReportStatus}
                            />
                          )}
                        </div>
                      ) : (
                        <span className='text-body4 text-default'>-</span>
                      )}
                    </td>
                    {/* memo */}
                    <td className='p-[16px]'>
                      {schedule.mainUserMemo || schedule.subUserMemo ? (
                        <button
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsModalOpen(true);
                          }}
                          className='flex flex-col items-center gap-[4px] text-body4 cursor-pointer text-blue hover:opacity-80 transition-opacity mx-auto'
                        >
                          <svg
                            width='12'
                            height='12'
                            viewBox='0 0 12 12'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M3 4.5L6 7.5L9 4.5'
                              stroke='currentColor'
                              strokeWidth='1.5'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
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

      {/* 메모 모달 */}
      <ScheduleMemoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schedule={selectedSchedule}
      />
    </div>
  );
}
