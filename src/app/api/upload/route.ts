import { getServerSession, type NextAuthOptions } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { NextResponse } from 'next/server';

// 업로드 상태 확인용 GET 핸들러
export async function GET() {
  // 인증 확인
  const session = await getServerSession(authOptions as NextAuthOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  // Cloudinary 설정 여부 확인
  const ready =
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET;

  if (!ready) {
    return NextResponse.json(
      { status: 'not_ready', error: 'Cloudinary env 미설정' },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: 'ready' });
}
