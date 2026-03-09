/**
 * 현재 날짜 기준으로 연도, 월, 주차를 계산합니다.
 * 월요일 시작 기준으로 해당 월의 몇 번째 주인지 계산합니다.
 * 첫 번째 월요일 이전 날짜는 1주차, 이후는 월요일 기준으로 주차를 계산합니다.
 */
export function getCurrentWeekInfo(): { year: string; month: string; weekNumber: string } {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const dayOfMonth = now.getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay(); // 0=일, 1=월, ..., 6=토

  // 이 달의 첫 번째 월요일까지의 오프셋 (월요일이면 0)
  const daysToFirstMonday = firstDayOfWeek === 1 ? 0 : (8 - firstDayOfWeek) % 7;
  const firstMondayDate = 1 + daysToFirstMonday;

  // 첫 번째 월요일 이전 날짜는 1주차로 처리
  let weekNumber: number;
  if (dayOfMonth < firstMondayDate) {
    weekNumber = 1;
  } else {
    weekNumber = Math.min(Math.floor((dayOfMonth - firstMondayDate) / 7) + 1, 5);
  }

  return { year, month, weekNumber: `${weekNumber}주차` };
}
