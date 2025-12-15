import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import ScheduleModel from '../../db/models/Schedule';
import UserModel from '../../db/models/User';
import { connectToDatabase } from '../../db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 어드민 파트별 필터링
    if (!session.user.adminPart) {
      return NextResponse.json(
        { error: '어드민 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 자신의 파트에 해당하는 유저들의 스케줄만 조회
    const partUsers = await UserModel.find({
      role: session.user.adminPart,
    }).select('id');
    const partUserIds = partUsers.map((u) => u.id);

    const scheduleQuery = {
      $or: [
        { mainUser: { $in: partUserIds } },
        { subUser: { $in: partUserIds } },
      ],
    };

    const schedules = await ScheduleModel.find(scheduleQuery).sort({
      date: 1,
      time: 1,
    });

    // 각 스케줄에 대한 User 이름 가져오기
    const schedulesWithUserNames = await Promise.all(
      schedules.map(async (schedule) => {
        const mainUserDoc = await UserModel.findOne({ id: schedule.mainUser });
        const subUserDoc = schedule.subUser
          ? await UserModel.findOne({ id: schedule.subUser })
          : null;

        return {
          id: schedule.id,
          mainUser: mainUserDoc?.name || schedule.mainUser,
          subUser: subUserDoc?.name || schedule.subUser || '-',
          groom: schedule.groom,
          bride: schedule.bride,
          date: schedule.date,
          time: schedule.time,
          location: schedule.location,
          venue: schedule.venue,
          memo: schedule.memo,
          status: schedule.status,
          subStatus: schedule.subStatus,
          createdAt: schedule.createdAt?.toISOString(),
          updatedAt: schedule.updatedAt?.toISOString(),
        };
      })
    );

    return NextResponse.json({ schedules: schedulesWithUserNames });
  } catch (error) {
    console.error('스케줄 가져오기 오류:', error);
    return NextResponse.json(
      { error: '스케줄을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

