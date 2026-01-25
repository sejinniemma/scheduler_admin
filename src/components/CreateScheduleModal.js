'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  StickyNote,
} from 'lucide-react';
import DatePicker from './DatePicker';
import LoadingSpinner from './LoadingSpinner';
import { GET_USERS } from '@/src/client/graphql/User';
import {
  CREATE_SCHEDULE,
  UPDATE_SCHEDULE,
  DELETE_SCHEDULE,
} from '@/src/client/graphql/Schedule';
import {
  CREATE_REPORT,
  DELETE_REPORT,
  GET_REPORTS_BY_SCHEDULE,
} from '@/src/client/graphql/Report';
import { subtractOneHour } from '../lib/utiles';

export default function CreateScheduleModal({
  open = false,
  onClose = () => {},
  onSuccess = () => {},
  schedule = null, // 수정 모드일 때 전달되는 스케줄 데이터
}) {
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);
  const [createSchedule, { loading: creating }] = useMutation(CREATE_SCHEDULE);
  const [updateSchedule, { loading: updating }] = useMutation(UPDATE_SCHEDULE);
  const [deleteSchedule, { loading: deleting }] = useMutation(DELETE_SCHEDULE);
  const [createReport, { loading: confirming }] = useMutation(CREATE_REPORT);
  const [deleteReport] = useMutation(DELETE_REPORT);
  const { refetch: refetchReports } = useQuery(GET_REPORTS_BY_SCHEDULE, {
    variables: { scheduleId: schedule?.id },
    skip: !schedule?.id || !open,
  });

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    userArrivalTime: '',
    venue: '',
    location: '',
    mainUser: '',
    subUser: '',
    groom: '',
    bride: '',
    memo: '',
    request: '',
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRef = useRef(null);
  const timeInputRef = useRef(null);
  const arrivalTimeInputRef = useRef(null);

  const isEditMode = !!schedule;

  // 외부 클릭 시 달력 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target) &&
        showCalendar
      ) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // 수정 모드일 때 스케줄 데이터로 폼 초기화
  useEffect(() => {
    if (!open) {
      setShowCalendar(false);
      return;
    }

    if (schedule && typeof schedule === 'object') {
      // mainUser와 subUser는 이름일 수 있으므로 ID로 변환
      const mainUserName = schedule.mainUser || '';
      const subUserName = schedule.subUser || '';

      const mainUserId =
        (mainUserName &&
          usersData?.users?.find((user) => user?.name === mainUserName)?.id) ||
        mainUserName ||
        '';
      const subUserId =
        (subUserName &&
          usersData?.users?.find((user) => user?.name === subUserName)?.id) ||
        subUserName ||
        '';

      setFormData({
        date: schedule.date || '',
        time: schedule.time || '',
        userArrivalTime: schedule.userArrivalTime || '',
        venue: schedule.venue || '',
        location: schedule.location || '',
        mainUser: mainUserId,
        subUser: subUserId,
        groom: schedule.groom || '',
        bride: schedule.bride || '',
        memo: schedule.memo || '',
        request: '', // 요청사항은 별도 필드가 없으므로 빈 값
      });
    } else {
      // 생성 모드일 때 폼 초기화 - 예식 시간 기본값 11:00, 도착 시간 10:00
      const defaultTime = '11:00';
      const defaultArrivalTime = subtractOneHour(defaultTime);
      setFormData({
        date: '',
        time: defaultTime,
        userArrivalTime: defaultArrivalTime,
        venue: '',
        location: '',
        mainUser: '',
        subUser: '',
        groom: '',
        bride: '',
        memo: '',
        request: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, open]);

  // ACTIVE 상태인 사용자만 필터링
  const activeUsers =
    usersData?.users?.filter((user) => user.status === 'ACTIVE') || [];

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // 예식 시간이 변경되면 작가 도착 시간을 자동으로 한 시간 전으로 설정
      if (field === 'time' && value) {
        newData.userArrivalTime = subtractOneHour(value);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 필드 검증
    if (
      !formData.date ||
      !formData.time ||
      !formData.venue ||
      !formData.groom ||
      !formData.bride
    ) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      if (isEditMode && schedule?.id) {
        // 수정 모드
        // 메인 작가가 없으면 미배정 상태로
        const status = formData.mainUser ? 'assigned' : 'unassigned';

        await updateSchedule({
          variables: {
            id: schedule.id,
            mainUser: formData.mainUser || null,
            subUser: formData.subUser || null,
            groom: formData.groom,
            bride: formData.bride,
            date: formData.date,
            time: formData.time,
            userArrivalTime: formData.userArrivalTime || null,
            venue: formData.venue,
            location: formData.location || null,
            memo: formData.memo || formData.request || null,
            status: status,
          },
        });
      } else {
        // 생성 모드
        // 메인작가나 서브작가가 있으면 배정완료(assigned), 없으면 미배정(unassigned)
        const status =
          formData.mainUser || formData.subUser ? 'assigned' : 'unassigned';

        // mainUser와 subUser가 모두 빈 문자열이면 null로 설정
        const mainUserValue =
          formData.mainUser && formData.mainUser.trim() !== ''
            ? formData.mainUser
            : null;
        const subUserValue =
          formData.subUser && formData.subUser.trim() !== ''
            ? formData.subUser
            : null;

        await createSchedule({
          variables: {
            mainUser: mainUserValue,
            subUser: subUserValue,
            groom: formData.groom,
            bride: formData.bride,
            date: formData.date,
            time: formData.time,
            userArrivalTime: formData.userArrivalTime || null,
            venue: formData.venue,
            location: formData.location || null,
            memo: formData.memo || formData.request || null,
            status: status,
          },
        });
      }

      // 성공 시 폼 초기화 및 모달 닫기
      setFormData({
        date: '',
        time: '',
        venue: '',
        location: '',
        mainUser: '',
        subUser: '',
        groom: '',
        bride: '',
        memo: '',
        request: '',
      });
      onSuccess();
    } catch (err) {
      console.error(isEditMode ? '일정 수정 오류:' : '일정 생성 오류:', err);
      alert(
        err instanceof Error
          ? err.message
          : isEditMode
          ? '일정 수정 중 오류가 발생했습니다.'
          : '일정 생성 중 오류가 발생했습니다.'
      );
    }
  };

  const handleConfirm = async () => {
    // 필수 필드 검증
    if (
      !formData.date ||
      !formData.time ||
      !formData.venue ||
      !formData.groom ||
      !formData.bride
    ) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!schedule?.id) {
      alert('수정 모드에서만 확정완료가 가능합니다.');
      return;
    }

    // 기존 스케줄의 mainUser/subUser ID 가져오기
    const mainUserName = schedule.mainUser || '';
    const subUserName = schedule.subUser || '';

    const existingMainUserId =
      (mainUserName &&
        usersData?.users?.find((user) => user?.name === mainUserName)?.id) ||
      mainUserName ||
      '';
    const existingSubUserId =
      (subUserName &&
        usersData?.users?.find((user) => user?.name === subUserName)?.id) ||
      subUserName ||
      '';

    // 스케줄이 이미 확정(assigned) 상태인지 확인
    const isAssigned = schedule.status === 'assigned';

    // 작가 변경 여부 확인
    const mainUserChanged =
      existingMainUserId && existingMainUserId !== formData.mainUser;
    const subUserChanged =
      existingSubUserId && existingSubUserId !== formData.subUser;

    // 변경된 작가가 있고, 스케줄이 이미 assigned 상태인 경우에만 확인 메시지 표시
    if (isAssigned && (mainUserChanged || subUserChanged)) {
      const changedUsers = [];
      if (mainUserChanged) {
        const existingMainUser = usersData?.users?.find(
          (user) => user?.id === existingMainUserId
        );
        changedUsers.push(
          `메인 작가: ${existingMainUser?.name || '알 수 없음'}`
        );
      }
      if (subUserChanged) {
        const existingSubUser = usersData?.users?.find(
          (user) => user?.id === existingSubUserId
        );
        changedUsers.push(
          `서브 작가: ${existingSubUser?.name || '알 수 없음'}`
        );
      }

      const confirmMessage = `이미 ${changedUsers.join(
        ', '
      )}가 배정되어있습니다.\n그래도 변경하시겠습니까?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      // 기존 Report 조회
      const { data: reportsResult } = await refetchReports();
      const existingReports = reportsResult?.reportsBySchedule || [];

      // 변경된 작가의 기존 Report 삭제
      if (mainUserChanged && existingMainUserId) {
        const mainReport = existingReports.find(
          (r) => r.user === existingMainUserId && r.role === 'MAIN'
        );
        if (mainReport) {
          await deleteReport({
            variables: { id: mainReport.id },
          });
        }
      }

      if (subUserChanged && existingSubUserId) {
        const subReport = existingReports.find(
          (r) => r.user === existingSubUserId && r.role === 'SUB'
        );
        if (subReport) {
          await deleteReport({
            variables: { id: subReport.id },
          });
        }
      }

      // 스케줄 수정 - 확정완료이므로 status를 'confirmed'로 설정
      await updateSchedule({
        variables: {
          id: schedule.id,
          mainUser: formData.mainUser || null,
          subUser: formData.subUser || null,
          groom: formData.groom,
          bride: formData.bride,
          date: formData.date,
          time: formData.time,
          userArrivalTime: formData.userArrivalTime || null,
          venue: formData.venue,
          location: formData.location || null,
          memo: formData.memo || formData.request || null,
          status: 'confirmed',
        },
      });

      // 스케줄 업데이트 후 잠시 대기하여 DB 반영 보장
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 새로운 mainUser가 있으면 MAIN role로 Report 생성
      if (formData.mainUser) {
        await createReport({
          variables: {
            scheduleId: schedule.id,
            status: 'pending',
            role: 'MAIN',
          },
        });
      }

      // 새로운 subUser가 있으면 SUB role로 Report 생성
      if (formData.subUser) {
        await createReport({
          variables: {
            scheduleId: schedule.id,
            status: 'pending',
            role: 'SUB',
          },
        });
      }

      // 성공 시 폼 초기화 및 모달 닫기
      setFormData({
        date: '',
        time: '',
        userArrivalTime: '',
        venue: '',
        location: '',
        mainUser: '',
        subUser: '',
        groom: '',
        bride: '',
        memo: '',
        request: '',
      });
      onSuccess();
    } catch (err) {
      console.error('확정완료 오류:', err);
      alert(
        err instanceof Error ? err.message : '확정완료 중 오류가 발생했습니다.'
      );
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) {
      alert('수정 모드에서만 삭제가 가능합니다.');
      return;
    }

    const confirmed = window.confirm(
      `정말로 이 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      // 확정완료 상태인 경우 관련 Report들도 삭제
      if (schedule.status === 'confirmed') {
        // 관련 Report 조회
        const { data: reportsResult } = await refetchReports();
        const existingReports = reportsResult?.reportsBySchedule || [];
        console.log('existingReports', existingReports);
        // 모든 Report 삭제
        for (const report of existingReports) {
          try {
            await deleteReport({
              variables: { id: report.id },
            });
          } catch (err) {
            console.error(`Report 삭제 오류 (ID: ${report.id}):`, err);
          }
        }
      }

      // 스케줄 삭제
      await deleteSchedule({
        variables: { id: schedule.id },
        refetchQueries: ['GetSchedules', 'GetSchedulesList'],
      });

      onSuccess();
    } catch (err) {
      console.error('일정 삭제 오류:', err);
      alert(
        err instanceof Error ? err.message : '일정 삭제 중 오류가 발생했습니다.'
      );
    }
  };

  const handleClose = () => {
    setFormData({
      date: '',
      time: '',
      userArrivalTime: '',
      venue: '',
      location: '',
      mainUser: '',
      subUser: '',
      groom: '',
      bride: '',
      memo: '',
      request: '',
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='w-full max-w-[520px] rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b  border-line-base sticky top-0 bg-white z-10'>
          <h2 className='text-lg font-semibold'>
            {isEditMode ? '일정 수정' : '새 일정 추가'}
          </h2>
          <button
            onClick={handleClose}
            className='text-gray-400 cursor-pointer hover:text-gray-600'
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className='px-6 py-5 space-y-4 text-sm'>
            {/* 신랑/신부 */}
            <div className='grid grid-cols-2 gap-3'>
              <Field label='신랑' required>
                <input
                  type='text'
                  className='input'
                  placeholder='예: 홍길동'
                  value={formData.groom}
                  onChange={(e) => handleChange('groom', e.target.value)}
                  required
                />
              </Field>
              <Field label='신부' required>
                <input
                  type='text'
                  className='input'
                  placeholder='예: 김영희'
                  value={formData.bride}
                  onChange={(e) => handleChange('bride', e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* 날짜 */}
            <Field label='날짜' required icon={<Calendar size={16} />}>
              <div className='relative'>
                <input
                  type='text'
                  className='input cursor-pointer'
                  value={
                    formData.date
                      ? (() => {
                          const date = new Date(formData.date);
                          const year = date.getFullYear();
                          const month = date.getMonth() + 1;
                          const day = date.getDate();
                          const dayNames = [
                            '일',
                            '월',
                            '화',
                            '수',
                            '목',
                            '금',
                            '토',
                          ];
                          const dayName = dayNames[date.getDay()];
                          return `${year}년 ${month}월 ${day}일 (${dayName})`;
                        })()
                      : ''
                  }
                  placeholder='날짜를 선택하세요'
                  onClick={() => setShowCalendar(!showCalendar)}
                  readOnly
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowCalendar(!showCalendar)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors'
                >
                  <Calendar size={18} />
                </button>
                {showCalendar && (
                  <div ref={calendarRef}>
                    <DatePicker
                      selectedDate={formData.date}
                      onSelectDate={(date) => {
                        handleChange('date', date);
                        setShowCalendar(false);
                      }}
                      currentDate={calendarDate}
                      onDateChange={setCalendarDate}
                    />
                  </div>
                )}
              </div>
              <p className='hint'>
                예식은 주말(토요일, 일요일)에만 진행됩니다.
              </p>
            </Field>

            {/* 시간 */}
            <Field label='예식 시간' required icon={<Clock size={16} />}>
              <input
                ref={timeInputRef}
                type='time'
                className='input cursor-pointer'
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                onClick={() => {
                  if (timeInputRef.current) {
                    if (typeof timeInputRef.current.showPicker === 'function') {
                      timeInputRef.current.showPicker();
                    }
                  }
                }}
                required
              />
            </Field>

            {/* 작가 도착 시간 */}
            <Field label='작가 도착 시간' required icon={<Clock size={16} />}>
              <input
                ref={arrivalTimeInputRef}
                type='time'
                className='input cursor-pointer'
                value={formData.userArrivalTime}
                onChange={(e) =>
                  handleChange('userArrivalTime', e.target.value)
                }
                onClick={() => {
                  if (arrivalTimeInputRef.current) {
                    if (typeof arrivalTimeInputRef.current.showPicker === 'function') {
                      arrivalTimeInputRef.current.showPicker();
                    }
                  }
                }}
                placeholder='예: 10:30'
              />
            </Field>

            {/* 웨딩홀 */}
            <Field label='웨딩홀' required icon={<MapPin size={16} />}>
              <input
                className='input'
                placeholder='예: 오픈교회 1층 그레이스홀'
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                required
              />
            </Field>

            {/* 주소 */}
            <Field label='주소' icon={<MapPin size={16} />}>
              <input
                className='input'
                placeholder='예: 강동구 강동대로 235'
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </Field>

            {/* 작가 */}
            <div className='grid grid-cols-2 gap-3'>
              <Field label='메인 작가' icon={<User size={16} />}>
                <select
                  className='input'
                  value={formData.mainUser}
                  onChange={(e) => handleChange('mainUser', e.target.value)}
                >
                  <option value=''>미배정</option>
                  {usersLoading ? (
                    <option disabled>로딩 중...</option>
                  ) : (
                    activeUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  )}
                </select>
                <p className='hint'>
                  메인 작가를 비워두면 미배정 상태로 등록됩니다.
                </p>
              </Field>
              <Field label='서브 작가' icon={<User size={16} />}>
                <select
                  className='input'
                  value={formData.subUser}
                  onChange={(e) => handleChange('subUser', e.target.value)}
                >
                  <option value=''>없음</option>
                  {usersLoading ? (
                    <option disabled>로딩 중...</option>
                  ) : (
                    activeUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  )}
                </select>
              </Field>
            </div>

            {/* 요청사항 */}
            <Field label='요청사항' icon={<FileText size={16} />}>
              <textarea
                rows={3}
                className='input resize-none'
                placeholder='고객 요청사항을 입력하세요'
                value={formData.request}
                onChange={(e) => handleChange('request', e.target.value)}
              />
            </Field>

            {/* 메모 */}
            <Field label='메모' icon={<StickyNote size={16} />}>
              <textarea
                rows={3}
                className='input resize-none'
                placeholder='내부 메모를 입력하세요'
                value={formData.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className='flex justify-end gap-2 px-6 py-4 border-t border-line-base sticky bottom-0 bg-white'>
            {isEditMode && (
              <>
                <button
                  type='button'
                  onClick={handleDelete}
                  className='px-4 py-2 rounded-lg bg-[#D22C2C] cursor-pointer text-white text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[80px]'
                  disabled={creating || updating || confirming || deleting}
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner type='beat' size={4} color='white' />
                      <span>삭제 중</span>
                    </>
                  ) : (
                    '삭제'
                  )}
                </button>
            {schedule.status !== "confirmed" &&  
            <button
                  type='button'
                  onClick={handleConfirm}
                  className='px-4 py-2 rounded-lg bg-green-600 cursor-pointer text-white text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]'
                  disabled={creating || updating || confirming || deleting}
                >
                  {confirming ? (
                    <>
                      <LoadingSpinner type='beat' size={4} color='white' />
                      <span>확정 중</span>
                    </>
                  ) : (
                    '확정완료'
                  )}
                </button>}
              </>
            )}
            <button
              type='submit'
              className='px-4 py-2 rounded-lg bg-blue-600 cursor-pointer text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]'
              disabled={creating || updating || confirming || deleting}
            >
              {isEditMode ? (
                updating ? (
                  <>
                    <LoadingSpinner type='beat' size={4} color='white' />
                    <span>수정 중</span>
                  </>
                ) : (
                  '수정완료'
                )
              ) : creating ? (
                <>
                  <LoadingSpinner type='beat' size={4} color='white' />
                  <span>추가 중</span>
                </>
              ) : (
                '추가'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #2563eb;
        }
        .input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        .hint {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, icon, children }) {
  return (
    <div>
      <label className='flex items-center gap-1 mb-1 font-medium'>
        {icon}
        {label}
        {required && <span className='text-red-500'>*</span>}
      </label>
      {children}
    </div>
  );
}
