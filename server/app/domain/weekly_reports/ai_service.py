"""
WeeklyReport AI Service - AI 요약 및 가이드 기능 (Google Gemini 사용)
"""

import time

import google.generativeai as genai
from fastapi import HTTPException

from server.app.core.config import settings

# 무료 티어 rate limit 대응: 최대 재시도 횟수 및 대기 시간
_MAX_RETRIES = 3
_RETRY_DELAYS = [2, 4, 8]  # 지수 백오프 (초)


def _call_gemini_with_retry(model: genai.GenerativeModel, prompt: str, max_tokens: int) -> str:
    """
    Gemini API 호출 + 재시도 로직.

    무료 티어의 분당 요청 제한(RPM) 초과 시 자동으로 재시도합니다.

    Args:
        model: Gemini GenerativeModel 인스턴스
        prompt: 프롬프트 텍스트
        max_tokens: 최대 출력 토큰 수

    Returns:
        생성된 텍스트

    Raises:
        HTTPException: 재시도 횟수를 초과하거나 복구 불가능한 오류 발생 시
    """
    generation_config = genai.types.GenerationConfig(max_output_tokens=max_tokens)

    last_exc: Exception | None = None
    for attempt, delay in enumerate([0] + _RETRY_DELAYS):
        if delay:
            time.sleep(delay)
        try:
            response = model.generate_content(prompt, generation_config=generation_config)
            return response.text.strip()
        except Exception as exc:
            exc_str = str(exc).lower()
            # rate limit(429) 또는 일시적 서버 오류(500, 503)만 재시도
            if any(code in exc_str for code in ("429", "quota", "resource_exhausted", "500", "503")):
                last_exc = exc
                if attempt < _MAX_RETRIES:
                    continue
            # 복구 불가능한 오류는 즉시 실패
            raise HTTPException(
                status_code=502,
                detail=f"AI 서비스 오류가 발생했습니다: {exc}",
            )

    raise HTTPException(
        status_code=429,
        detail=(
            "AI 서비스 요청이 일시적으로 제한되었습니다. "
            "잠시 후 다시 시도해 주세요. "
            f"(마지막 오류: {last_exc})"
        ),
    )


class WeeklyReportAIService:
    """주간보고 AI 분석 서비스 (Google Gemini 사용)"""

    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="AI 서비스가 설정되지 않았습니다. GEMINI_API_KEY를 환경 변수에 설정해주세요.",
            )
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def summarize(self, this_week: str) -> str:
        """
        주간보고 this_week 내용을 한 문장으로 요약.

        Args:
            this_week: 금주 진행 사항 텍스트

        Returns:
            한 문장 요약 문자열
        """
        if not this_week or not this_week.strip():
            raise HTTPException(status_code=400, detail="요약할 내용이 없습니다.")

        prompt = (
            "다음은 주간보고의 금주 진행 사항입니다.\n"
            "이 내용을 핵심 업무와 성과 중심으로 한 문장(50자 이내)으로 간결하게 요약해주세요.\n"
            "요약문만 출력하고, 앞뒤에 불필요한 설명은 하지 마세요.\n\n"
            f"[금주 진행 사항]\n{this_week}"
        )

        return _call_gemini_with_retry(self._model, prompt, max_tokens=200)

    def center_briefing(self, reports_summary: str, total_count: int) -> str:
        """
        여러 팀원의 주간보고 내용을 종합하여 센터장용 브리핑 생성.

        Args:
            reports_summary: 모든 팀원의 this_week/next_week/issues 합산 텍스트
            total_count: 보고서 총 건수

        Returns:
            센터 종합 브리핑 텍스트
        """
        if not reports_summary or not reports_summary.strip():
            raise HTTPException(status_code=400, detail="브리핑을 생성할 보고서 내용이 없습니다.")

        prompt = (
            f"너는 {total_count}인 규모 개발팀의 **운영 실장(Operations Manager)**이야.\n"
            f"아래 {total_count}명의 개별 업무 원문을 분석해서, "
            "본부장님이 1분 안에 팀 전체 리스크를 파악할 수 있는 대시보드를 작성해줘.\n\n"
            "[팀원 주간보고 전체 내용]\n"
            f"{reports_summary}\n\n"
            "[작성 가이드라인]\n"
            "1. 개별 나열 금지: 비슷한 업무는 그룹핑하고, 특이 사항이 없는 인원은 '정상' 범주로 묶어서 한 줄로 처리해.\n"
            "2. 신호등 체계: 🔵(여유), 🟢(정상), 🟡(주의), 🔴(지연) 이모지를 이름 옆에 붙여서 시각화해줘.\n"
            "3. 행동 중심 요약: '무엇을 했다'는 나열보다, 그 결과로 인한 [공정률 %]나 [의사결정 필요사항]을 최우선으로 보여줘.\n\n"
            "다음 4개 섹션을 반드시 정확히 아래 헤더 형식으로 작성해줘:\n\n"
            "##Step 1: 팀 전체 컨디션 스냅샷\n"
            "(이모지와 수치 중심으로 팀 전체 상태를 간결하게. 예: 🟢 정상 9명 / 🟡 주의 2명 / 🔴 지연 1명)\n\n"
            "##Step 2: 팀원 이름+상태 한눈에 보기\n"
            "(각 팀원 이름 앞에 신호등 이모지를 붙여 공백으로 구분해서 한 줄로. 예: 🟢김철수 🟢이영희 🟡박민준 🔴최지연)\n\n"
            "##Step 3: 카테고리별 그룹 요약\n"
            "(업무 성격별로 그룹핑하여 각 그룹을 불릿(•)으로 요약. 예: 인사연동/유지보수/신규개발/기타)\n\n"
            "##Step 4: Critical Path - 관리자 즉시 개입 필요\n"
            "(즉시 의사결정이나 개입이 필요한 항목만 불릿(•)으로. 없으면 '• 즉시 개입 필요 항목 없음')\n\n"
            "##Step 5: 관리용 모멘텀 대시보드\n"
            "(아래 형식으로 정확히 3줄 작성. 각 줄 앞에 이모지 그대로 사용)\n"
            "🔥 집중 업무: [팀 리소스가 가장 많이 투입되는 프로젝트/업무명] (팀 리소스 약 XX% 투입 중)\n"
            "⚠️ 정체 구간: [현재 진척이 멈춘 업무명] (원인: [구체적 이유, 예: 외부 API 회신 대기 3일째])\n"
            "⚖️ 리소스 불균형: [특정 인원/역할에 과부하 또는 편중 상황 설명] → [권고 조치]\n\n"
            "전체 분량은 1000자 이내로 간결하게 작성해줘."
        )

        return _call_gemini_with_retry(self._model, prompt, max_tokens=2000)

    def guide(self, this_week: str) -> str:
        """
        주간보고 this_week 내용의 미흡한 점을 분석하여 피드백 반환.

        Args:
            this_week: 금주 진행 사항 텍스트

        Returns:
            보완 가이드 텍스트
        """
        if not this_week or not this_week.strip():
            raise HTTPException(status_code=400, detail="분석할 내용이 없습니다.")

        prompt = (
            "다음은 주간보고의 금주 진행 사항입니다.\n"
            "아래 기준으로 미흡한 점을 분석하고 구체적인 보완 방법을 제시해주세요.\n\n"
            "분석 기준:\n"
            "1. 수치/정량 데이터 부족 (예: 완료율, 처리 건수, 소요 시간 등)\n"
            "2. 모호한 표현 (예: '검토 중', '진행 예정' 등 구체성 부족)\n"
            "3. 업무 결과/성과 명시 여부\n"
            "4. 이슈 및 리스크 언급 여부\n\n"
            "결과 형식: 각 항목을 글머리 기호(•)로 나열하고, 각 항목은 '문제점: 개선 방안' 형태로 작성.\n"
            "없는 문제점은 언급하지 말고, 실제로 개선이 필요한 부분만 간결하게 작성해주세요.\n\n"
            f"[금주 진행 사항]\n{this_week}"
        )

        return _call_gemini_with_retry(self._model, prompt, max_tokens=600)
