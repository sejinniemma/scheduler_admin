import Schedule from '../models/Schedule';
import User from '../models/User';
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
    mainUser: ID!
    subUser: ID!
    groom: String!
    bride: String!
    date: String!
    time: String!
    location: String
    venue: String
    memo: String
    status: String!
    subStatus: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    schedules(date: String, subStatus: String, status: String): [Schedule!]!
    schedule(id: ID!): Schedule
  }

  type Mutation {
    createSchedule(
      mainUser: ID!
      subUser: ID!
      groom: String!
      bride: String!
      date: String!
      time: String!
      location: String
      venue: String
      memo: String
      status: String
      subStatus: String
    ): Schedule!

    updateSchedule(
      id: ID!
      mainUser: ID
      subUser: ID
      groom: String
      bride: String
      date: String
      time: String
      location: String
      venue: String
      memo: String
      status: String
      subStatus: String
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
    schedules: async (parent, { date, subStatus, status }, context) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      // 필터 조건 구성
      const filters = {};
      if (date) filters.date = date;
      if (status) filters.status = status;
      filters.subStatus = subStatus || { $in: ['assigned', 'completed'] };

      // 파트별 쿼리 생성
      const { query } = await buildPartScheduleQuery(
        context.user.adminPart,
        filters
      );

      return Schedule.find(query).sort({ time: 1 });
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
        location,
        venue,
        memo,
        status = 'pending',
        subStatus = 'unassigned',
      },
      context
    ) => {
      if (!context.user?.adminPart) {
        throw new Error('어드민 권한이 필요합니다.');
      }

      return Schedule.create({
        mainUser,
        subUser,
        groom,
        bride,
        date,
        time,
        location,
        venue,
        memo,
        status,
        subStatus,
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

      // 파트별 권한 확인
      const partUserIds = await getPartUserIds(context.user.adminPart);
      if (
        !partUserIds.includes(schedule.mainUser) &&
        !partUserIds.includes(schedule.subUser)
      ) {
        throw new Error('권한이 없습니다.');
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
          s.subStatus === 'assigned'
      );

      await Schedule.updateMany(
        { id: { $in: validSchedules.map((s) => s.id) } },
        { $set: { subStatus: 'completed' } }
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
