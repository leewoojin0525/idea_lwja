import React from 'react';
import { RecordItem } from '../types';
import { AlertCircle, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRecord: RecordItem;
  newRecordDraft: Partial<RecordItem>;
  diffNotes: string;
  onResolve: (action: 'keep_existing' | 'overwrite_with_corrected_tag' | 'add_as_new_record') => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  existingRecord,
  newRecordDraft,
  diffNotes,
  onResolve,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-amber-300 shadow-2xl overflow-hidden text-xs">
        
        {/* Header */}
        <div className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-base font-bold">
              기록 충돌 확인 (실무 지침 16조)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-800 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-amber-950 font-medium">
            기존 기록과 새로운 내용이 다릅니다. 어느 내용을 현재 기준으로 적용할지 지정해 주세요.
          </div>

          <div className="space-y-3 font-mono">
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div className="text-stone-500 font-bold mb-1 flex items-center space-x-1">
                <span>[기존 기록]: {existingRecord.recordNumber} ({existingRecord.date})</span>
              </div>
              <div className="font-semibold text-stone-900">{existingRecord.title}</div>
              <div className="text-stone-600 mt-1 text-[11px] leading-relaxed">{existingRecord.content}</div>
              <div className="text-stone-400 mt-1 text-[11px]">담당: {existingRecord.assignee} · 상태: {existingRecord.status}</div>
            </div>

            <div className="bg-stone-50 p-3 rounded-lg border border-amber-300">
              <div className="text-amber-800 font-bold mb-1 flex items-center space-x-1">
                <span>[새로운 입력]: ({newRecordDraft.date || '오늘'})</span>
              </div>
              <div className="font-semibold text-stone-900">{newRecordDraft.title}</div>
              <div className="text-stone-600 mt-1 text-[11px] leading-relaxed">{newRecordDraft.content}</div>
              <div className="text-stone-400 mt-1 text-[11px]">담당: {newRecordDraft.assignee} · 상태: {newRecordDraft.status}</div>
            </div>

            {diffNotes && (
              <div className="text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                <span className="font-bold text-amber-900">확인이 필요한 사항:</span> {diffNotes}
              </div>
            )}
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onResolve('overwrite_with_corrected_tag')}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-left flex items-center justify-between shadow-xs transition-colors"
            >
              <span>1. 새로운 내용으로 수정 적용 ('정정됨' 표시 유지)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onResolve('add_as_new_record')}
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-lg text-left flex items-center justify-between shadow-xs transition-colors"
            >
              <span>2. 기존 기록 유지하고 별도 신규 기록으로 추가</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onResolve('keep_existing')}
              className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-center transition-colors"
            >
              3. 취소 (기존 기록 그대로 유지)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
