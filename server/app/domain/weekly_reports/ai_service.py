"""
WeeklyReport AI Service - AI 요약 및 가이드 기능
"""

import anthropic
from fastapi import HTTPException

from server.app.core.config import settings


class WeeklyReportAIService:
    """주간보고 AI 분석 서비스 (Anthropic Claude 사용)"""

    def __init__(self) -> None:
        if not settings.ANTHROPIC_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="AI 서비스가 설정되지 않았습니다. ANTHROPIC_API_KEY를 환경 변수에 설정해주세요.",
            )
        self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

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

        message = self._client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()

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

        message = self._client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
