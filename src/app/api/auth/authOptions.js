import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyUserCredentials } from '../db/handlers/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        name: { label: '이름', type: 'text' },
        phone: { label: '전화번호', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phone || !credentials?.name) {
            throw new Error('이름과 전화번호를 입력해주세요.');
          }

          // User 존재 여부 및 인증 확인
          const result = await verifyUserCredentials(
            credentials.phone,
            credentials.name
          );
          console.log(`result: ${result}`);
          if (!result.success) {
            throw new Error(result.error);
          }

          return {
            id: result.user.id,
            name: result.user.name,
            phone: result.user.phone,
            role: result.user.role,
          };
        } catch (error) {
          console.error('인증 오류:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
