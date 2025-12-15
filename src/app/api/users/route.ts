import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import UserModel from '../db/models/User';
import { connectToDatabase } from '../db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 어드민 파트별 필터링
    if (!session.user.adminPart) {
      return NextResponse.json(
        { error: '어드민 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 자신의 파트에 해당하는 유저만 조회 (어드민 제외)
    const query = {
      role: session.user.adminPart, // VIDEOGRAPHER, PHOTOGRAPHER, IPHONESNAPPER 중 하나
    };

    const users = await UserModel.find(query).sort({ createdAt: -1 });

    // 날짜를 문자열로 변환
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      gender: user.gender || null,
      role: user.role,
      address: user.address || null,
      mainLocation: user.mainLocation || null,
      hasVehicle: user.hasVehicle || false,
      startDate: user.startDate?.toISOString() || null,
      birthDate: user.birthDate?.toISOString() || null,
      status: user.status || null,
      memo: user.memo || null,
      createdAt: user.createdAt?.toISOString() || null,
      updatedAt: user.updatedAt?.toISOString() || null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('사용자 가져오기 오류:', error);
    return NextResponse.json(
      { error: '사용자를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

