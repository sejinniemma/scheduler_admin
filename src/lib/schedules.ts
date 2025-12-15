import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/authOptions';
import ScheduleModel from '../app/api/db/models/Schedule';
import ReportModel from '../app/api/db/models/Report';
import UserModel from '../app/api/db/models/User';
import { connectToDatabase } from '../app/api/db/mongodb';
import { getToday } from './utiles';
import type { NextAuthOptions } from 'next-auth';
import type { Schedule } from '../types/schedule';

export async function getAllAssignedSchedules(): Promise<Schedule[]> {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);

    if (!session?.user?.id) {
      return [];
    }

    await connectToDatabase();

    // 어드민 파트별 필터링
    if (!session.user.adminPart) {
      return [];
    }

    // 자신의 파트에 해당하는 유저들의 스케줄만 조회
    const partUsers = await UserModel.find({
      role: session.user.adminPart,
    }).select('id');
    const partUserIds = partUsers.map((u) => u.id);

    const query: any = {
      subStatus: { $in: ['assigned', 'completed'] },
      $or: [
        { mainUser: { $in: partUserIds } },
        { subUser: { $in: partUserIds } },
      ],
    };

    const schedules = await ScheduleModel.find(query);

    // date와 time 기준 정렬 (날짜 먼저, 같은 날짜면 시간 순)
    const sortedSchedules = schedules.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // User 찾기 (Report 조회를 위해)
    const user = await UserModel.findOne({ id: session.user.id });
    if (!user) {
      return [];
    }

    // 각 스케줄에 대한 Report의 currentStep 가져오기 및 User 이름 가져오기
    const schedulesWithCurrentStep = await Promise.all(
      sortedSchedules.map(async (schedule) => {
        // 해당 스케줄에 대한 Report 찾기
        const report = await ReportModel.findOne({
          schedule: schedule._id,
          user: user._id,
        });

        // mainUser와 subUser의 이름 가져오기
        const mainUserDoc = await UserModel.findOne({ id: schedule.mainUser });
        const subUserDoc = await UserModel.findOne({ id: schedule.subUser });

        return {
          id: schedule.id,
          mainUser: mainUserDoc?.name || schedule.mainUser,
          subUser: subUserDoc?.name || schedule.subUser,
          groom: schedule.groom,
          bride: schedule.bride,
          date: schedule.date,
          time: schedule.time,
          location: schedule.location,
          venue: schedule.venue,
          memo: schedule.memo,
          status: schedule.status,
          subStatus: schedule.subStatus,
          currentStep: report?.currentStep ?? 0,
          createdAt: schedule.createdAt?.toISOString(),
          updatedAt: schedule.updatedAt?.toISOString(),
        };
      })
    );

    return schedulesWithCurrentStep;
  } catch (error) {
    console.error('스케줄 가져오기 오류:', error);
    return [];
  }
}

export async function getTodaySchedules(): Promise<Schedule[]> {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);

    if (!session?.user?.id || !session.user.adminPart) {
      return [];
    }

    await connectToDatabase();

    // 자신의 파트에 해당하는 유저들의 스케줄만 조회
    const partUsers = await UserModel.find({
      role: session.user.adminPart,
    }).select('id');
    const partUserIds = partUsers.map((u) => u.id);

    const query = {
      $or: [
        { mainUser: { $in: partUserIds } },
        { subUser: { $in: partUserIds } },
      ],
      date: getToday(),
      subStatus: 'assigned',
    };

    const schedules = await ScheduleModel.find(query);

    // time 기준 정렬 (더 빠른 시간이 앞에)
    const sortedSchedules = schedules.sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    // // User 찾기 (Report 조회를 위해)
    // const user = await UserModel.findOne({ id: session.user.id });
    // if (!user) {
    //   return [];
    // }

    // 각 스케줄에 대한 Report의 currentStep 가져오기
    const schedulesWithCurrentStep = await Promise.all(
      sortedSchedules.map(async (schedule) => {
        // 해당 스케줄에 대한 Report 찾기
        // const report = await ReportModel.findOne({
        //   schedule: schedule._id,
        //   user: user._id,
        // });

        return {
          id: schedule.id,
          mainUser: schedule.mainUser,
          subUser: schedule.subUser,
          groom: schedule.groom,
          bride: schedule.bride,
          date: schedule.date,
          time: schedule.time,
          location: schedule.location,
          venue: schedule.venue,
          memo: schedule.memo,
          status: schedule.status,
          subStatus: schedule.subStatus,
          // currentStep: report?.currentStep ?? 0,
          createdAt: schedule.createdAt?.toISOString(),
          updatedAt: schedule.updatedAt?.toISOString(),
        };
      })
    );

    return schedulesWithCurrentStep;
  } catch (error) {
    console.error('스케줄 가져오기 오류:', error);
    return [];
  }
}
