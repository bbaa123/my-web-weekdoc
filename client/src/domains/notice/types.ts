/**
 * Notice 도메인 타입 정의
 */

export interface Notice {
  notice_id: number;
  id: string;
  content: string;
  start_at: string | null;
  end_at: string | null;
}

export interface NoticeCreate {
  content: string;
  start_at: string | null;
  end_at: string | null;
}
