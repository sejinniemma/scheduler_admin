import Schedule from '../models/Schedule';
import { connectToDatabase } from '../mongodb';
import { gql } from '@apollo/client';

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
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();

      // 기본 쿼리: 로그인한 사용자가 mainUser 또는 subUser인 스케줄만 조회
      const query = {
        $or: [{ mainUser: context.user.id }, { subUser: context.user.id }],
      };

      // 필터 추가
      if (date) {
        query.date = date;
      }
      if (subStatus) {
        query.subStatus = subStatus;
      } else {
        // subStatus가 없으면 assigned와 completed만 가져오기
        query.subStatus = { $in: ['assigned', 'completed'] };
      }
      if (status) {
        query.status = status;
      }

      const schedules = await Schedule.find(query);

      // time 기준 정렬 (더 빠른 시간이 앞에)
      return schedules.sort((a, b) => a.time.localeCompare(b.time));
    },

    schedule: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const schedule = await Schedule.findOne({ id });
      if (!schedule) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }
      // 본인이 mainUser 또는 subUser인지 확인
      if (
        schedule.mainUser !== context.user.id &&
        schedule.subUser !== context.user.id
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
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const schedule = new Schedule({
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
      return await schedule.save();
    },

    updateSchedule: async (parent, { id, ...updates }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const schedule = await Schedule.findOne({ id });
      if (!schedule) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }
      // 본인이 mainUser 또는 subUser인지 확인
      if (
        schedule.mainUser !== context.user.id &&
        schedule.subUser !== context.user.id
      ) {
        throw new Error('권한이 없습니다.');
      }
      Object.assign(schedule, updates);
      return await schedule.save();
    },

    confirmSchedules: async (parent, { scheduleIds }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();

      if (!scheduleIds || scheduleIds.length === 0) {
        throw new Error('스케줄 ID 배열이 필요합니다.');
      }

      // 모든 스케줄을 찾아서 권한 확인 및 업데이트
      const schedules = await Schedule.find({ id: { $in: scheduleIds } });

      if (schedules.length === 0) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }

      // 권한 확인 및 업데이트 (assigned인 것만)
      let updatedCount = 0;
      for (const schedule of schedules) {
        // 본인이 mainUser 또는 subUser인지 확인
        if (
          schedule.mainUser !== context.user.id &&
          schedule.subUser !== context.user.id
        ) {
          continue; // 권한이 없는 스케줄은 건너뛰기
        }

        // subStatus가 'assigned'인 것만 업데이트
        if (schedule.subStatus === 'assigned') {
          schedule.subStatus = 'completed';
          await schedule.save();
          updatedCount++;
        }
      }

      return {
        success: true,
        updatedCount,
      };
    },

    deleteSchedule: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const schedule = await Schedule.findOne({ id });
      if (!schedule) {
        return false;
      }
      // 본인이 mainUser 또는 subUser인지 확인
      if (
        schedule.mainUser === context.user.id ||
        schedule.subUser === context.user.id
      ) {
        await Schedule.findOneAndDelete({ id });
        return true;
      }
      return false;
    },
  },
};
