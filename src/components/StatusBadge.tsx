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
      return '지연';
    case 'canceled':
      return '취소';
    default:
      return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'arrival':
      return '#00A63E'; // 도착완료
    case 'pending':
      return '#808080'; // 대기 (회색)
    case 'wakeup':
      return '#FFC0CB'; // 기상완료
    case 'departure':
      return '#4582ED'; // 출발완료
    case 'delayed':
      return '#FF9000'; // 지연
    case 'completed':
      return '#800080'; // 완료
    case 'canceled':
      return '#FF0000'; // 취소
    default:
      return '#808080'; // 기본값 (회색)
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

