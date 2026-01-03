'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatePicker({
  selectedDate,
  onSelectDate,
  currentDate,
  onDateChange,
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    onSelectDate(dateString);
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    );
  };

  const isWeekend = (day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 일요일 또는 토요일
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const days = [];
  // 빈 칸 추가 (첫 번째 날짜가 시작하는 요일까지)
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className='absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-full max-w-[320px]'>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-4'>
        <button
          type='button'
          onClick={handlePrevMonth}
          className='p-1 hover:bg-gray-100 rounded transition-colors'
        >
          <ChevronLeft size={20} className='text-gray-600' />
        </button>
        <div className='text-lg font-semibold text-gray-800'>
          {year}년 {monthNames[month]}
        </div>
        <button
          type='button'
          onClick={handleNextMonth}
          className='p-1 hover:bg-gray-100 rounded transition-colors'
        >
          <ChevronRight size={20} className='text-gray-600' />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className='grid grid-cols-7 gap-1 mb-2'>
        {dayNames.map((day, idx) => (
          <div
            key={idx}
            className={`text-center text-xs font-medium py-2 ${
              idx === 0
                ? 'text-red-500'
                : idx === 6
                ? 'text-blue-500'
                : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className='grid grid-cols-7 gap-1'>
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className='aspect-square' />;
          }

          const selected = isSelected(day);
          const weekend = isWeekend(day);
          const today = isToday(day);

          return (
            <button
              key={idx}
              type='button'
              onClick={() => handleDateClick(day)}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                selected
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : today
                  ? 'bg-blue-50 text-blue-600 font-semibold border-2 border-blue-600'
                  : weekend
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

