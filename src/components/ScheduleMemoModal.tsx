'use client';

import React from 'react';
import Modal from './Modal';
import type { Schedule } from '@/src/types/schedule';

interface ScheduleMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
}

export default function ScheduleMemoModal({
  isOpen,
  onClose,
  schedule,
}: ScheduleMemoModalProps) {
  if (!schedule) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='메모'>
      <div className='space-y-[20px]'>
        {/* Main User Memo */}
        <div>
          <h3 className='text-body4 font-medium text-normal mb-[8px]'>
            {schedule.mainUser} 메모
          </h3>
          <div className='bg-light rounded-[8px] p-[12px] min-h-[80px]'>
            <p className='text-body4 text-default whitespace-pre-wrap'>
              {schedule.mainUserMemo || '메모가 없습니다.'}
            </p>
          </div>
        </div>

        {/* Sub User Memo */}
        {schedule.subUser && schedule.subUser !== '-' && (
          <div>
            <h3 className='text-body4 font-medium text-normal mb-[8px]'>
              {schedule.subUser} 메모
            </h3>
            <div className='bg-light rounded-[8px] p-[12px] min-h-[80px]'>
              <p className='text-body4 text-default whitespace-pre-wrap'>
                {schedule.subUserMemo || '메모가 없습니다.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className='mt-[30px] flex justify-end'>
        <button
          onClick={onClose}
          className='px-[20px] py-[10px] bg-blue cursor-pointer text-white text-body4 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
        >
          닫기
        </button>
      </div>
    </Modal>
  );
}
