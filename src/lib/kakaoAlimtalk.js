/**
 * 카카오 알림톡 발송 (스케줄 확정, cron 기상/출발/도착/관리자 지연)
 * 환경변수 설정 후 사용. 미설정 시 로그만 출력.
 *
 * 공통 env: KAKAO_ALIMTALK_API_URL, KAKAO_ALIMTALK_API_KEY,
 *   KAKAO_ALIMTALK_SENDER_KEY, KAKAO_ALIMTALK_SENDER_NO (선택)
 * 템플릿별: KAKAO_ALIMTALK_TEMPLATE_CODE_CONFIRMED, _WAKEUP, _DEPARTURE, _ARRIVAL, _COMPLETED,
 *   _ADMIN_DELAY, _ADMIN_DEPARTURE_DELAY, _ADMIN_ARRIVAL_DELAY
 * 관리자 수신: KAKAO_ALIMTALK_ADMIN_PHONE (쉼표 구분 복수 가능)
 */

/**
 * 공통 알림톡 발송 (템플릿 코드 + 치환 변수)
 * @param {string} phone - 수신 전화번호 (01012345678)
 * @param {string} templateCode - 템플릿 코드
 * @param {Record<string, string>} templateParams - 템플릿 치환 변수
 * @returns {Promise<boolean>} 발송 성공 여부
 */
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

/** 관리자 번호 목록 (env 쉼표 구분) */
function getAdminPhones() {
  const raw = process.env.KAKAO_ALIMTALK_ADMIN_PHONE || '';
  return raw
    .split(',')
    .map((p) => p.trim().replace(/-/g, ''))
    .filter(Boolean);
}

/**
 * 스케줄 확정 완료 시 알림톡 발송 (공통 sendKakaoAlimtalk 사용)
 * @param {string} phone - 수신자 전화번호 (01012345678 형식)
 * @param {string} userName - 수신자 이름
 * @param {{ date: string, time: string, groom: string, bride: string, venue?: string }} scheduleInfo - 스케줄 정보
 */
export async function sendScheduleConfirmedAlimtalk(
  phone,
  userName,
  scheduleInfo,
) {
  const templateCode = 'schedule_confirm';
  if (!templateCode) {
    console.warn(
      '[Kakao Alimtalk] 스케줄 확정 템플릿 미설정 (KAKAO_ALIMTALK_TEMPLATE_CODE_CONFIRMED)',
    );
    return;
  }

  const scheduleLabel = `${scheduleInfo.date} ${scheduleInfo.time} ${scheduleInfo.groom}/${scheduleInfo.bride}`;
  const templateParams = {
    userName: userName || '고객',
    date: scheduleInfo.date,
    time: scheduleInfo.time,
    groom: scheduleInfo.groom,
    bride: scheduleInfo.bride,
    venue: scheduleInfo.venue || '',
    scheduleLabel,
  };

  await sendKakaoAlimtalk(phone, templateCode, templateParams);
}

// ---- Cron 스케줄 알림 (기상/출발/도착/관리자 지연) ----

export async function sendCronWakeupAlimtalk(phone, scheduleLabel) {
  const templateCode = process.env.KAKAO_ALIMTALK_TEMPLATE_WAKEUP;
  if (!templateCode) {
    console.log(
      '[CRON] 기상 알림톡 미설정 (KAKAO_ALIMTALK_TEMPLATE_WAKEUP)',
      phone,
      scheduleLabel,
    );
    return;
  }
  await sendKakaoAlimtalk(phone, templateCode, { scheduleLabel });
}

export async function sendCronDepartureAlimtalk(phone, scheduleLabel) {
  const templateCode = process.env.KAKAO_ALIMTALK_TEMPLATE_DEPARTURE;
  if (!templateCode) {
    console.log(
      '[CRON] 출발 알림톡 미설정 (KAKAO_ALIMTALK_TEMPLATE_DEPARTURE)',
      phone,
      scheduleLabel,
    );
    return;
  }
  await sendKakaoAlimtalk(phone, templateCode, { scheduleLabel });
}

export async function sendCronArrivalAlimtalk(phone, scheduleLabel) {
  const templateCode = process.env.KAKAO_ALIMTALK_TEMPLATE_ARRIVAL;
  if (!templateCode) {
    console.log(
      '[CRON] 도착 알림톡 미설정 (KAKAO_ALIMTALK_TEMPLATE_ARRIVAL)',
      phone,
      scheduleLabel,
    );
    return;
  }
  await sendKakaoAlimtalk(phone, templateCode, { scheduleLabel });
}

/** 종료 알림톡 (예식+1h 시점, 템플릿: KAKAO_ALIMTALK_TEMPLATE_COMPLETED) */
export async function sendCronCompletedAlimtalk(phone, scheduleLabel) {
  const templateCode = process.env.KAKAO_ALIMTALK_TEMPLATE_COMPLETED;
  if (!templateCode) {
    console.log(
      '[CRON] 종료 알림톡 미설정 (KAKAO_ALIMTALK_TEMPLATE_COMPLETED)',
      phone,
      scheduleLabel,
    );
    return;
  }
  await sendKakaoAlimtalk(phone, templateCode, { scheduleLabel });
}

/** 관리자 기상 지연 알림톡 (템플릿: KAKAO_ALIMTALK_TEMPLATE_ADMIN_DELAY) */
export async function sendCronAdminDelayAlimtalk(scheduleLabel, userName) {
  const templateCode = process.env.KAKAO_ALIMTALK_TEMPLATE_ADMIN_DELAY;
  const adminPhones = getAdminPhones();
  if (!templateCode || adminPhones.length === 0) {
    console.log(
      '[CRON] 관리자 기상 지연 알림톡 미설정',
      scheduleLabel,
      userName,
    );
    return;
  }
  const params = { scheduleLabel, userName: userName || '-' };
  for (const phone of adminPhones) {
    await sendKakaoAlimtalk(phone, templateCode, params);
  }
}

/** 관리자 출발 지연 알림톡 (템플릿: KAKAO_ALIMTALK_TEMPLATE_ADMIN_DEPARTURE_DELAY) */
export async function sendCronAdminDepartureDelayAlimtalk(
  scheduleLabel,
  userName,
) {
  const templateCode =
    process.env.KAKAO_ALIMTALK_TEMPLATE_ADMIN_DEPARTURE_DELAY;
  const adminPhones = getAdminPhones();
  if (!templateCode || adminPhones.length === 0) {
    console.log(
      '[CRON] 관리자 출발 지연 알림톡 미설정',
      scheduleLabel,
      userName,
    );
    return;
  }
  const params = { scheduleLabel, userName: userName || '-' };
  for (const phone of adminPhones) {
    await sendKakaoAlimtalk(phone, templateCode, params);
  }
}

export async function sendCronAdminArrivalDelayAlimtalk(
  scheduleLabel,
  userName,
) {
  const templateCode = process.env.KAKAO_ALIMTALK_TEMPLATE_ADMIN_ARRIVAL_DELAY;
  const adminPhones = getAdminPhones();
  if (!templateCode || adminPhones.length === 0) {
    console.log(
      '[CRON] 관리자 도착 지연 알림톡 미설정',
      scheduleLabel,
      userName,
    );
    return;
  }
  const params = { scheduleLabel, userName: userName || '-' };
  for (const phone of adminPhones) {
    await sendKakaoAlimtalk(phone, templateCode, params);
  }
}
