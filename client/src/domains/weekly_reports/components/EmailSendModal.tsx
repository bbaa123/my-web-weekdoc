/**
 * EmailSendModal - AI 브리핑 리포트 이메일 발송 모달
 *
 * - 수신자 태그 입력 (쉼표 / 엔터로 구분)
 * - 로그인 사용자 이메일 기본 입력
 * - html2canvas + jsPDF로 PDF 생성 후 API 전송
 */

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { X, Mail, Send, Loader2, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { sendReportEmail } from '../api';
import { toast } from '@/core/utils/toast';

interface EmailSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** html2canvas로 캡처할 브리핑 영역 ref */
  captureRef: React.RefObject<HTMLDivElement | null>;
  userEmail: string;
  year: string;
  month: string;
  weekNumber: string;
  deptName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailSendModal({
  isOpen,
  onClose,
  captureRef,
  userEmail,
  year,
  month,
  weekNumber,
  deptName,
}: EmailSendModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때 로그인 사용자 이메일을 기본 태그로 추가
  useEffect(() => {
    if (isOpen) {
      setTags(userEmail ? [userEmail] : []);
      setInputValue('');
      setInputError('');
    }
  }, [isOpen, userEmail]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sending, onClose]);

  if (!isOpen) return null;

  const addTag = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      setInputError(`'${email}'은(는) 유효하지 않은 이메일 주소입니다.`);
      return;
    }
    if (tags.includes(email)) {
      setInputError('이미 추가된 이메일 주소입니다.');
      return;
    }
    setTags((prev) => [...prev, email]);
    setInputValue('');
    setInputError('');
  };

  const removeTag = (email: string) => {
    setTags((prev) => prev.filter((t) => t !== email));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const parts = pasted.split(/[,;\s]+/).filter(Boolean);
    parts.forEach(addTag);
  };

  const handleSend = async () => {
    // 입력 중인 이메일도 태그로 추가
    if (inputValue.trim()) addTag(inputValue);

    const finalTags = inputValue.trim()
      ? [...tags, inputValue.trim().toLowerCase()].filter(
          (v, i, arr) => arr.indexOf(v) === i && EMAIL_REGEX.test(v)
        )
      : tags;

    if (finalTags.length === 0) {
      setInputError('수신자 이메일을 입력해주세요.');
      return;
    }

    if (!captureRef.current) {
      toast.error('캡처할 브리핑 영역을 찾을 수 없습니다.');
      return;
    }

    setSending(true);
    try {
      // 1. html2canvas로 브리핑 영역 캡처
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      // 2. jsPDF로 PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      // 3. API 호출하여 이메일 발송
      const result = await sendReportEmail({
        recipients: finalTags,
        pdf_base64: pdfBase64,
        year,
        month,
        week_number: weekNumber,
        dept_name: deptName,
      });

      toast.success(result.message || '성공적으로 전송되었습니다.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '이메일 발송에 실패했습니다.';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Mail size={16} className="text-orange-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">리포트 이메일 발송</h3>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-4">
          {/* 발송 정보 */}
          <div className="bg-orange-50 rounded-xl px-4 py-3 text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-orange-600">{year}년 {parseInt(month)}월 {weekNumber}</span>
            {' '}{deptName} 센터 통합 리포트를 PDF로 변환하여 발송합니다.
          </div>

          {/* 수신자 태그 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              수신자 이메일
              <span className="ml-1 font-normal text-slate-400">(쉼표 또는 엔터로 구분)</span>
            </label>

            <div
              className="min-h-[80px] flex flex-wrap gap-1.5 p-2.5 border border-slate-200 rounded-xl cursor-text bg-white focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-orange-300 transition-all"
              onClick={() => inputRef.current?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    className="hover:text-orange-900 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="email"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInputError('');
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onPaste={handlePaste}
                placeholder={tags.length === 0 ? '이메일 주소를 입력하세요' : ''}
                className="flex-1 min-w-[180px] outline-none text-sm text-slate-700 placeholder-slate-300 bg-transparent"
                disabled={sending}
              />
            </div>

            {inputError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                <AlertCircle size={12} />
                {inputError}
              </div>
            )}
          </div>

          {/* 메일 제목 미리보기 */}
          <div className="text-xs text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-500">메일 제목</p>
            <p className="font-mono bg-slate-50 rounded-lg px-3 py-2 text-slate-600">
              [주간보고 분석] {year}년 {parseInt(month)}월 {weekNumber} {deptName} 센터 통합 리포트
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={sending || tags.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                리포트를 전송 중입니다...
              </>
            ) : (
              <>
                <Send size={15} />
                이메일 발송
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
