// 클래스명 유틸리티
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

export const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatScheduleDate = (date: string, time: string): string => {
  // "YYYY-MM-DD" 형식을 파싱
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[dateObj.getDay()];

  return `${year}년 ${month}월 ${day}일 (${weekday}) ${time}`;
};

export const formatDateForGroup = (date: string): string => {
  // "YYYY-MM-DD" 형식을 파싱
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const weekdays = [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ];
  const weekday = weekdays[dateObj.getDay()];

  return `${year}년 ${month}월 ${day}일 ${weekday}`;
};

export const getDateColor = (date: string): 'blue' | 'red' => {
  // "YYYY-MM-DD" 형식을 파싱
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  // 일요일(0)이면 빨간색, 그 외는 파란색
  return dayOfWeek === 0 ? 'red' : 'blue';
};
