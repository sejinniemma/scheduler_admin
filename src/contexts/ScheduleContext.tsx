'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  GET_SCHEDULES,
  GET_SCHEDULES_LIST,
} from '@/src/client/graphql/Schedule';
import { getToday } from '@/src/lib/utiles';
import type { Schedule } from '@/src/types/schedule';

type ScheduleEndpoint = 'today' | 'list';

interface ScheduleContextType {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
  refreshSchedules: () => Promise<void>;
  refetch: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

interface ScheduleProviderProps {
  children: ReactNode;
  endpoint: ScheduleEndpoint;
  initialSchedules?: Schedule[];
}

export function ScheduleProvider({
  children,
  endpoint,
  initialSchedules = [],
}: ScheduleProviderProps) {
  // today 엔드포인트: 오늘 날짜, status: 'assigned'
  // list 엔드포인트: schedulesList 쿼리 사용
  const todayDate = useMemo(() => getToday(), []);

  const {
    data,
    loading,
    error,
    refetch: refetchQuery,
  } = useQuery(endpoint === 'today' ? GET_SCHEDULES : GET_SCHEDULES_LIST, {
    variables:
      endpoint === 'today'
        ? {
            date: todayDate,
            status: 'assigned',
          }
        : undefined,
    // Apollo Client가 자동으로 캐싱해줌
    fetchPolicy: 'cache-and-network', // 캐시를 먼저 보여주고 백그라운드에서 업데이트
    errorPolicy: 'all', // 에러가 있어도 부분 데이터 반환
  });

  const schedules: Schedule[] = useMemo(() => {
    if (data) {
      if (endpoint === 'today') {
        return (data as { schedules?: Schedule[] }).schedules || [];
      } else {
        return (data as { schedulesList?: Schedule[] }).schedulesList || [];
      }
    }
    return initialSchedules;
  }, [data, endpoint, initialSchedules]);

  const refreshSchedules = async () => {
    await refetchQuery();
  };

  const refetch = refreshSchedules;

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        isLoading: loading,
        error: error?.message || null,
        refreshSchedules,
        refetch,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
