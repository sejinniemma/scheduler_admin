'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import type { Schedule } from '@/src/types/schedule';

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
  initialSchedules: Schedule[];
}

export function ScheduleProvider({
  children,
  initialSchedules,
}: ScheduleProviderProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/schedules/today');
      if (!response.ok) {
        throw new Error('스케줄을 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('스케줄 새로고침 오류:', err);
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // refetch는 refreshSchedules의 별칭
  const refetch = useCallback(async () => {
    await refreshSchedules();
  }, [refreshSchedules]);
  console.log(`schedules: ${schedules}`);
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
