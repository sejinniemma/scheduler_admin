'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, User, Phone, MapPin, Calendar } from 'lucide-react';
import { CREATE_USER } from '@/src/client/graphql/User';

export default function AuthorAddModal({
  open = false,
  onClose = () => {},
  onSuccess = () => {},
}) {
  const [createUser, { loading: creating }] = useMutation(CREATE_USER);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    address: '',
    mainLocation: '',
    startDate: '',
    hasVehicle: false,
    memo: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.name || !formData.phone || !formData.startDate) {
      alert('필수 항목(이름, 연락처, 시작일)을 모두 입력해주세요.');
      return;
    }

    // 성별 변환 (한글 -> 영문)
    const genderMap = {
      남성: 'MALE',
      남자: 'MALE',
      여성: 'FEMALE',
      여자: 'FEMALE',
    };
    const genderValue = genderMap[formData.gender] || formData.gender || null;

    // 날짜를 ISO 8601 DateTime 형식으로 변환
    // "2025-12-09" -> "2025-12-09T00:00:00.000Z"
    const startDateISO = formData.startDate
      ? new Date(formData.startDate + 'T00:00:00.000Z').toISOString()
      : null;

    try {
      await createUser({
        variables: {
          name: formData.name,
          phone: formData.phone,
          gender: genderValue,
          address: formData.address || null,
          mainLocation: formData.mainLocation || null,
          startDate: startDateISO,
          role: 'PHOTOGRAPHER', // 기본값
          hasVehicle: formData.hasVehicle,
          status: 'ACTIVE', // 기본값
          memo: formData.memo || null,
        },
        refetchQueries: ['GetUsers'], // 사용자 목록 새로고침
      });

      // 성공 시 폼 초기화 및 모달 닫기
      setFormData({
        name: '',
        phone: '',
        gender: '',
        address: '',
        mainLocation: '',
        startDate: '',
        hasVehicle: false,
        memo: '',
      });
      onSuccess();
    } catch (err) {
      console.error('작가 추가 오류:', err);
      alert(
        err instanceof Error ? err.message : '작가 추가 중 오류가 발생했습니다.'
      );
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      gender: '',
      address: '',
      mainLocation: '',
      startDate: '',
      hasVehicle: false,
      memo: '',
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='w-full max-w-[420px] rounded-2xl bg-white shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-line-base'>
          <h2 className='text-base font-semibold'>작가 추가</h2>
          <button
            onClick={onClose}
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

            <Field label='시작일' required icon={<Calendar size={16} />}>
              <input
                type='date'
                className='input'
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
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
              onClick={handleClose}
              className='flex-1 rounded-xl border cursor-pointer py-2 text-sm hover:bg-gray-50'
              disabled={creating}
            >
              취소
            </button>
            <button
              type='submit'
              className='flex-1 rounded-xl cursor-pointer bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={creating}
            >
              {creating ? '추가 중...' : '추가'}
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
