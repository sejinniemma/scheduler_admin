import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    phone: string;
    adminPart?: string | null; // VIDEOGRAPHER, PHOTOGRAPHER, IPHONESNAPPER 중 하나 또는 null
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
      phone: string;
      adminPart?: string | null; // 어드민 파트 정보
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    phone: string;
    adminPart?: string | null; // 어드민 파트 정보
  }
}
