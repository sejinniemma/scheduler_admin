// 카카오 알림톡 발송
// @param {string} phone - 수신자 전화번호
// @param {string} templateCode - 템플릿 코드
// @param {Object} templateParams - 템플릿 치환 변수
// @returns {Promise<boolean>} 발송 성공 여부
export async function sendKakaoAlimtalk(
  phone,
  templateCode,
  templateParams = {},
) {
  const apiUrl = process.env.KAKAO_ALIMTALK_API_URL;
  const apiKey = process.env.KAKAO_ALIMTALK_API_KEY;

  if (!apiUrl || !apiKey || !templateCode) {
    console.warn('[Kakao Alimtalk] 설정 부족', {
      hasUrl: !!apiUrl,
      hasKey: !!apiKey,
      templateCode,
    });
    return false;
  }

  if (!phone) return false;

  const phoneNumber = phone.startsWith('0')
    ? `82${phone.replace(/-/g, '').slice(1)}`
    : phone.replace(/-/g, '');

  try {
    const body = {
      message_type: 'AT',
      phone_number: phoneNumber,
      template_code: templateCode,
      template_params: templateParams,
      sender_key: process.env.KAKAO_ALIMTALK_SENDER_KEY,
      sender_no: process.env.KAKAO_ALIMTALK_SENDER_NO,
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        '[Kakao Alimtalk] 발송 실패',
        res.status,
        templateCode,
        text,
      );
      return false;
    }
    console.log('[Kakao Alimtalk] 발송 완료', templateCode, phone);
    return true;
  } catch (err) {
    console.error('[Kakao Alimtalk] 발송 오류', templateCode, err);
    return false;
  }
}

// 일정확정요청안내 알림톡 발송 (어드민에서 발송)
export async function sendScheduleConfirmRequestAlimtalk(
  phone,
  userName,
  scheduleInfo,
) {
  const templateCode = 'schedule_req';
  if (!templateCode) {
    console.warn(
      '[Kakao Alimtalk] 일정확정요청안내 템플릿 미설정 (KAKAO_ALIMTALK_TEMPLATE_CONFIRM_REQUEST)',
    );
    return;
  }

  const scheduleLabel = `${scheduleInfo.date} ${scheduleInfo.time} ${scheduleInfo.groom}/${scheduleInfo.bride}`;
  const templateParams = {
    userName: userName || '작가',
    date: scheduleInfo.date,
    time: scheduleInfo.time,
    groom: scheduleInfo.groom,
    bride: scheduleInfo.bride,
    venue: scheduleInfo.venue || '',
    scheduleLabel,
  };

  await sendKakaoAlimtalk(phone, templateCode, templateParams);
}
