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
    role: String!
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
      role: String
      estimatedTime: String
      currentStep: Int
      memo: String
    ): Report!

    updateReport(
      id: ID!
      status: String
      role: String
      estimatedTime: String
      currentStep: Int
      memo: String
    ): Report!

    deleteReport(id: ID!): Boolean!
  }
`;

export const resolvers = {
  DateTime: DateTimeResolver,
  Report: {
    schedule: (parent) => parent.scheduleId,
    user: (parent) => parent.userId,
  },
  Query: {
    reports: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      return await Report.find({ userId: context.user.id });
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
      if (report.userId !== context.user.id) {
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

      return await Report.find({ scheduleId: scheduleId });
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
      return await Report.find({ userId: userId });
    },
  },

  Mutation: {
    createReport: async (
      parent,
      { scheduleId, status, role, estimatedTime, currentStep = 0, memo },
      context
    ) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();

      // 스케줄 확인 (최신 데이터 조회)
      const schedule = await Schedule.findOne({ id: scheduleId }).lean();
      if (!schedule) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }

      // 관리자 권한이 있거나 본인이 mainUser/subUser인지 확인
      const isAdmin = !!context.user.adminPart;

      // role이 명시적으로 전달된 경우 (확정완료 등) 관리자만 허용
      if (role && !isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      // role 자동 설정 (파라미터로 전달되지 않은 경우)
      let reportRole = role;
      let reportUserId = context.user.id;

      if (!reportRole) {
        if (schedule.mainUser === context.user.id) {
          reportRole = 'MAIN';
        } else if (schedule.subUser === context.user.id) {
          reportRole = 'SUB';
        } else {
          throw new Error('역할을 확인할 수 없습니다.');
        }
      }

      // 관리자가 Report를 생성하는 경우, role에 맞는 userId 사용
      if (isAdmin && role) {
        if (reportRole === 'MAIN') {
          if (
            !schedule.mainUser ||
            schedule.mainUser === '' ||
            schedule.mainUser === null
          ) {
            throw new Error('메인 작가가 스케줄에 배정되지 않았습니다.');
          }
          reportUserId = String(schedule.mainUser);
        } else if (reportRole === 'SUB') {
          if (
            !schedule.subUser ||
            schedule.subUser === '' ||
            schedule.subUser === null
          ) {
            throw new Error('서브 작가가 스케줄에 배정되지 않았습니다.');
          }
          reportUserId = String(schedule.subUser);
        }
      }

      // reportUserId가 설정되지 않았으면 오류
      if (!reportUserId || reportUserId === '' || reportUserId === null) {
        throw new Error('사용자 ID를 확인할 수 없습니다.');
      }

      // 보고 생성
      const report = new Report({
        scheduleId: scheduleId,
        userId: reportUserId,
        role: reportRole,
        status,
        estimatedTime,
        currentStep,
        memo,
      });

      // 스케줄 상태 업데이트 (일반 사용자가 생성하는 경우에만)
      if (!isAdmin) {
        schedule.status = status;
        await schedule.save();
      }

      return await report.save();
    },

    updateReport: async (
      parent,
      { id, status, role, estimatedTime, currentStep, memo },
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
      console.log(context.user);
      // 관리자 권한 확인
      const isAdmin = !!context.user.adminPart;
      if (!isAdmin) {
        throw new Error('권한이 없습니다.');
      }

      if (status) report.status = status;
      if (role) report.role = role;
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
