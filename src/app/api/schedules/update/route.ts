import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import ScheduleModel from '../../db/models/Schedule';
import { connectToDatabase } from '../../db/mongodb';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scheduleId, subStatus } = body;

    if (!scheduleId || !subStatus) {
      return NextResponse.json(
        { error: 'scheduleId와 subStatus가 필요합니다.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const schedule = await ScheduleModel.findOne({ id: scheduleId });

    if (!schedule) {
      return NextResponse.json(
        { error: '스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (관리자만 수정 가능하거나, 본인이 관련된 스케줄만)
    // 여기서는 관리자 권한 체크를 생략하고, 필요시 추가 가능

    schedule.subStatus = subStatus;
    await schedule.save();

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        subStatus: schedule.subStatus,
      },
    });
  } catch (error) {
    console.error('스케줄 업데이트 오류:', error);
    return NextResponse.json(
      { error: '스케줄을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

