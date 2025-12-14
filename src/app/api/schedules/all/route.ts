import { NextRequest, NextResponse } from 'next/server';
import { getAllAssignedSchedules } from '@/src/lib/schedules';

export async function GET(request: NextRequest) {
  try {
    const schedules = await getAllAssignedSchedules();
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('스케줄 가져오기 오류:', error);
    return NextResponse.json(
      { error: '스케줄을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

