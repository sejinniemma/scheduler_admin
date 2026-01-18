'use client';

import React, { useState } from 'react';
import { formatDateForGroup } from '@/src/lib/utiles';
import { useSchedule } from '@/src/contexts/ScheduleContext';
import StatusBadge from '@/src/components/StatusBadge';
import ReportStatusModal from '@/src/components/ReportStatusModal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
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
  const { schedules, isLoading, error, refetch } = useSchedule();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    
    // 도착 탭일 때는 arrival과 delayed 둘 다 포함
    if (statusFilter === 'arrival') {
      return (
        schedule.mainUserReportStatus === 'arrival' ||
        schedule.subUserReportStatus === 'arrival' ||
        schedule.mainUserReportStatus === 'delayed' ||
        schedule.subUserReportStatus === 'delayed'
      );
    }
    
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

  const handleRowClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsStatusModalOpen(true);
  };

  const handleRefetch = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  

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
    // { key: 'canceled', label: '취소' },
  ];

  return (
    <div className='p-[40px]'>
      <div className='flex items-center justify-between mb-[40px]'>
        <h1 className='text-body4 text-normal font-semibold'>
          {getTodayDate()}
        </h1>
        <button
          onClick={handleRefetch}
          disabled={isRefreshing}
          className='px-[12px] py-[6px] cursor-pointer bg-light text-normal text-caption1 font-medium rounded-[5px] hover:bg-lighter transition-colors flex items-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed'
          title='새로고침'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M8 2.66667V1.33333M8 1.33333L6 3.33333M8 1.33333L10 3.33333M3.33333 8C3.33333 10.5773 5.42267 12.6667 8 12.6667C9.84 12.6667 11.42 11.5867 12.1867 10M12.6667 8C12.6667 5.42267 10.5773 3.33333 8 3.33333C6.16 3.33333 4.58 4.41333 3.81333 6M13.3333 8H14.6667M1.33333 8H2.66667'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          새로고침
        </button>
      </div>

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
          <p className='text-body2 text-default'>
            오늘 등록된 스케줄이 없습니다.
          </p>
        </div>
      ) : (
        isRefreshing ? (
          <div className='flex items-center justify-center h-[400px]'>
            <LoadingSpinner type='beat' size='lg' />
          </div>
        ) : (
          <div className='bg-white rounded-[10px] border border-line-base overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-light border-b border-line-base'>
                  <tr className='text-caption1 font-bold text-[#454545] text-center'>
                    <th className='p-[16px]'>번호</th>
                    <th className='p-[16px]'>웨딩홀</th>
                    <th className='p-[16px]'>예식시간</th>
                    <th className='p-[16px]'>작가도착예정시간</th>
                    <th className='p-[16px]'>메인</th>
                    <th className='p-[16px]'>서브</th>
                    <th className='p-[16px]'>상태</th>
                  </tr>
                </thead>
                <tbody className='text-center'>
                  {sortedSchedules.map((schedule, index) => (
                  <tr
                    key={schedule.id}
                    onClick={() => handleRowClick(schedule)}
                    className='border-b border-line-edge hover:bg-lighter transition-colors cursor-pointer'
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
                    {/* 예식시간 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {schedule.time}
                    </td>
                    {/* 작가도착예정시간 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {schedule.userArrivalTime || '-'}
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
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Report 상태 수정 모달 */}
      <ReportStatusModal
        open={isStatusModalOpen && !!selectedSchedule}
        schedule={selectedSchedule}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedSchedule(null);
        }}
        onSuccess={() => {
          setIsStatusModalOpen(false);
          setSelectedSchedule(null);
          refetch();
        }}
      />
    </div>
  );
}
