'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, User, Phone, MapPin, Calendar } from 'lucide-react';
import { UPDATE_USER, DELETE_USER } from '@/src/client/graphql/User';
import DatePicker from './DatePicker';

interface UserData {
  id: string;
  name: string;
  phone: string;
  gender: string | null;
  address: string | null;
  mainLocation: string | null;
  startDate: string | null;
  hasVehicle: boolean;
  status: string | null;
  memo: string | null;
}

interface AuthorEditModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  user: UserData | null;
}

export default function AuthorEditModal({
  open = false,
  onClose = () => {},
  onSuccess = () => {},
  user = null,
}: AuthorEditModalProps) {
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 달력 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
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

  // 날짜 형식 변환 (ISO -> YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // user가 변경될 때마다 초기 formData 계산
  const initialFormData = useMemo(() => {
    if (!user) {
      return {
        name: '',
        phone: '',
        gender: '',
        address: '',
        mainLocation: '',
        startDate: '',
        hasVehicle: false,
        status: '',
        memo: '',
      };
    }
    const startDate = formatDateForInput(user.startDate);
    return {
      name: user.name || '',
      phone: user.phone || '',
      gender: user.gender || '',
      address: user.address || '',
      mainLocation: user.mainLocation || '',
      startDate: startDate,
      hasVehicle: user.hasVehicle || false,
      status: user.status || '',
      memo: user.memo || '',
    };
  }, [user]);

  // user가 변경될 때 calendarDate 초기화
  useEffect(() => {
    if (user?.startDate) {
      const startDate = formatDateForInput(user.startDate);
      if (startDate) {
        const newDate = new Date(startDate);
        if (newDate.getTime() !== calendarDate.getTime()) {
          setCalendarDate(newDate);
        }
      }
    } else {
      setCalendarDate(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // key prop으로 컴포넌트가 재마운트되므로 initialFormData가 자동으로 사용됨
  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // 필수 필드 검증
    if (!formData.name || !formData.phone || !formData.startDate) {
      alert('필수 항목(이름, 연락처, 시작일)을 모두 입력해주세요.');
      return;
    }

    // 날짜를 ISO 8601 DateTime 형식으로 변환
    const startDateISO = formData.startDate
      ? new Date(formData.startDate + 'T00:00:00.000Z').toISOString()
      : null;

    try {
      await updateUser({
        variables: {
          id: user.id,
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender || null,
          address: formData.address || null,
          mainLocation: formData.mainLocation || null,
          startDate: startDateISO,
          hasVehicle: formData.hasVehicle,
          status: formData.status || null,
          memo: formData.memo || null,
        },
        refetchQueries: ['GetUsers'], // 사용자 목록 새로고침
      });

      onSuccess();
    } catch (err) {
      console.error('작가 수정 오류:', err);
      alert(
        err instanceof Error ? err.message : '작가 수정 중 오류가 발생했습니다.'
      );
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      `정말로 "${user.name}" 작가를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      await deleteUser({
        variables: {
          id: user.id,
        },
        refetchQueries: ['GetUsers'], // 사용자 목록 새로고침
      });

      onSuccess();
    } catch (err) {
      console.error('작가 삭제 오류:', err);
      alert(
        err instanceof Error ? err.message : '작가 삭제 중 오류가 발생했습니다.'
      );
    }
  };

  const handleClose = () => {
    setShowCalendar(false);
    onClose();
  };

  if (!open || !user) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='w-full max-w-[420px] rounded-2xl bg-white shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-line-base'>
          <h2 className='text-base font-semibold'>작가 수정</h2>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 cursor-pointer'
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className='px-6 py-5 space-y-4 text-sm'>
            <Field label='이름' required icon={<User size={16} />}>
              <input
                type='text'
                className='input'
                placeholder='예: 홍길동'
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Field>

            <Field label='성별'>
              <select
                className='input'
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value=''>선택안함</option>
                <option value='MALE'>남성</option>
                <option value='FEMALE'>여성</option>
              </select>
            </Field>

            <Field label='연락처' required icon={<Phone size={16} />}>
              <input
                type='tel'
                className='input'
                placeholder='010-0000-0000'
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </Field>

            <Field label='시작일' required>
              <div className='relative'>
                <input
                  type='text'
                  className='input cursor-pointer pr-10'
                  value={
                    formData.startDate
                      ? (() => {
                          const date = new Date(formData.startDate);
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
                  <Calendar size={16} />
                </button>
                {showCalendar && (
                  <div ref={calendarRef}>
                    <DatePicker
                      selectedDate={formData.startDate}
                      onSelectDate={(date: string) => {
                        handleChange('startDate', date);
                        setShowCalendar(false);
                      }}
                      currentDate={calendarDate}
                      onDateChange={setCalendarDate}
                    />
                  </div>
                )}
              </div>
            </Field>

            <Field label='거주지' icon={<MapPin size={16} />}>
              <input
                type='text'
                className='input'
                placeholder='예: 서울시 강남구 역삼동'
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Field>

            <Field label='주 활동 지역'>
              <input
                type='text'
                className='input'
                placeholder='예: 서울, 경기'
                value={formData.mainLocation}
                onChange={(e) => handleChange('mainLocation', e.target.value)}
              />
            </Field>

            <Field label='차량 보유'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.hasVehicle}
                  onChange={(e) => handleChange('hasVehicle', e.target.checked)}
                  className='w-4 h-4'
                />
                <span>차량 보유</span>
              </label>
            </Field>

            <Field label='상태'>
              <select
                className='input'
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value=''>선택안함</option>
                <option value='ACTIVE'>활성</option>
                <option value='INACTIVE'>비활성</option>
              </select>
            </Field>

            <Field label='비고'>
              <textarea
                rows={3}
                className='input resize-none'
                placeholder='메모를 입력하세요'
                value={formData.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className='flex gap-3 px-6 py-4 border-t border-line-base'>
            <button
              type='button'
              onClick={handleDelete}
              className='flex-1 rounded-xl border cursor-pointer py-2 text-sm bg-[#D22C2C] text-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={updating || deleting}
            >
              {deleting ? '삭제 중...' : '삭제하기'}
            </button>
            <button
              type='submit'
              className='flex-1 rounded-xl cursor-pointer bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={updating || deleting}
            >
              {updating ? '수정 중...' : '수정완료'}
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
      `}</style>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ label, required, icon, children }: FieldProps) {
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
