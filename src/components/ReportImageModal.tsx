'use client';

import React, { useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_REPORTS_BY_SCHEDULE } from '@/src/client/graphql/Report';
import type { Schedule } from '@/src/types/schedule';
import { X } from 'lucide-react';

interface ReportImageModalProps {
  open: boolean;
  schedule: Schedule | null;
  onClose: () => void;
}

interface Report {
  id: string;
  user: string;
  role: string;
  status: string;
  imageUrl: string | null;
}

export default function ReportImageModal({
  open,
  schedule,
  onClose,
}: ReportImageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: reportsData, loading } = useQuery<{
    reportsBySchedule?: Report[];
  }>(GET_REPORTS_BY_SCHEDULE, {
    variables: { scheduleId: schedule?.id },
    skip: !open || !schedule?.id,
  });

  const reports = reportsData?.reportsBySchedule || [];

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open || !schedule) return null;

  const mainReport = reports.find((r) => r.role === 'MAIN');
  const subReport = reports.find((r) => r.role === 'SUB');

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-transparent'>
      <div
        ref={modalRef}
        className='bg-white border-line-base     border rounded-[10px] p-[24px] w-[500px] max-w-[500px] max-h-[90vh] overflow-y-auto relative'
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className='absolute top-[16px] right-[16px] p-[8px] hover:bg-light rounded-[4px] transition-colors'
          aria-label='닫기'
        >
          <X size={20} className='text-default cursor-pointer' />
        </button>

        {/* 헤더 */}
        <div className='mb-[24px] pr-[40px]'>
          <h2 className='text-body3 text-normal font-semibold mb-[8px]'>
            {schedule.venue || '웨딩홀'}
          </h2>
          <p className='text-body4 text-secondary'>
            {schedule.date} {schedule.time} · {schedule.groom} · {schedule.bride}
          </p>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-[40px]'>
            <p className='text-body2 text-default'>로딩 중...</p>
          </div>
        ) : (
          <div className='space-y-[24px]'>
            {/* 메인 작가 이미지 */}
            {mainReport && (
              <div>
                <h3 className='text-body4 text-normal font-semibold mb-[12px]'>
                  메인 작가 ({schedule.mainUser || '-'})
                </h3>
                {mainReport.imageUrl ? (
                  <div className='border border-line-base rounded-[8px] overflow-hidden'>
                    <img
                      src={mainReport.imageUrl}
                      alt='메인 작가 리포트 이미지'
                      className='w-full h-auto object-contain max-h-[500px]'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<div class="p-[40px] text-center text-body2 text-secondary">이미지를 불러올 수 없습니다.</div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className='border border-line-base rounded-[8px] p-[40px] text-center text-body2 text-secondary'>
                    이미지가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 서브 작가 이미지 */}
            {subReport && (
              <div>
                <h3 className='text-body4 text-normal font-semibold mb-[12px]'>
                  서브 작가 ({schedule.subUser || '-'})
                </h3>
                {subReport.imageUrl ? (
                  <div className='border border-line-base rounded-[8px] overflow-hidden'>
                    <img
                      src={subReport.imageUrl}
                      alt='서브 작가 리포트 이미지'
                      className='w-full h-auto object-contain max-h-[500px]'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<div class="p-[40px] text-center text-body2 text-secondary">이미지를 불러올 수 없습니다.</div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className='border border-line-base rounded-[8px] p-[40px] text-center text-body2 text-secondary'>
                    이미지가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 리포트가 없는 경우 */}
            {reports.length === 0 && (
              <div className='py-[40px] text-center text-body2 text-secondary'>
                리포트가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

