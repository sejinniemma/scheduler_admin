'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_USERS } from '@/src/client/graphql/User';

interface User {
  id: string;
  name: string;
  phone: string;
  gender: string | null;
  role: string;
  address: string | null;
  mainLocation: string | null;
  hasVehicle: boolean;
  startDate: string | null;
  birthDate: string | null;
  status: string | null;
  memo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE';

interface GetUsersData {
  users: User[];
}

export default function ArtistsPage() {
  const {
    data,
    loading: isLoading,
    error: queryError,
  } = useQuery<GetUsersData>(GET_USERS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const users: User[] = data?.users || [];
  const error = queryError
    ? queryError.message || '사용자 정보를 가져오는데 실패했습니다.'
    : null;

  // 상태별 필터링
  const filteredUsers = users.filter((user) => {
    if (statusFilter === 'all') return true;
    return user.status === statusFilter;
  });

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'MALE':
        return '남성';
      case 'FEMALE':
        return '여성';
      default:
        return '-';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return '활성';
      case 'INACTIVE':
        return '비활성';
      default:
        return '-';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (isLoading) {
    return (
      <div className='p-[40px]'>
        <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
          작가관리
        </h1>
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-default'>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-[40px]'>
        <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
          작가관리
        </h1>
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-red'>{error}</p>
        </div>
      </div>
    );
  }

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'ACTIVE', label: '활성' },
    { key: 'INACTIVE', label: '비활성' },
  ];

  return (
    <div className='p-[40px]'>
      <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
        작가관리
      </h1>

      {/* 상태 탭 */}
      <div className='flex gap-[10px] mb-[20px] border-b border-line-base'>
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-[20px] py-[12px] cursor-pointer text-body4 font-medium transition-colors border-b-2 ${
              statusFilter === tab.key
                ? 'border-blue text-blue font-semibold'
                : 'border-transparent text-default hover:text-normal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-default'>등록된 작가가 없습니다.</p>
        </div>
      ) : (
        <div className='bg-white rounded-[10px] border border-line-base overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-light border-b border-line-base'>
                <tr className='text-caption1 font-bold text-[#454545] text-center'>
                  <th className='p-[16px]'>번호</th>
                  <th className='p-[16px]'>이름</th>
                  <th className='p-[16px]'>전화번호</th>
                  <th className='p-[16px]'>성별</th>
                  <th className='p-[16px]'>주소</th>
                  <th className='p-[16px]'>주 활동지역</th>
                  <th className='p-[16px]'>차량보유</th>
                  <th className='p-[16px]'>시작일</th>
                  <th className='p-[16px]'>상태</th>
                  <th className='p-[16px]'>메모</th>
                </tr>
              </thead>
              <tbody className='text-center'>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className='border-b border-line-edge hover:bg-lighter transition-colors'
                  >
                    {/* 번호 */}
                    <td className='p-[16px] text-body4 text-normal font-medium'>
                      {index + 1}
                    </td>
                    {/* 이름 */}
                    <td className='p-[16px] text-body4 text-normal'>
                      {user.name}
                    </td>
                    {/* 전화번호 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {user.phone}
                    </td>
                    {/* 성별 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {getGenderLabel(user.gender)}
                    </td>
                    {/* 주소 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {user.address || '-'}
                    </td>
                    {/* 주 활동지역 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {user.mainLocation || '-'}
                    </td>
                    {/* 차량보유 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {user.hasVehicle ? '보유' : '-'}
                    </td>
                    {/* 시작일 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {formatDate(user.startDate)}
                    </td>
                    {/* 상태 */}
                    <td className='p-[16px] text-body4 text-default'>
                      {getStatusLabel(user.status)}
                    </td>
                    {/* 메모 */}
                    <td className='p-[16px] text-body4 text-default max-w-[200px] truncate'>
                      {user.memo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
