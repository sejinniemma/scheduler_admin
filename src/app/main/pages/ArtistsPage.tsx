'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_USERS } from '@/src/client/graphql/User';
import AuthorAddModal from '@/src/components/AuthorAddModal';
import AuthorEditModal from '@/src/components/AuthorEditModal';
import LoadingSpinner from '@/src/components/LoadingSpinner';

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
    refetch,
  } = useQuery<GetUsersData>(GET_USERS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleRefetch = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

 
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
      {/* <h1 className='text-body4 text-normal font-semibold mb-[40px]'>
        작가관리
      </h1> */}
      {/* 작가추가 및 새로고침 */}
      <div className='flex justify-end gap-[10px] mb-[20px]'>
        <button
          onClick={handleRefetch}
          disabled={isRefreshing}
          className='px-[12px] py-[6px] cursor-pointer bg-light text-normal text-caption1 font-medium rounded-[5px] hover:bg-lighter transition-colors flex items-center gap-[6px] disabled:opacity-50 disabled:cursor-not-allowed'
          title='새로고침'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M8 2.66667V1.33333M8 1.33333L6 3.33333M8 1.33333L10 3.33333M3.33333 8C3.33333 10.5773 5.42267 12.6667 8 12.6667C9.84 12.6667 11.42 11.5867 12.1867 10M12.6667 8C12.6667 5.42267 10.5773 3.33333 8 3.33333C6.16 3.33333 4.58 4.41333 3.81333 6M13.3333 8H14.6667M1.33333 8H2.66667'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          새로고침
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className='px-[12px] py-[6px] cursor-pointer bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
        >
          + 작가추가
        </button>
      </div>
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

      {!isLoading && filteredUsers.length === 0 ? (
        <div className='flex items-center justify-center h-[400px]'>
          <p className='text-body2 text-default'>등록된 작가가 없습니다.</p>
        </div>
      ) : isRefreshing ? (
        <div className='flex items-center justify-center h-[400px]'>
          <LoadingSpinner type='beat' size='lg' />
        </div>
      ) : isLoading ? (
        <div className='flex items-center justify-center h-[400px]'>
          <LoadingSpinner type='beat' size='lg' />
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
                  <th className='p-[16px]'>상세</th>
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
                    {/* 상세 - 수정 버튼 */}
                    <td className='p-[16px]'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(user);
                        }}
                        className='px-[12px] py-[6px] cursor-pointer bg-blue text-white text-caption1 font-medium rounded-[5px] hover:opacity-90 transition-opacity'
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 작가 추가 모달 */}
      <AuthorAddModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      {/* 작가 수정 모달 */}
      {selectedUser && (
        <AuthorEditModal
          key={selectedUser.id} // user가 변경될 때 컴포넌트 재마운트
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            refetch();
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
}
