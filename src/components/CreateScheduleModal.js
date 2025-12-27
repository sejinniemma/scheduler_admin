'use client';

import { useState, useEffect } from 'react';
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
import { GET_USERS } from '@/src/client/graphql/User';
import {
  CREATE_SCHEDULE,
  UPDATE_SCHEDULE,
} from '@/src/client/graphql/Schedule';

export default function CreateScheduleModal({
  open = false,
  onClose = () => {},
  onSuccess = () => {},
  schedule = null, // 수정 모드일 때 전달되는 스케줄 데이터
}) {
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);
  const [createSchedule, { loading: creating }] = useMutation(CREATE_SCHEDULE);
  const [updateSchedule, { loading: updating }] = useMutation(UPDATE_SCHEDULE);

  const [formData, setFormData] = useState({
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

  const isEditMode = !!schedule;

  // 수정 모드일 때 스케줄 데이터로 폼 초기화
  useEffect(() => {
    if (!open) return;

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
      // 생성 모드일 때 폼 초기화
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, open]);

  // ACTIVE 상태인 사용자만 필터링
  const activeUsers =
    usersData?.users?.filter((user) => user.status === 'ACTIVE') || [];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            venue: formData.venue,
            location: formData.location || null,
            memo: formData.memo || formData.request || null,
            status: status,
          },
        });
      } else {
        // 생성 모드

        await createSchedule({
          variables: {
            mainUser: formData.mainUser || null,
            subUser: formData.subUser || null,
            groom: formData.groom,
            bride: formData.bride,
            date: formData.date,
            time: formData.time,
            venue: formData.venue,
            location: formData.location || null,
            memo: formData.memo || formData.request || null,
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

  const handleClose = () => {
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
              <input
                type='date'
                className='input'
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
              <p className='hint'>
                예식은 주말(토요일, 일요일)에만 진행됩니다.
              </p>
            </Field>

            {/* 시간 */}
            <Field label='시간' required icon={<Clock size={16} />}>
              <input
                type='time'
                className='input'
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                required
              />
              <p className='hint'>형식: HH:MM</p>
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
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 rounded-lg cursor-pointer border text-sm hover:bg-gray-50'
              disabled={creating || updating}
            >
              취소
            </button>
            <button
              type='submit'
              className='px-4 py-2 rounded-lg bg-blue-600 cursor-pointer text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={creating || updating}
            >
              {isEditMode
                ? updating
                  ? '수정 중...'
                  : '수정완료'
                : creating
                ? '추가 중...'
                : '추가'}
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
