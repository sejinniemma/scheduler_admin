import Report from '../models/Report';
import Schedule from '../models/Schedule';
import { connectToDatabase } from '../mongodb';
import { gql } from '@apollo/client';
import { DateTimeResolver } from 'graphql-scalars';

export const typeDefs = gql`
  scalar DateTime

  type Report {
    id: ID!
    schedule: ID!
    user: ID!
    status: String!
    estimatedTime: String
    currentStep: Int!
    memo: String
    reportedAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    reports: [Report!]!
    report(id: ID!): Report
    reportsBySchedule(scheduleId: ID!): [Report!]!
    reportsByUser(userId: ID!): [Report!]!
  }

  type Mutation {
    createReport(
      scheduleId: ID!
      status: String!
      estimatedTime: String
      currentStep: Int
      memo: String
    ): Report!

    updateReport(
      id: ID!
      status: String
      estimatedTime: String
      currentStep: Int
      memo: String
    ): Report!

    deleteReport(id: ID!): Boolean!
  }
`;

export const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    reports: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      return await Report.find({ user: context.user.id });
    },

    report: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const report = await Report.findOne({ id });
      if (!report) {
        throw new Error('보고를 찾을 수 없습니다.');
      }
      // 본인의 보고인지 확인
      if (report.user.toString() !== context.user.id) {
        throw new Error('권한이 없습니다.');
      }
      return report;
    },

    reportsBySchedule: async (parent, { scheduleId }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      // 스케줄이 본인 것인지 확인
      const schedule = await Schedule.findOne({ id: scheduleId });
      if (!schedule) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }
      if (
        schedule.mainUser !== context.user.id &&
        schedule.subUser !== context.user.id
      ) {
        throw new Error('권한이 없습니다.');
      }
      return await Report.find({ schedule: schedule._id });
    },

    reportsByUser: async (parent, { userId }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      // 본인의 보고만 조회 가능
      if (userId !== context.user.id) {
        throw new Error('권한이 없습니다.');
      }
      return await Report.find({ user: userId });
    },
  },

  Mutation: {
    createReport: async (
      parent,
      { scheduleId, status, estimatedTime, currentStep = 0, memo },
      context
    ) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();

      // 스케줄 확인
      const schedule = await Schedule.findOne({ id: scheduleId });
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

      // 보고 생성
      const report = new Report({
        schedule: schedule._id,
        user: context.user.id,
        status,
        estimatedTime,
        currentStep,
        memo,
      });

      // 스케줄 상태 업데이트
      schedule.status = status;
      await schedule.save();

      return await report.save();
    },

    updateReport: async (
      parent,
      { id, status, estimatedTime, currentStep, memo },
      context
    ) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const report = await Report.findOne({ id });
      if (!report) {
        throw new Error('보고를 찾을 수 없습니다.');
      }
      // 본인의 보고인지 확인
      if (report.user.toString() !== context.user.id) {
        throw new Error('권한이 없습니다.');
      }
      if (status) report.status = status;
      if (estimatedTime !== undefined) report.estimatedTime = estimatedTime;
      if (currentStep !== undefined) report.currentStep = currentStep;
      if (memo !== undefined) report.memo = memo;
      return await report.save();
    },

    deleteReport: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const report = await Report.findOne({ id });
      if (!report) {
        return false;
      }
      // 본인의 보고인지 확인
      if (report.user.toString() === context.user.id) {
        await Report.findOneAndDelete({ id });
        return true;
      }
      return false;
    },
  },
};
