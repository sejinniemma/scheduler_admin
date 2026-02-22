/**
 * 카카오 BizM(비즈메시지) 알림톡 발송
 * API: POST https://{base_url}/v2/send/kakao (BizM 공식 스펙)
 *
 * 환경변수: KAKAO_ALIMTALK_API_URL, KAKAO_ALIMTALK_API_KEY,
 *   KAKAO_ALIMTALK_SENDER_KEY, KAKAO_ALIMTALK_SENDER_NO
 *   KAKAO_ALIMTALK_TEMPLATE_CONFIRM_REQUEST (일정확정요청안내 템플릿 코드)
 */

/**
 * BizM(카카오 비즈메시지) 알림톡 발송
 * API: POST {base_url}/v2/send/kakao
 * @param {string} phone - 수신자 전화번호 (01012345678)
 * @param {string} templateCode - 등록된 템플릿 코드
 * @param {string} message - 수신자에게 전달할 알림톡 메시지 (치환 완료된 최종 문구, 1000자 이하)
 * @param {{ fall_back_yn?: boolean, cid?: string }} options - fall_back_yn: 대체메시지 전송 여부(기본 false), cid: 고객사 정의 Key ID(미지정 시 자동 생성)
 * @returns {Promise<boolean>} 발송 성공 여부
 */
export async function sendKakaoAlimtalk(
  phone,
  templateCode,
  message,
  options = {},
) {
  const apiUrl = process.env.KAKAO_ALIMTALK_API_URL;
  const apiKey = process.env.KAKAO_ALIMTALK_API_KEY;
  const senderKey = process.env.KAKAO_ALIMTALK_SENDER_KEY;
  const senderNo = process.env.KAKAO_ALIMTALK_SENDER_NO;

  if (!apiUrl || !apiKey || !templateCode) {
    console.warn('[Kakao BizM] 설정 부족', {
      hasUrl: !!apiUrl,
      hasKey: !!apiKey,
      templateCode,
    });
    return false;
  }

  if (!phone) return false;
  if (!message || typeof message !== 'string') {
    console.warn('[Kakao BizM] message 필수');
    return false;
  }

  const phoneNumber = phone.startsWith('0')
    ? `82${phone.replace(/-/g, '').slice(1)}`
    : phone.replace(/-/g, '');

  const { fall_back_yn = false, cid } = options;
  const cidValue =
    cid || `at_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  try {
    /** BizM 알림톡 발송 Request Body */
    const body = {
      message_type: 'AT',
      sender_key: senderKey,
      cid: cidValue,
      template_code: templateCode,
      phone_number: phoneNumber,
      sender_no: senderNo,
      message: message.slice(0, 1000),
      fall_back_yn,
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        authorization: apiKey.startsWith('Bearer')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Kakao BizM] 발송 실패', res.status, templateCode, text);
      return false;
    }
    const data = await res.json().catch(() => ({}));
    if (data?.code !== '200' && data?.code !== 200) {
      console.error('[Kakao BizM] 발송 결과 오류', data);
      return false;
    }
    console.log('[Kakao BizM] 발송 완료', templateCode, phone);
    return true;
  } catch (err) {
    console.error('[Kakao BizM] 발송 오류', templateCode, err);
    return false;
  }
}

/**
 * 일정확정요청안내 알림톡 발송 (어드민 배정 시)
 * env: KAKAO_ALIMTALK_TEMPLATE_CONFIRM_REQUEST
 */
export async function sendScheduleConfirmRequestAlimtalk(
  phone,
  userName,
  scheduleInfo,
) {
  const templateCode = 'schedule_req';
  if (!templateCode) {
    console.warn(
      '[Kakao BizM] 일정확정요청안내 템플릿 미설정 (KAKAO_ALIMTALK_TEMPLATE_CONFIRM_REQUEST)',
    );
    return;
  }

  const name = userName || '작가';
  const { date, time, groom, bride, venue = '' } = scheduleInfo;
  const venueText = venue ? `\n장소: ${venue}` : '';
  const message = `${name}님, 일정 확정 요청 안내입니다.\n일정: ${date} ${time}\n예식: ${groom} / ${bride}${venueText}`;

  await sendKakaoAlimtalk(phone, templateCode, message);
}
