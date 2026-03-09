/**
 * 현재 날짜 기준으로 연도, 월, 주차를 계산합니다.
 * 월요일 시작 기준으로 해당 월의 몇 번째 주인지 계산합니다.
 */
export function getCurrentWeekInfo(): { year: string; month: string; weekNumber: string } {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // 월 첫째 날의 요일 (월요일=0, 화요일=1, ..., 일요일=6)
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  // (현재 일 + 첫째 날의 오프셋) / 7 로 주차 계산
  const weekNumber = Math.ceil((now.getDate() + firstDayOfWeek) / 7);

  return { year, month, weekNumber: `${weekNumber}주차` };
}
