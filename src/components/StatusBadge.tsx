'use client';

import React from 'react';

type ReportStatus =
  | 'pending'
  | 'wakeup'
  | 'wakeup_delayed'
  | 'departure'
  | 'departure_delayed'
  | 'arrival'
  | 'arrival_delayed'
  | 'completed'
  | 'canceled'; // 기존 데이터 표시용

interface StatusBadgeProps {
  status: ReportStatus | string;
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '대기';
    case 'wakeup':
      return '기상';
    case 'wakeup_delayed':
      return '기상 지연';
    case 'departure':
      return '출발';
    case 'departure_delayed':
      return '출발 지연';
    case 'arrival':
      return '도착';
    case 'arrival_delayed':
      return '도착 지연';
    case 'completed':
      return '종료';
    case 'canceled':
      return '취소';
    default:
      return status || '대기';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'arrival':
      return '#10B981'; // 도착 - emerald-500
    case 'pending':
      return '#6B7280'; // 대기 - gray-500
    case 'wakeup':
      return '#A78BFA'; // 기상 - violet-400
    case 'wakeup_delayed':
      return '#F59E0B'; // 기상 지연 - amber-500
    case 'departure':
      return '#3B82F6'; // 출발 - blue-500
    case 'departure_delayed':
      return '#F59E0B'; // 출발 지연 - amber-500
    case 'arrival_delayed':
      return '#F59E0B'; // 도착 지연 - amber-500
    case 'completed':
      return '#059669'; // 종료 - emerald-600
    case 'canceled':
      return '#EF4444'; // 취소 - red-500
    default:
      return '#6B7280'; // 기본값 - gray-500
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
