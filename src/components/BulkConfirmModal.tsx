'use client';

import React, { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_SCHEDULE } from '@/src/client/graphql/Schedule';
import LoadingSpinner from './LoadingSpinner';
import type { Schedule } from '@/src/types/schedule';
import { X } from 'lucide-react';

interface BulkConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedules: Schedule[];
}

// 날짜 포맷팅 함수 (YY.MM.DD 형식)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = String(date.getFullYear()).slice(-2); // 마지막 2자리
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

export default function BulkConfirmModal({
  open,
  onClose,
  onSuccess,
  schedules,
}: BulkConfirmModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updateSchedule, { loading: updating }] = useMutation(UPDATE_SCHEDULE);

  // 배정완료된 스케줄만 필터링
  const assignedSchedules = useMemo(() => {
    return schedules.filter((schedule) => schedule.status === 'assigned');
  }, [schedules]);

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedIds.size === assignedSchedules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assignedSchedules.map((s) => s.id)));
    }
  };

  // 개별 선택/해제
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 일괄 확정 처리
  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      alert('확정할 스케줄을 선택해주세요.');
      return;
    }

    try {
      // 선택된 모든 스케줄의 status를 confirmed로 변경
      const updatePromises = Array.from(selectedIds).map((id) => {
        const schedule = assignedSchedules.find((s) => s.id === id);
        if (!schedule) return Promise.resolve();

        return updateSchedule({
          variables: {
            id: schedule.id,
            status: 'confirmed',
            mainUser: schedule.mainUser || null,
            subUser: schedule.subUser || null,
            groom: schedule.groom,
            bride: schedule.bride,
            date: schedule.date,
            time: schedule.time,
            userArrivalTime: schedule.userArrivalTime || null,
            venue: schedule.venue || null,
            location: schedule.location || null,
            memo: schedule.memo || null,
          },
        });
      });

      await Promise.all(updatePromises);
      onSuccess();
      onClose();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('일괄 확정 실패:', error);
      alert('일괄 확정 중 오류가 발생했습니다.');
    }
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50'>
      <div className='bg-gray-100 rounded-[10px] w-full max-w-[800px] max-h-[80vh] flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-[20px] border-b border-line-base'>
          <h2 className='text-body3 text-normal font-semibold'>일괄 확정</h2>
          <button
            onClick={onClose}
            className='p-[4px] hover:bg-light rounded-[4px] transition-colors'
            disabled={updating}
          >
            <X size={20} className='text-default cursor-pointer' />
          </button>
        </div>

        {/* 내용 */}
        <div className='flex-1 overflow-auto p-[20px]'>
          {assignedSchedules.length === 0 ? (
            <div className='flex items-center justify-center h-[200px]'>
              <p className='text-body4 text-default'>
                배정완료된 스케줄이 없습니다.
              </p>
            </div>
          ) : (
            <>
              {/* 전체 선택 */}
              <div className='mb-[16px] pb-[12px] border-b border-line-base'>
                <label className='flex items-center gap-[8px] cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={
                      assignedSchedules.length > 0 &&
                      selectedIds.size === assignedSchedules.length
                    }
                    onChange={handleSelectAll}
                    className='w-[16px] h-[16px] cursor-pointer'
                  />
                  <span className='text-body4 font-medium text-normal'>
                    전체 선택 ({selectedIds.size}/{assignedSchedules.length})
                  </span>
                </label>
              </div>

              {/* 스케줄 리스트 */}
              <div className='space-y-[8px]'>
                {assignedSchedules.map((schedule) => (
                  <label
                    key={schedule.id}
                    className='flex items-center bg-white gap-[12px] p-[12px] border border-line-base rounded-[5px] hover:bg-light cursor-pointer transition-colors'
                  >
                    <input
                      type='checkbox'
                      checked={selectedIds.has(schedule.id)}
                      onChange={() => handleToggleSelect(schedule.id)}
                      className='w-[16px] h-[16px] cursor-pointer'
                    />
                    <div className='flex-1 grid grid-cols-5 gap-[12px] text-body4'>
                      <div className='text-normal font-medium'>
                        {formatDate(schedule.date)}
                      </div>
                      <div className='text-normal'>{schedule.time}</div>
                      <div className='text-normal'>
                        {schedule.venue || '-'}
                      </div>
                      <div className='text-normal'>
                        {schedule.groom} · {schedule.bride}
                      </div>
                      <div className='text-normal'>
                        {schedule.mainUser || '-'} / {schedule.subUser || '-'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className='flex justify-end gap-[10px] p-[20px] border-t border-line-base'>
          <button
            onClick={onClose}
            disabled={updating}
            className='px-[20px] py-[10px] cursor-pointer bg-light text-normal text-body4 font-medium rounded-[5px] hover:bg-lighter transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={updating || selectedIds.size === 0}
            className='px-[20px] py-[10px] cursor-pointer bg-blue text-white text-body4 font-medium rounded-[5px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[8px]'
          >
            {updating ? (
              <>
                <LoadingSpinner type='beat' size='sm' color='#ffffff' />
                <span>확정 중...</span>
              </>
            ) : (
              `확정 (${selectedIds.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

