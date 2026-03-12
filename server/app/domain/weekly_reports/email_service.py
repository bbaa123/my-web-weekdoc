"""
WeeklyReport Email Service - PDF 리포트 이메일 발송
"""

import base64
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import List

from fastapi import HTTPException

from server.app.core.config import settings
from server.app.domain.weekly_reports.schemas.weekly_report_schemas import DelayedItem


def _build_delayed_table_html(delayed_items: list[DelayedItem]) -> str:
    """지연 업무 요약 테이블 HTML 생성"""
    if not delayed_items:
        return ""

    rows_html = ""
    for item in delayed_items:
        if item.days_overdue > 0:
            badge = f'<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:bold;">⚠️ {item.days_overdue}일 지연</span>'
            row_color = "#fff5f5"
        else:
            badge = '<span style="background:#f97316;color:white;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:bold;">🔔 오늘 마감</span>'
            row_color = "#fff7ed"

        rows_html += f"""
        <tr style="background:{row_color};">
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">{item.author_name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">{item.department or '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">{item.project_name or '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">{item.due_date}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">{badge}</td>
        </tr>"""

    return f"""
    <div style="margin-bottom:20px;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#dc2626;font-weight:bold;">
        ⚠️ 일정 지연 및 임박 업무 ({len(delayed_items)}건)
      </h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#fee2e2;">
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">담당자</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">부서</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">업무/프로젝트</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">완료 예정일</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">상태</th>
          </tr>
        </thead>
        <tbody>
          {rows_html}
        </tbody>
      </table>
    </div>
    """


class ReportEmailService:
    """PDF 첨부 이메일 발송 서비스"""

    def _build_message(
        self,
        recipients: List[str],
        subject: str,
        body_html: str,
        pdf_bytes: bytes,
        pdf_filename: str,
    ) -> MIMEMultipart:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or ""
        msg["From"] = formataddr((settings.SMTP_FROM_NAME, from_email))
        msg["To"] = ", ".join(recipients)

        alternative = MIMEMultipart("alternative")
        alternative.attach(MIMEText(body_html, "html", "utf-8"))
        msg.attach(alternative)

        pdf_part = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_part.add_header(
            "Content-Disposition", "attachment", filename=pdf_filename
        )
        msg.attach(pdf_part)

        return msg

    def send_report_email(
        self,
        recipients: List[str],
        pdf_base64: str,
        year: str,
        month: str,
        week_number: str,
        dept_name: str,
        delayed_items: list[DelayedItem] | None = None,
    ) -> None:
        """
        PDF 첨부 주간보고 리포트 이메일 발송.

        Args:
            recipients: 수신자 이메일 목록
            pdf_base64: base64 인코딩된 PDF 데이터
            year: 연도
            month: 월
            week_number: 주차 (예: "2주차")
            dept_name: 부서명
            delayed_items: 지연/임박 업무 목록 (요약 테이블 포함)
        """
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            raise HTTPException(
                status_code=503,
                detail="이메일 발송 설정이 구성되지 않았습니다. SMTP_USER와 SMTP_PASSWORD를 설정해주세요.",
            )

        if not recipients:
            raise HTTPException(status_code=400, detail="수신자 이메일을 입력해주세요.")

        try:
            pdf_bytes = base64.b64decode(pdf_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="PDF 데이터가 올바르지 않습니다.")

        week_label = week_number if week_number.endswith("주차") else f"{week_number}주차"
        subject = (
            f"[주간보고 분석] {year}년 {int(month)}월 {week_label} {dept_name} 센터 통합 리포트"
        )
        pdf_filename = f"주간보고_{year}_{int(month)}월_{week_label}.pdf"

        delayed_table_html = _build_delayed_table_html(delayed_items or [])

        body_html = f"""
        <html>
          <body style="font-family: sans-serif; color: #1e293b;">
            <div style="max-width: 650px; margin: 0 auto; padding: 24px;">
              <div style="background: #FF6B00; color: white; padding: 16px 20px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-size: 18px;">📊 VNTG 주간보고 AI 분석 리포트</h2>
              </div>
              <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 12px 12px;">
                <p style="margin: 0 0 12px;">안녕하세요,</p>
                <p style="margin: 0 0 16px;">
                  <strong>{year}년 {int(month)}월 {week_label}</strong> {dept_name} 팀의
                  AI 종합 브리핑 리포트를 첨부파일로 전달드립니다.
                </p>
                {delayed_table_html}
                <p style="margin: 0 0 20px; color: #64748b; font-size: 13px;">
                  상세 내용은 첨부된 PDF 파일을 확인해 주세요.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                  본 메일은 VNTG 주간보고 시스템에서 자동 발송된 메일입니다.
                </p>
              </div>
            </div>
          </body>
        </html>
        """

        msg = self._build_message(
            recipients=recipients,
            subject=subject,
            body_html=body_html,
            pdf_bytes=pdf_bytes,
            pdf_filename=pdf_filename,
        )

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                from_addr = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
                server.sendmail(from_addr, recipients, msg.as_string())
        except smtplib.SMTPAuthenticationError:
            raise HTTPException(
                status_code=503,
                detail="SMTP 인증에 실패했습니다. 이메일 계정 설정을 확인해주세요.",
            )
        except smtplib.SMTPException as e:
            raise HTTPException(
                status_code=503,
                detail=f"이메일 발송 중 오류가 발생했습니다: {str(e)}",
            )
        except OSError as e:
            raise HTTPException(
                status_code=503,
                detail=f"SMTP 서버에 연결할 수 없습니다: {str(e)}",
            )
