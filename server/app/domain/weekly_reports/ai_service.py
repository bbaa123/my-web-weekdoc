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
