import { gql } from '@apollo/client';
import User from '../models/User';
import { connectToDatabase } from '../mongodb';

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    name: String!
    phone: String!
    role: String!
    gender: String
    address: String
    mainLocation: String
    hasVehicle: Boolean
    startDate: DateTime
    birthDate: DateTime
    status: String
    memo: String
    createdAt: DateTime
    updatedAt: DateTime
  }

  type Query {
    me: User
    users: [User!]!
  }

  type Mutation {
    createUser(
      name: String!
      phone: String!
      address: String
      mainLocation: String
      startDate: DateTime!
      role: String
      hasVehicle: Boolean
      birthDate: DateTime
      gender: String
      status: String
      memo: String
    ): User!

    updateUser(
      id: ID!
      name: String
      phone: String
      address: String
      mainLocation: String
      hasVehicle: Boolean
      startDate: DateTime
      gender: String
      status: String
      memo: String
    ): User!
    deleteUser(id: ID!): Boolean!
  }
`;

export const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      return await User.findOne({ id: context.user.id });
    },

    users: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      return await User.find({});
    },
  },

  Mutation: {
    createUser: async (
      parent,
      {
        name,
        phone,
        address,
        mainLocation,
        startDate,
        role = 'PHOTOGRAPHER',
        hasVehicle = false,
        birthDate,
        gender,
        status,
        memo,
      },
      context
    ) => {
      // if (!context.user || context.user.role !== 'ADMIN') {
      //   throw new Error('관리자 권한이 필요합니다.');
      // }
      await connectToDatabase();
      const user = new User({
        name,
        phone,
        address,
        mainLocation,
        startDate,
        role,
        hasVehicle,
        birthDate,
        gender,
        status,
        memo,
      });
      return await user.save();
    },

    updateUser: async (
      parent,
      {
        id,
        name,
        phone,
        address,
        mainLocation,
        hasVehicle,
        startDate,
        birthDate,
        gender,
        status,
        memo,
      },
      context
    ) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }
      await connectToDatabase();
      const user = await User.findOne({ id });
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      // 본인 또는 관리자만 수정 가능
      if (user.id !== context.user.id && context.user.role !== 'ADMIN') {
        throw new Error('권한이 없습니다.');
      }
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (mainLocation) user.mainLocation = mainLocation;
      if (hasVehicle !== undefined) user.hasVehicle = hasVehicle;
      if (startDate) user.startDate = startDate;
      if (birthDate) user.birthDate = birthDate;
      if (gender) user.gender = gender;
      if (status) user.status = status;
      if (memo) user.memo = memo;
      return await user.save();
    },

    deleteUser: async (parent, { id }, context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }
      await connectToDatabase();
      const user = await User.findOne({ id });
      if (user) {
        await User.findOneAndDelete({ id });
        return true;
      }
      return false;
    },
  },
};

/**
 * 전화번호로 User 존재 여부 확인
 * @param {string} phone - 전화번호
 * @returns {Promise<boolean>} User 존재 여부
 */
export async function checkUserExistsByPhone(phone) {
  try {
    await connectToDatabase();
    const user = await User.findOne({ phone });
    return !!user;
  } catch (error) {
    console.error('User 존재 여부 확인 오류:', error);
    return false;
  }
}

/**
 * 전화번호와 이름으로 User 찾기
 * @param {string} phone - 전화번호
 * @param {string} name - 이름 (선택사항)
 * @returns {Promise<Object|null>} User 객체 또는 null
 */
export async function findUserByPhone(phone, name = null) {
  try {
    await connectToDatabase();
    const query = { phone };
    if (name) {
      query.name = name;
    }
    const user = await User.findOne(query);
    return user;
  } catch (error) {
    console.error('User 찾기 오류:', error);
    return null;
  }
}

/**
 * User ID로 User 찾기
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User 객체 또는 null
 */
export async function findUserById(id) {
  try {
    await connectToDatabase();
    const user = await User.findOne({ id });
    return user;
  } catch (error) {
    console.error('User 찾기 오류:', error);
    return null;
  }
}

/**
 * 전화번호와 이름으로 User 인증 확인
 * @param {string} phone - 전화번호
 * @param {string} name - 이름
 * @returns {Promise<{success: boolean, user: Object|null, error: string|null}>}
 */
export async function verifyUserCredentials(phone, name) {
  try {
    await connectToDatabase();

    // 전화번호로 User 찾기
    const user = await User.findOne({ phone });

    if (!user) {
      return {
        success: false,
        user: null,
        error: '사용자를 찾을 수 없습니다.',
      };
    }

    // 이름 일치 확인
    if (user.name !== name) {
      return {
        success: false,
        user: null,
        error: '이름이 일치하지 않습니다.',
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        mainLocation: user.mainLocation,
        hasVehicle: user.hasVehicle,
        startDate: user.startDate,
      },
      error: null,
    };
  } catch (error) {
    console.error('User 인증 확인 오류:', error);
    return {
      success: false,
      user: null,
      error: '서버 오류가 발생했습니다.',
    };
  }
}
