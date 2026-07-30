const HOSPITAL_TIME_ZONE = 'Asia/Seoul';

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatHospitalTime(value: string | null | undefined) {
  const date = parseDate(value);

  if (!date) {
    return '확인 시각 정보 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: HOSPITAL_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatHospitalSchedule(value: string) {
  const date = parseDate(value);

  if (!date) {
    return '예정 시각 정보 없음';
  }

  const schedule = new Intl.DateTimeFormat('ko-KR', {
    timeZone: HOSPITAL_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return `${schedule} 예정`;
}
