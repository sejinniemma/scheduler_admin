'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSchedule } from '@/src/contexts/ScheduleContext';
import CreateScheduleModal from '@/src/components/CreateScheduleModal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import DatePicker from '@/src/components/DatePicker';
import type { Schedule } from '@/src/types/schedule';
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon, Calendar } from 'lucide-react';

type StatusFilter = 'all' | 'unassigned' | 'assigned' | 'confirmed';

export default function SchedulesPage() {
  const { schedules, isLoading, error, refetch } = useSchedule();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 현재 선택된 년/월 상태
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  // 선택된 날짜 (일별 필터링용)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // 월 표시 포맷 (예: "2024년 1월")
  const monthDisplay = useMemo(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
    return `${currentDate.year}년 ${currentDate.month}월`;
  }, [currentDate, selectedDate]);

  // 이전 달로 이동
  const handlePrevMonth = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - 1);
      setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
      setCalendarDate(date);
    } else {
      setCurrentDate((prev) => {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 };
        }
        return { year: prev.year, month: prev.month - 1 };
      });
    }
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + 1);
      setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
      setCalendarDate(date);
    } else {
      setCurrentDate((prev) => {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 };
        }
        return { year: prev.year, month: prev.month + 1 };
      });
    }
  };
  
  // 날짜 선택 핸들러
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    // 선택된 날짜의 년/월로 currentDate 업데이트
    const dateObj = new Date(date);
    setCurrentDate({ year: dateObj.getFullYear(), month: dateObj.getMonth() + 1 });
    setCalendarDate(dateObj);
  };
  
  // 날짜 필터 초기화
  const handleClearDateFilter = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
  };
  
  // 외부 클릭 시 DatePicker 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node) &&
        showDatePicker
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

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

  // 날짜별 및 상태별 필터링
  const filteredSchedules = schedules.filter((schedule) => {
    // 날짜 필터링
    if (selectedDate) {
      // 선택된 날짜와 정확히 일치하는 경우만
      if (schedule.date !== selectedDate) {
        return false;
      }
    } else {
      // 월별 필터링 (date 기준)
      const scheduleDate = schedule.date;
      if (scheduleDate < startDate || scheduleDate > endDate) {
        return false;
      }
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

  // 날짜의 요일 색상 반환
  const getDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0: 일요일, 6: 토요일
    if (dayOfWeek === 0) {
      return 'text-red'; // 일요일: 빨간색
    } else if (dayOfWeek === 6) {
      return 'text-blue'; // 토요일: 파란색
    }
    return 'text-normal'; // 평일: 기본 색상
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleRefetch = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateSuccess = async () => {
    setIsCreateModalOpen(false);
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedSchedule(null);
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

      {/* 새일정 추가 및 새로고침 */}
      <div className='flex justify-end gap-[10px] mb-[20px]'>
        <button
          onClick={handleRefetch}
          disabled={isRefreshing}
          className='px-[12px] py-[6px] cursor-pointer bg-light text-normal text-caption1 font-medium rounded-[5px] hover:bg-lighter transition-colors flex items-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed'
          title='새로고침'
        >
        <RefreshCwIcon size={16} className='text-normal' />
          새로고침
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className='px-[12px] py-[6px] cursor-pointer bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
        >
          + 새 일정
        </button>
      </div>

      {/* 날짜 네비게이션 */}
      <div className='flex items-center justify-start gap-[20px] mb-[20px]'>
        <ChevronLeftIcon 
          size={16} 
          className='text-normal cursor-pointer hover:text-blue transition-colors' 
          onClick={handlePrevMonth}
        />
        <div className='relative' ref={datePickerRef}>
          <button
            type='button'
            onClick={() => setShowDatePicker(!showDatePicker)}
            className='flex items-center gap-[8px] px-[12px] py-[6px] rounded-[5px] cursor-pointer hover:bg-light transition-colors'
          >
            <Calendar size={16} className='text-normal' />
            <h2 className='text-body3 text-normal font-semibold min-w-[140px] text-center'>
              {monthDisplay}
            </h2>
            {selectedDate && (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearDateFilter();
                }}
                className='text-caption2  text-secondary hover:text-red transition-colors'
              >
                ✕
              </button>
            )}
          </button>
          {showDatePicker && (
            <DatePicker
              selectedDate={selectedDate || ''}
              onSelectDate={handleDateSelect}
              currentDate={calendarDate}
              onDateChange={setCalendarDate}
            />
          )}
        </div>
        <ChevronRightIcon 
          size={16} 
          className='text-normal cursor-pointer hover:text-blue transition-colors' 
          onClick={handleNextMonth}
        />
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
     isRefreshing ?  <div className='flex items-center justify-center h-[400px]'><LoadingSpinner type='beat' size='lg' /></div>: (<div className='bg-white rounded-[10px] border border-line-base overflow-hidden'>
     <div className='overflow-x-auto'>
       <table className='w-full'>
         <thead className='bg-light border-b border-line-base'>
           <tr className='text-caption1 font-bold text-[#454545] text-center'>
             <th className='p-[16px]'>번호</th>
             <th className='p-[16px]'>날짜</th>
             <th className='p-[16px]'>웨딩홀</th>
             <th className='p-[16px]'>신랑/신부</th>
             <th className='p-[16px]'>예식시간</th>
             <th className='p-[16px]'>작가도착시간</th>
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
               <td className={`p-[16px] text-body4 font-medium ${getDateColor(schedule.date)}`}>
                 {schedule.date}
               </td>
               {/* 웨딩홀 */}
               <td className='p-[16px] text-body4 text-normal'>
                 {schedule.venue || '-'}
                 {schedule.location && (
                   <p className='text-caption2 text-normal mt-[5px]'>
                     ({schedule.location})
                   </p>
                 )}
               </td>
               {/* 신랑/신부 */}
               <td className='p-[16px] text-body4 text-normal'>
                 {schedule.groom} · {schedule.bride}
               </td>
               {/* 예식시간 */}
               <td className='p-[16px] text-body4 text-normal font-medium'>
                 {schedule.time}
               </td>
               {/* 작가도착시간 */}
               <td className='p-[16px] text-body4 text-normal font-medium'>
                 {schedule.userArrivalTime || '-'}
               </td>
               {/* mainUser */}
               <td className='p-[16px] text-body4 text-normal'>
                 {schedule.mainUser || '-'}
                 {schedule.mainUserConfirmed && (
                   <span className='text-caption2 text-red ml-[4px]'>
                     (확정)
                   </span>
                 )}
               </td>
               {/* subUser */}
               <td className='p-[16px] text-body4 text-default'>
                 {schedule.subUser || '-'}
                 {schedule.subUserConfirmed && (
                   <span className='text-caption2 text-red ml-[4px]'>
                     (확정)
                   </span>
                 )}
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
   </div>))}
      {/* 새 일정 추가 모달 */}
      <CreateScheduleModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
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
        onSuccess={handleEditSuccess}
      />  
    </div>
  );
}
