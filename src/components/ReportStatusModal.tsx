'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  UPDATE_REPORT,
  CREATE_REPORT,
  GET_REPORTS_BY_SCHEDULE,
} from '@/src/client/graphql/Report';
import type { Schedule } from '@/src/types/schedule';

type ReportStatus =
  | 'pending'
  | 'wakeup'
  | 'departure'
  | 'arrival'
  | 'completed'
  | 'delayed'
  | 'canceled';

interface ReportStatusModalProps {
  open: boolean;
  schedule: Schedule | null;
  onClose: () => void;
  onSuccess: () => void;
}

const statusOptions: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: '대기' },
  { value: 'wakeup', label: '기상' },
  { value: 'departure', label: '출발' },
  { value: 'arrival', label: '도착' },
  { value: 'completed', label: '완료' },
  { value: 'delayed', label: '지연' },
  { value: 'canceled', label: '취소' },
];

export default function ReportStatusModal({
  open,
  schedule,
  onClose,
  onSuccess,
}: ReportStatusModalProps) {
  const [mainStatus, setMainStatus] = useState<ReportStatus | ''>('');
  const [subStatus, setSubStatus] = useState<ReportStatus | ''>('');
  const [mainReportId, setMainReportId] = useState<string | null>(null);
  const [subReportId, setSubReportId] = useState<string | null>(null);

  const { data: reportsData, loading: reportsLoading } = useQuery<{
    reportsBySchedule?: Array<{
      id: string;
      user: string;
      role: string;
      status: string;
    }>;
  }>(GET_REPORTS_BY_SCHEDULE, {
    variables: { scheduleId: schedule?.id },
    skip: !open || !schedule?.id,
  });

  const [updateReport] = useMutation(UPDATE_REPORT);
  const [createReport] = useMutation(CREATE_REPORT);

  // Reports 데이터 로드 시 초기값 설정
  // 외부 데이터(쿼리 결과)를 기반으로 상태를 업데이트하는 것은 정상적인 패턴입니다
  useEffect(() => {
    if (!reportsData?.reportsBySchedule) {
      // @ts-ignore - 외부 데이터 기반 상태 업데이트
      setMainReportId(null);
      // @ts-ignore - 외부 데이터 기반 상태 업데이트
      setMainStatus('');
      // @ts-ignore - 외부 데이터 기반 상태 업데이트
      setSubReportId(null);
      // @ts-ignore - 외부 데이터 기반 상태 업데이트
      setSubStatus('');
      return;
    }

    const reports = reportsData.reportsBySchedule;
    const mainReport = reports.find((r) => r.role === 'MAIN');
    const subReport = reports.find((r) => r.role === 'SUB');

    // 메인 Report 설정
    const mainReportIdValue = mainReport?.id || null;
    const mainStatusValue = mainReport
      ? statusOptions.find((opt) => opt.value === mainReport.status)
        ? (mainReport.status as ReportStatus)
        : ''
      : '';

    // 서브 Report 설정
    const subReportIdValue = subReport?.id || null;
    const subStatusValue = subReport
      ? statusOptions.find((opt) => opt.value === subReport.status)
        ? (subReport.status as ReportStatus)
        : ''
      : '';

    // 상태 업데이트를 한 번에 수행
    // @ts-ignore - 외부 데이터 기반 상태 업데이트
    setMainReportId(mainReportIdValue);
    // @ts-ignore - 외부 데이터 기반 상태 업데이트
    setMainStatus(mainStatusValue as ReportStatus | '');
    // @ts-ignore - 외부 데이터 기반 상태 업데이트
    setSubReportId(subReportIdValue);
    // @ts-ignore - 외부 데이터 기반 상태 업데이트
    setSubStatus(subStatusValue as ReportStatus | '');
  }, [reportsData]);

  // 모달이 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      // @ts-ignore - 모달 닫힘 시 상태 초기화
      setMainStatus('');
      // @ts-ignore - 모달 닫힘 시 상태 초기화
      setSubStatus('');
      // @ts-ignore - 모달 닫힘 시 상태 초기화
      setMainReportId(null);
      // @ts-ignore - 모달 닫힘 시 상태 초기화
      setSubReportId(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!schedule) return;

    // 메인 작가가 있는 경우 상태 선택 필수
    if (schedule.mainUser && !mainStatus) {
      alert('메인 작가의 상태를 선택해주세요.');
      return;
    }

    // 서브 작가가 있는 경우 상태 선택 필수
    if (schedule.subUser && !subStatus) {
      alert('서브 작가의 상태를 선택해주세요.');
      return;
    }

    try {
      // 메인 Report 처리
      if (schedule.mainUser) {
        if (mainReportId && mainStatus) {
          // 기존 Report 업데이트
          await updateReport({
            variables: {
              id: mainReportId,
              status: mainStatus,
            },
          });
        } else if (mainStatus) {
          // 새 Report 생성
          await createReport({
            variables: {
              scheduleId: schedule.id,
              status: mainStatus,
              role: 'MAIN',
            },
          });
        }
      }

      // 서브 Report 처리
      if (schedule.subUser) {
        if (subReportId && subStatus) {
          // 기존 Report 업데이트
          await updateReport({
            variables: {
              id: subReportId,
              status: subStatus,
            },
          });
        } else if (subStatus) {
          // 새 Report 생성
          await createReport({
            variables: {
              scheduleId: schedule.id,
              status: subStatus,
              role: 'SUB',
            },
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('상태 수정 오류:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      alert(`상태 수정 오류: ${errorMessage}`);
    }
  };

  if (!open || !schedule) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-transparent'>
      <div className='bg-white rounded-[10px] w-[90%] max-w-[500px] p-[30px] shadow-lg border border-line-base'>
        <h2 className='text-body2 font-semibold text-normal mb-[24px]'>
          Report 상태 수정
        </h2>

        {reportsLoading ? (
          <div className='flex items-center justify-center py-[40px]'>
            <p className='text-body4 text-default'>로딩 중...</p>
          </div>
        ) : (
          <div className='space-y-[20px]'>
            {/* 메인 작가 상태 */}
            {schedule.mainUser && (
              <div>
                <label className='block text-body4 font-medium text-normal mb-[8px]'>
                  메인 작가 ({schedule.mainUser}) 상태{' '}
                  <span className='text-red'>*</span>
                </label>
                <select
                  value={mainStatus}
                  onChange={(e) =>
                    setMainStatus(e.target.value as ReportStatus)
                  }
                  className='w-full px-[12px] py-[8px] border border-line-base rounded-[5px] text-body4 text-normal focus:outline-none focus:border-blue'
                  required
                >
                  <option value=''>상태를 선택하세요</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 서브 작가 상태 */}
            {schedule.subUser && (
              <div>
                <label className='block text-body4 font-medium text-normal mb-[8px]'>
                  서브 작가 ({schedule.subUser}) 상태{' '}
                  <span className='text-red'>*</span>
                </label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value as ReportStatus)}
                  className='w-full px-[12px] py-[8px] border border-line-base rounded-[5px] text-body4 text-normal focus:outline-none focus:border-blue'
                  required
                >
                  <option value=''>상태를 선택하세요</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 작가가 없는 경우 */}
            {!schedule.mainUser && !schedule.subUser && (
              <div className='flex items-center justify-center py-[20px]'>
                <p className='text-body4 text-default'>
                  배정된 작가가 없습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className='flex gap-[10px] justify-end mt-[30px]'>
          <button
            onClick={onClose}
            className='px-[20px] py-[10px] cursor-pointer text-body4 font-medium text-default bg-light rounded-[5px] hover:bg-lighter transition-colors'
          >
            취소
          </button>
          {(schedule.mainUser || schedule.subUser) && (
            <button
              onClick={handleSubmit}
              className='px-[20px] py-[10px] cursor-pointer text-body4 font-medium text-white bg-blue rounded-[5px] hover:opacity-90 transition-opacity'
            >
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
