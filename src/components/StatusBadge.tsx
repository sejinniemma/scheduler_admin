'use client';

import React from 'react';

type ScheduleStatus =
  | 'pending'
  | 'wakeup'
  | 'departure'
  | 'arrival'
  | 'completed'
  | 'delayed'
  | 'canceled';

interface StatusBadgeProps {
  status: ScheduleStatus | string;
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '대기';
    case 'wakeup':
      return '기상완료';
    case 'departure':
      return '출발완료';
    case 'arrival':
      return '도착완료';
    case 'completed':
      return '종료';
    case 'delayed':
      return '지연 도착';
    case 'canceled':
      return '취소';
    default:
      return '대기';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'arrival':
      return '#10B981'; // 도착완료 - emerald-500 (밝은 녹색)
    case 'pending':
      return '#6B7280'; // 대기 - gray-500 (중립 회색)
    case 'wakeup':
      return '#A78BFA'; // 기상완료 - violet-400 (부드러운 보라색)
    case 'departure':
      return '#3B82F6'; // 출발완료 - blue-500 (신뢰감 있는 파란색)
    case 'delayed':
      return '#F59E0B'; // 지연 도착 - amber-500 (주의 주황색)
    case 'completed':
      return '#059669'; // 종료 - emerald-600 (진한 녹색)
    case 'canceled':
      return '#EF4444'; // 취소 - red-500 (명확한 빨간색)
    default:
      return '#6B7280'; // 기본값 - gray-500 (중립 회색)
  }
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className='inline-block text-caption2 font-medium text-white py-[3px] px-[8px] rounded-[4px] whitespace-nowrap'
      style={{
        backgroundColor: getStatusColor(status),
        minWidth: '60px',
        minHeight: '20px',
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
}
