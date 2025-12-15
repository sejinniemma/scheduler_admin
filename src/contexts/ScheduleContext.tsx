'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from 'react';
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
  // 각 endpoint별로 캐시를 유지 (useState가 자동으로 캐시해주지만, endpoint별로 별도 저장 필요)
  const [cache, setCache] = useState<{
    today: Schedule[] | null;
    list: Schedule[] | null;
  }>({
    today: null,
    list: null,
  });

  // 현재 endpoint의 캐시된 데이터 사용
  const cachedData = cache[endpoint];
  const [schedules, setSchedules] = useState<Schedule[]>(
    cachedData || initialSchedules
  );
  const [isLoading, setIsLoading] = useState(
    cachedData === null && initialSchedules.length === 0
  );
  const [error, setError] = useState<string | null>(null);

  const refreshSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiEndpoint =
        endpoint === 'today' ? '/api/schedules/today' : '/api/schedules/list';
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('스케줄을 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      const fetchedSchedules = data.schedules || [];

      // 캐시에 저장 (useState가 자동으로 유지)
      setCache((prev) => ({
        ...prev,
        [endpoint]: fetchedSchedules,
      }));

      setSchedules(fetchedSchedules);
    } catch (err) {
      console.error('스케줄 새로고침 오류:', err);
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // endpoint 변경 시: 캐시에 있으면 즉시 사용, 없으면 fetch
  useEffect(() => {
    const cachedData = cache[endpoint];
    if (cachedData !== null) {
      // 캐시된 데이터가 있으면 즉시 사용 (useState가 이미 캐시하고 있음)
      setSchedules(cachedData);
      setIsLoading(false);
    } else {
      // 캐시된 데이터가 없으면 fetch
      refreshSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]); // endpoint만 의존성으로 사용 (cache와 refreshSchedules는 endpoint 변경 시 자동 업데이트)

  // refetch는 refreshSchedules의 별칭
  const refetch = useCallback(async () => {
    await refreshSchedules();
  }, [refreshSchedules]);

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        isLoading,
        error,
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
