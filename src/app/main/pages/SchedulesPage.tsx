'use client';

import React, { useState, useMemo } from 'react';
import { useSchedule } from '@/src/contexts/ScheduleContext';
import CreateScheduleModal from '@/src/components/CreateScheduleModal';
import type { Schedule } from '@/src/types/schedule';

type StatusFilter = 'all' | 'unassigned' | 'assigned' | 'confirmed';

export default function SchedulesPage() {
  const { schedules, isLoading, error, refetch } = useSchedule();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );

  // 현재 선택된 년/월 상태
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // 월 표시 포맷 (예: "2024년 1월")
  const monthDisplay = useMemo(() => {
    return `${currentDate.year}년 ${currentDate.month}월`;
  }, [currentDate]);

  // 이전 달로 이동
  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // 선택된 월의 시작일과 종료일 계산
  const { startDate, endDate } = useMemo(() => {
    const start = `${currentDate.year}-${String(currentDate.month).padStart(
      2,
      '0'
    )}-01`;
    const lastDay = new Date(currentDate.year, currentDate.month, 0).getDate();
    const end = `${currentDate.year}-${String(currentDate.month).padStart(
      2,
      '0'
    )}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: start, endDate: end };
  }, [currentDate]);

  // 월별 및 상태별 필터링
  const filteredSchedules = schedules.filter((schedule) => {
    // 월별 필터링 (date 기준)
    const scheduleDate = schedule.date;
    if (scheduleDate < startDate || scheduleDate > endDate) {
      return false;
    }

    // 상태별 필터링
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
      case 'assigned':
        return '배정완료';
      case 'confirmed':
        return '확정완료';
      case 'unassigned':
        return '미배정';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green';
      case 'assigned':
        return 'text-blue';
      case 'unassigned':
        return 'text-secondary';
      default:
        return 'text-default';
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsEditModalOpen(true);
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

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'unassigned', label: '미배정' },
    { key: 'assigned', label: '배정완료' },
    { key: 'confirmed', label: '확정완료' },
  ];

  return (
    <div className='p-[40px]'>
      <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
        일정관리
      </h1>
      {/* 새일정 추가 */}
      <div className='flex justify-end mb-[20px]'>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className='px-[12px] py-[6px] cursor-pointer bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
        >
          + 새 일정
        </button>
      </div>

      {/* 월별 네비게이션 */}
      <div className='flex items-center justify-start gap-[20px] mb-[20px]'>
        <button
          onClick={handlePrevMonth}
          className='p-[8px] cursor-pointer hover:bg-light rounded-[4px] transition-colors'
          aria-label='이전 달'
        >
          <svg
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M12.5 15L7.5 10L12.5 5'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </button>
        <h2 className='text-body3 text-normal font-semibold min-w-[120px] text-center'>
          {monthDisplay}
        </h2>
        <button
          onClick={handleNextMonth}
          className='p-[8px] cursor-pointer hover:bg-light rounded-[4px] transition-colors'
          aria-label='다음 달'
        >
          <svg
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M7.5 15L12.5 10L7.5 5'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
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
          <p className='text-body2 text-default'>등록된 스케줄이 없습니다.</p>
        </div>
      ) : (
        <div className='bg-white rounded-[10px] border border-line-base overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-light border-b border-line-base'>
                <tr className='text-caption1 font-bold text-[#454545] text-center'>
                  <th className='p-[16px]'>번호</th>
                  <th className='p-[16px]'>날짜</th>
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
                    className='border-b border-line-edge cursor-pointer hover:bg-lighter transition-colors'
                  >
                    {/* 번호 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {index + 1}
                    </td>
                    {/* 날짜 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {schedule.date}
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
                      {schedule.mainUser || '-'}
                    </td>
                    {/* subUser */}
                    <td className='p-[16px] text-body4 text-default'>
                      {schedule.subUser || '-'}
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
                    {/* 상세 - 수정 버튼 */}
                    <td className='p-[16px]'>
                      <button
                        onClick={() => handleEdit(schedule)}
                        className='px-[12px] py-[6px] cursor-pointer bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 새 일정 추가 모달 */}
      <CreateScheduleModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      {/* 일정 수정 모달 */}
      <CreateScheduleModal
        open={isEditModalOpen && !!selectedSchedule}
        // @ts-expect-error - CreateScheduleModal은 JS 파일이므로 타입 추론이 제한적
        schedule={selectedSchedule}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSchedule(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedSchedule(null);
          refetch();
        }}
      />
    </div>
  );
}
