export async function sendKakaoAlimtalk(
  phone,
  templateCode,
  templateParams = {},
) {
  const apiUrl = process.env.KAKAO_ALIMTALK_API_URL;
  const apiKey = process.env.KAKAO_ALIMTALK_API_KEY;
  const senderKey = process.env.KAKAO_ALIMTALK_SENDER_KEY;

  if (!apiUrl || !apiKey || !senderKey || !templateCode) {
    console.warn('[Kakao Alimtalk] 설정 부족', {
      hasUrl: !!apiUrl,
      hasKey: !!apiKey,
      hasSenderKey: !!senderKey,
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
      sender_key: senderKey,
      template_code: templateCode,
      receiver_list: [
        {
          receiver_num: phoneNumber,
          template_params: templateParams,
        },
      ],
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(
        '[Kakao Alimtalk] 발송 실패',
        res.status,
        templateCode,
        data,
      );
      return false;
    }

    console.log('[Kakao Alimtalk] 발송 완료', templateCode, phone, data);
    return true;
  } catch (err) {
    console.error('[Kakao Alimtalk] 발송 오류', templateCode, err);
    return false;
  }
}

export async function sendScheduleConfirmRequestAlimtalk(
  scheduleLabel,
  userName,
) {
  const templateCode = 'schedule_req';
  const adminPhones = getAdminPhones();
  if (!templateCode || adminPhones.length === 0) {
    console.warn(
      '[CRON] 관리자 도착 지연 알림톡 미설정',
      scheduleLabel,
      userName,
    );
    return false;
  }
  const templateParams = { scheduleLabel, userName: userName || '-' };
  let ok = true;
  for (const phone of adminPhones) {
    const result = await sendKakaoAlimtalk(phone, templateCode, templateParams);
    if (!result) ok = false;
  }
  return ok;
}

/** 관리자 번호 목록 (env 쉼표 구분) */
function getAdminPhones() {
  const raw = process.env.KAKAO_ALIMTALK_ADMIN_PHONE || '';
  return raw
    .split(',')
    .map((p) => p.trim().replace(/-/g, ''))
    .filter(Boolean);
}
