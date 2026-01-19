import Schedule from '../models/Schedule';
import User from '../models/User';
import Report from '../models/Report';
import UserConfirm from '../models/UserConfirm';
import { connectToDatabase } from '../mongodb';
import { gql } from '@apollo/client';

// 파트별 유저 ID 목록 가져오기 (헬퍼 함수)
async function getPartUserIds(adminPart) {
  const partUsers = await User.find({ role: adminPart }).select('id').lean();
  return partUsers.map((u) => u.id);
}

// 파트별 스케줄 필터 쿼리 생성 (헬퍼 함수)
async function buildPartScheduleQuery(adminPart, filters = {}) {
  const partUserIds = await getPartUserIds(adminPart);

  const query = {
    $or: [
      { mainUser: { $in: partUserIds } },
      { subUser: { $in: partUserIds } },
    ],
    ...filters,
  };

  return { query, partUserIds };
}

export const typeDefs = gql`
  scalar DateTime

  type Schedule {
    id: ID!
    mainUser: String
    subUser: String!
    groom: String!
    bride: String!
    date: String!
    time: String!
    scheduledAt: DateTime
    userArrivalTime: String
    location: String
    venue: String
    memo: String
    mainUserMemo: String
    subUserMemo: String
    mainUserReportStatus: String
    subUserReportStatus: String
    mainUserConfirmed: Boolean
    subUserConfirmed: Boolean
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    schedules(date: String, status: String): [Schedule!]!
    schedulesList: [Schedule!]!
    schedulesHistory: [Schedule!]!
    schedule(id: ID!): Schedule
  }

  type Mutation {
    createSchedule(
      mainUser: String
      subUser: String
      groom: String!
      bride: String!
      date: String!
      time: String!
      userArrivalTime: String
      location: String
      venue: String
      memo: String
      status: String
    ): Schedule!

    updateSchedule(
      id: ID!
      mainUser: String
      subUser: String
      groom: String
      bride: String
      date: String
      time: String
      userArrivalTime: String
      location: String
      venue: String
      memo: String
      status: String
    ): Schedule!

    confirmSchedules(scheduleIds: [ID!]!): ConfirmSchedulesResult!

    deleteSchedule(id: ID!): Boolean!
  }

  type ConfirmSchedulesResult {
    success: Boolean!
    updatedCount: Int!
  }
`;

export const resolvers = {
  Query: {
    schedules: async (parent, { date, status }, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      // 필터 조건 구성
      const filters = {};
      if (date) filters.date = date;
      if (status) filters.status = status;
      // status가 없으면 assigned 또는 confirmed 상태만 조회
      if (!status) {
        filters.status = { $in: ['assigned', 'confirmed'] };
      }

      // 파트별 쿼리 생성
      const { query } = await buildPartScheduleQuery(
        context.user.adminPart,
        filters
      );

      const schedules = await Schedule.find(query).sort({ time: 1 });

      // 각 스케줄에 대한 User 이름 및 Report memo 가져오기
      const schedulesWithUserNames = await Promise.all(
        schedules.map(async (schedule) => {
          const mainUserDoc = await User.findOne({ id: schedule.mainUser });
          const subUserDoc = schedule.subUser
            ? await User.findOne({ id: schedule.subUser })
            : null;

          // Schedule에 연결된 Report의 memo 및 status 가져오기
          // mainUser와 subUser의 Report memo와 status를 각각 찾음
          const reports = await Report.find({ scheduleId: schedule.id });

          let mainUserMemo = null;
          let subUserMemo = null;
          let mainUserReportStatus = null;
          let subUserReportStatus = null;

          if (reports.length > 0) {
            // MAIN role을 가진 Report 찾기
            const mainReport = reports.find((r) => r.role === 'MAIN');
            if (mainReport) {
              mainUserReportStatus = mainReport.status;
              if (mainReport.memo) {
                mainUserMemo = mainReport.memo;
              }
            }

            // SUB role을 가진 Report 찾기
            const subReport = reports.find((r) => r.role === 'SUB');
            if (subReport) {
              subUserReportStatus = subReport.status;
              if (subReport.memo) {
                subUserMemo = subReport.memo;
              }
            }
          }

          return {
            ...schedule.toObject(),
            mainUser: mainUserDoc?.name || schedule.mainUser || '-',
            subUser: subUserDoc?.name || schedule.subUser || '-',
            memo: schedule.memo || null,
            mainUserMemo: mainUserMemo || null,
            subUserMemo: subUserMemo || null,
            mainUserReportStatus: mainUserReportStatus || null,
            subUserReportStatus: subUserReportStatus || null,
          };
        })
      );

      return schedulesWithUserNames;
    },

    schedulesList: async (parent, args, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      // 오늘 날짜 계산 (YYYY-MM-DD 형식)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDateString = `${year}-${month}-${day}`;

      // 파트별 유저 ID 목록 가져오기 : 아이폰스냅,포토그래퍼등 해당 파트에 속한 유저들만 조회
      const partUserIds = await getPartUserIds(context.user.adminPart);

      // 파트별 스케줄을 최신 생성 순으로 조회
      // mainUser나 subUser가 파트에 속한 스케줄 (모든 status) 또는 미배정(unassigned) 상태인 스케줄
      // 오늘 날짜 이상의 스케줄만 조회
      const schedules = await Schedule.find({
        $and: [
          {
            $or: [
              { mainUser: { $in: partUserIds } },
              { subUser: { $in: partUserIds } },
              { status: 'unassigned' }, // 미배정 상태의 스케줄도 포함 (메인유저와 서브유저가 없기)
            ],
          },
          { date: { $gte: todayDateString } }, // 오늘 날짜 이상
        ],
      }).sort({ createdAt: -1 });

      // 각 스케줄에 대한 User 이름 및 Report memo 가져오기
      const schedulesWithUserNames = await Promise.all(
        schedules.map(async (schedule) => {
          const mainUserDoc = await User.findOne({ id: schedule.mainUser });
          const subUserDoc = schedule.subUser
            ? await User.findOne({ id: schedule.subUser })
            : null;

          // Schedule에 연결된 Report의 memo 및 status 가져오기
          // mainUser와 subUser의 Report memo와 status를 각각 찾음
          const reports = await Report.find({ scheduleId: schedule.id });

          let mainUserMemo = null;
          let subUserMemo = null;
          let mainUserReportStatus = null;
          let subUserReportStatus = null;

          if (reports.length > 0) {
            // MAIN role을 가진 Report 찾기
            const mainReport = reports.find((r) => r.role === 'MAIN');
            if (mainReport) {
              mainUserReportStatus = mainReport.status;
              if (mainReport.memo) {
                mainUserMemo = mainReport.memo;
              }
            }

            // SUB role을 가진 Report 찾기
            const subReport = reports.find((r) => r.role === 'SUB');
            if (subReport) {
              subUserReportStatus = subReport.status;
              if (subReport.memo) {
                subUserMemo = subReport.memo;
              }
            }
          }

          // UserConfirm 데이터 조회
          let mainUserConfirmed = false;
          let subUserConfirmed = false;

          if (schedule.mainUser) {
            const mainUserConfirm = await UserConfirm.findOne({
              scheduleId: schedule.id,
              userId: schedule.mainUser,
            });
            mainUserConfirmed = mainUserConfirm?.confirmed === true;
          }

          if (schedule.subUser) {
            const subUserConfirm = await UserConfirm.findOne({
              scheduleId: schedule.id,
              userId: schedule.subUser,
            });
            subUserConfirmed = subUserConfirm?.confirmed === true;
          }

          return {
            ...schedule.toObject(),
            mainUser: mainUserDoc?.name || schedule.mainUser || '-',
            subUser: subUserDoc?.name || schedule.subUser || '-',
            memo: schedule.memo || null,
            mainUserMemo: mainUserMemo || null,
            subUserMemo: subUserMemo || null,
            mainUserReportStatus: mainUserReportStatus || null,
            subUserReportStatus: subUserReportStatus || null,
            mainUserConfirmed: mainUserConfirmed || false,
            subUserConfirmed: subUserConfirmed || false,
          };
        })
      );

      return schedulesWithUserNames;
    },

    schedulesHistory: async (parent, args, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      // 오늘 날짜 계산 (YYYY-MM-DD 형식)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDateString = `${year}-${month}-${day}`;

      // 파트별 유저 ID 목록 가져오기
      const partUserIds = await getPartUserIds(context.user.adminPart);

      // 오늘 이전의 스케줄만 조회
      const schedules = await Schedule.find({
        $and: [
          {
            $or: [
              { mainUser: { $in: partUserIds } },
              { subUser: { $in: partUserIds } },
              { status: 'unassigned' },
            ],
          },
          { date: { $lt: todayDateString } }, // 오늘 날짜 이전
        ],
      }).sort({ createdAt: -1 });

      // 각 스케줄에 대한 User 이름 및 Report memo 가져오기
      const schedulesWithUserNames = await Promise.all(
        schedules.map(async (schedule) => {
          const mainUserDoc = await User.findOne({ id: schedule.mainUser });
          const subUserDoc = schedule.subUser
            ? await User.findOne({ id: schedule.subUser })
            : null;

          // Schedule에 연결된 Report의 memo 및 status 가져오기
          const reports = await Report.find({ scheduleId: schedule.id });

          let mainUserMemo = null;
          let subUserMemo = null;
          let mainUserReportStatus = null;
          let subUserReportStatus = null;

          if (reports.length > 0) {
            // MAIN role을 가진 Report 찾기
            const mainReport = reports.find((r) => r.role === 'MAIN');
            if (mainReport) {
              mainUserReportStatus = mainReport.status;
              if (mainReport.memo) {
                mainUserMemo = mainReport.memo;
              }
            }

            // SUB role을 가진 Report 찾기
            const subReport = reports.find((r) => r.role === 'SUB');
            if (subReport) {
              subUserReportStatus = subReport.status;
              if (subReport.memo) {
                subUserMemo = subReport.memo;
              }
            }
          }

          return {
            ...schedule.toObject(),
            mainUser: mainUserDoc?.name || schedule.mainUser || '-',
            subUser: subUserDoc?.name || schedule.subUser || '-',
            memo: schedule.memo || null,
            mainUserMemo: mainUserMemo || null,
            subUserMemo: subUserMemo || null,
            mainUserReportStatus: mainUserReportStatus || null,
            subUserReportStatus: subUserReportStatus || null,
          };
        })
      );

      return schedulesWithUserNames;
    },

    schedule: async (parent, { id }, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      const schedule = await Schedule.findOne({ id });
      if (!schedule) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }

      // 파트별 권한 확인
      const partUserIds = await getPartUserIds(context.user.adminPart);
      if (
        !partUserIds.includes(schedule.mainUser) &&
        !partUserIds.includes(schedule.subUser)
      ) {
        throw new Error('권한이 없습니다.');
      }

      return schedule;
    },
  },

  Mutation: {
    createSchedule: async (
      parent,
      {
        mainUser,
        subUser,
        groom,
        bride,
        date,
        time,
        userArrivalTime,
        location,
        venue,
        memo,
        status = 'unassigned',
      },
      context
    ) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }
      await connectToDatabase();

      return Schedule.create({
        mainUser,
        subUser: subUser || '',
        groom,
        bride,
        date,
        time,
        userArrivalTime,
        location,
        venue,
        memo,
        status,
      });
    },

    updateSchedule: async (parent, { id, ...updates }, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      const schedule = await Schedule.findOne({ id });
      if (!schedule) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }

      Object.assign(schedule, updates);
      return schedule.save();
    },

    confirmSchedules: async (parent, { scheduleIds }, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      if (!scheduleIds?.length) {
        throw new Error('스케줄 ID 배열이 필요합니다.');
      }

      const partUserIds = await getPartUserIds(context.user.adminPart);
      const schedules = await Schedule.find({ id: { $in: scheduleIds } });

      if (!schedules.length) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }

      // 권한이 있는 스케줄 중 assigned 상태인 것만 업데이트
      const validSchedules = schedules.filter(
        (s) =>
          (partUserIds.includes(s.mainUser) ||
            partUserIds.includes(s.subUser)) &&
          s.status === 'assigned'
      );

      await Schedule.updateMany(
        { id: { $in: validSchedules.map((s) => s.id) } },
        { $set: { status: 'confirmed' } }
      );

      return {
        success: true,
        updatedCount: validSchedules.length,
      };
    },

    deleteSchedule: async (parent, { id }, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      const schedule = await Schedule.findOne({ id });
      if (!schedule) {
        return false;
      }

      // 파트별 권한 확인
      const partUserIds = await getPartUserIds(context.user.adminPart);
      if (
        partUserIds.includes(schedule.mainUser) ||
        partUserIds.includes(schedule.subUser)
      ) {
        await Schedule.findOneAndDelete({ id });
        return true;
      }

      return false;
    },
  },
};
