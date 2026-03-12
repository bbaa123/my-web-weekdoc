import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Pencil, Trash2, CornerDownRight, X, Check } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { cn } from '@/core/utils/cn';
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
} from '../api';
import type { WeeklyReportComment } from '../types';

interface Props {
  reportNo: number;
  panelMode?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── 단일 댓글 행 ──────────────────────────────────────────────────────────────

interface CommentRowProps {
  comment: WeeklyReportComment;
  currentLoginId: string;
  isAdmin: boolean;
  onReply: (comment: WeeklyReportComment) => void;
  onEdit: (comment: WeeklyReportComment) => void;
  onDelete: (commentId: number) => void;
  depth?: number;
}

function CommentRow({
  comment,
  currentLoginId,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: CommentRowProps) {
  const isOwner = comment.id === currentLoginId;
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  return (
    <div className={cn('flex flex-col gap-1', depth > 0 && 'ml-6 border-l-2 border-slate-100 pl-4')}>
      <div className="group flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 transition-colors">
        {/* 아바타 */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
          {comment.commenter_name.slice(0, 1)}
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{comment.commenter_name}</span>
            <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
            {comment.created_at !== comment.updated_at && (
              <span className="text-xs text-slate-400">(수정됨)</span>
            )}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
            {comment.content}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {depth === 0 && (
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            >
              <CornerDownRight size={12} />
              답글
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onEdit(comment)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <Pencil size={13} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.comment_id)}
              className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 대댓글 */}
      {comment.replies.map((reply) => (
        <CommentRow
          key={reply.comment_id}
          comment={reply}
          currentLoginId={currentLoginId}
          isAdmin={isAdmin}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function WeeklyReportComments({ reportNo, panelMode = false }: Props) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<WeeklyReportComment[]>([]);
  const [loading, setLoading] = useState(false);

  // 입력창
  const [newContent, setNewContent] = useState('');
  const [replyTarget, setReplyTarget] = useState<WeeklyReportComment | null>(null);
  const [editTarget, setEditTarget] = useState<WeeklyReportComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentLoginId: string = user?.id ?? '';
  const isAdmin: boolean = (user as { admin_yn?: boolean } | null)?.admin_yn ?? false;

  const totalCount = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  useEffect(() => {
    load();
  }, [reportNo]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchComments(reportNo);
      setComments(data);
    } catch {
      toast.error('댓글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleReply(comment: WeeklyReportComment) {
    setReplyTarget(comment);
    setEditTarget(null);
    setNewContent('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleEdit(comment: WeeklyReportComment) {
    setEditTarget(comment);
    setEditContent(comment.content);
    setReplyTarget(null);
  }

  async function handleDelete(commentId: number) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
      toast.success('댓글이 삭제되었습니다.');
      await load();
    } catch {
      toast.error('댓글 삭제에 실패했습니다.');
    }
  }

  async function handleSubmit() {
    const content = newContent.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      await createComment(reportNo, {
        content,
        parent_comment_id: replyTarget?.comment_id ?? null,
      });
      setNewContent('');
      setReplyTarget(null);
      await load();
    } catch {
      toast.error('댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit() {
    if (!editTarget) return;
    const content = editContent.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      await updateComment(editTarget.comment_id, { content });
      setEditTarget(null);
      setEditContent('');
      await load();
    } catch {
      toast.error('댓글 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setEditTarget(null);
      setEditContent('');
    }
  }

  if (panelMode) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* 패널 헤더 */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-gray-50">
          <MessageCircle size={15} className="text-orange-500" />
          <span className="text-sm font-semibold text-slate-700">
            댓글{totalCount > 0 ? ` ${totalCount}` : ''}
          </span>
        </div>

        {/* 댓글 목록 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">아직 댓글이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {comments.map((comment) => (
                <CommentRow
                  key={comment.comment_id}
                  comment={comment}
                  currentLoginId={currentLoginId}
                  isAdmin={isAdmin}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* 수정 폼 */}
        {editTarget && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-orange-600 font-medium">댓글 수정</span>
                <button
                  onClick={() => { setEditTarget(null); setEditContent(''); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={2}
                  className="flex-1 resize-none rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-orange-400"
                />
                <button
                  onClick={handleEditSubmit}
                  disabled={submitting || !editContent.trim()}
                  className="flex items-center gap-1 rounded bg-orange-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
                >
                  <Check size={13} />
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 하단 고정 입력창 */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-3">
          {replyTarget && (
            <div className="mb-2 flex items-center justify-between rounded bg-slate-100 px-3 py-1.5">
              <span className="text-xs text-slate-600">
                <span className="font-medium">{replyTarget.commenter_name}</span> 님에게 답글
              </span>
              <button onClick={() => setReplyTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="댓글 입력 (Enter 등록)"
              rows={2}
              className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !newContent.trim()}
              className="flex items-center gap-1 self-end rounded-lg bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40 transition-colors"
            >
              <Send size={13} />
              등록
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <MessageCircle size={16} className="text-orange-500" />
        <span className="text-sm font-semibold text-slate-700">
          댓글 {totalCount > 0 ? totalCount : ''}
        </span>
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">아직 댓글이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {comments.map((comment) => (
            <CommentRow
              key={comment.comment_id}
              comment={comment}
              currentLoginId={currentLoginId}
              isAdmin={isAdmin}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 수정 폼 */}
      {editTarget && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-orange-600 font-medium">댓글 수정</span>
            <button
              onClick={() => { setEditTarget(null); setEditContent(''); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={2}
              className="flex-1 resize-none rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
            />
            <button
              onClick={handleEditSubmit}
              disabled={submitting || !editContent.trim()}
              className="flex items-center gap-1 rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
            >
              <Check size={13} />
              저장
            </button>
          </div>
        </div>
      )}

      {/* 입력 폼 */}
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        {replyTarget && (
          <div className="flex items-center justify-between rounded bg-slate-200 px-3 py-1.5">
            <span className="text-xs text-slate-600">
              <span className="font-medium">{replyTarget.commenter_name}</span> 님에게 답글
            </span>
            <button onClick={() => setReplyTarget(null)} className="text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글을 입력하세요 (Enter로 등록, Shift+Enter로 줄바꿈)"
            rows={2}
            className="flex-1 resize-none rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newContent.trim()}
            className="flex items-center gap-1 self-end rounded bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
          >
            <Send size={13} />
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
