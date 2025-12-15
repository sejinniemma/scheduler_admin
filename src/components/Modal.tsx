'use client';

import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-transparent flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-[10px] overflow-hidden w-full mx-[20px]'
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 - 파란색 */}
        <div className='bg-blue p-[30px] pb-[20px]'>
          <div className='flex justify-between items-center'>
            <h2 className='text-body3 font-semibold text-white'>{title}</h2>
            <button
              onClick={onClose}
              className='text-body4 cursor-pointer text-white hover:opacity-80 transition-opacity'
            >
              ✕
            </button>
          </div>
        </div>

        {/* 본문 - 흰색 */}
        <div className='p-[30px] pt-[20px]'>{children}</div>
      </div>
    </div>
  );
}
