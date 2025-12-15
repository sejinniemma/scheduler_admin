'use client';

import React, { useState } from 'react';
import { useSchedule } from '@/src/contexts/ScheduleContext';
import CreateScheduleModal from '@/src/components/CreateScheduleModal';
import type { Schedule } from '@/src/types/schedule';

type SubStatusFilter = 'all' | 'unassigned' | 'assigned' | 'completed';

export default function SchedulesPage() {
  const { schedules, isLoading, error, refetch } = useSchedule();
  const [statusFilter, setStatusFilter] = useState<SubStatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );

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
      {/* 새일정 추가 */}
      <div className='flex justify-end'>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className='px-[12px] py-[6px] cursor-pointer bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
        >
          + 새 일정
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
                    {/* 상세 - 수정 버튼 */}
                    <td className='p-[16px]'>
                      <button
                        onClick={() => handleEdit(schedule)}
                        className='px-[12px] py-[6px] bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
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
