import React, { useState } from 'react';
import { DecisionChangeItem } from '../types';
import { generateDecisionsLog } from '../utils/reportGenerator';
import { 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Filter, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  User, 
  FileText,
  Plus
} from 'lucide-react';

interface DecisionChangeLogProps {
  decisions: DecisionChangeItem[];
  onOpenAddDecision: () => void;
  onUpdateDecisionStatus: (id: string, status: any, isConfirmed: boolean, approver?: string) => void;
}

export const DecisionChangeLog: React.FC<DecisionChangeLogProps> = ({
  decisions,
  onOpenAddDecision,
  onUpdateDecisionStatus,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'confirmed' | 'unconfirmed' | 'change' | 'decision'>('all');
  const [copied, setCopied] = useState(false);

  const filteredDecisions = decisions.filter((d) => {
    if (filterType === 'confirmed') return d.isConfirmed;
    if (filterType === 'unconfirmed') return !d.isConfirmed;
    if (filterType === 'change') return d.type === '변경';
    if (filterType === 'decision') return d.type === '결정';
    return true;
  });

  const handleCopyMarkdown = () => {
    const text = generateDecisionsLog(decisions);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                결과 2 · D-001 순번 관리
              </span>
              <span className="text-xs text-stone-500">
                총 {decisions.length}건 (확정 {decisions.filter((d) => d.isConfirmed).length}건 / 미확정 {decisions.filter((d) => !d.isConfirmed).length}건)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              의사결정·변경 기록
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              요청자·결정자, 변경 전후 비교, 비용 및 공정 영향(미확인 vs 영향 없음 구분)을 엄격히 관리합니다.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-copy-decisions-log"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료' : '전체 기록 마크다운 복사'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-4 mt-4 border-t border-stone-100 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-400 font-medium mr-1">필터:</span>
          
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              filterType === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체 ({decisions.length})
          </button>
          <button
            onClick={() => setFilterType('confirmed')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              filterType === 'confirmed' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            확정 결정 ({decisions.filter((d) => d.isConfirmed).length})
          </button>
          <button
            onClick={() => setFilterType('unconfirmed')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              filterType === 'unconfirmed' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            [미확정] 승인 대기 ({decisions.filter((d) => !d.isConfirmed).length})
          </button>
          <button
            onClick={() => setFilterType('change')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              filterType === 'change' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            설계·공정 변경 ({decisions.filter((d) => d.type === '변경').length})
          </button>
          <button
            onClick={() => setFilterType('decision')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              filterType === 'decision' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            방침 결정 ({decisions.filter((d) => d.type === '결정').length})
          </button>
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
            <FileText className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <div className="font-semibold text-stone-700">해당 조건의 의사결정·변경 기록이 없습니다.</div>
            <div className="text-xs text-stone-400 mt-1">업무 기록에서 결정 또는 변경 사항을 추가할 수 있습니다.</div>
          </div>
        ) : (
          filteredDecisions.map((item) => {
            const hasMissingApprover = !item.approver || item.approver === '승인 대기' || item.approver === '확인 필요';
            const hasMissingRequester = !item.requester || item.requester === '확인 필요';
            const isCostUnconfirmed = item.costImpact.includes('미확인') || item.costImpact === '확인 필요';
            const isScheduleUnconfirmed = item.scheduleImpact.includes('미확인') || item.scheduleImpact === '확인 필요';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border shadow-xs transition-all overflow-hidden ${
                  item.isConfirmed ? 'border-stone-200 hover:border-emerald-300' : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                {/* Card Header Bar */}
                <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-stone-900 text-white">
                      {item.decisionNumber}
                    </span>
                    <span className="font-mono text-xs text-stone-500 font-semibold">{item.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      item.type === '변경' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1 ${
                      item.isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                      <span>{item.isConfirmed ? '확정' : '[미확정]'}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-stone-400">근거 기록:</span>
                    <span className="font-mono font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {item.sourceRecordNumber || 'R-000'}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                      {!item.isConfirmed && <span className="text-amber-700">[미확정]</span>}
                      <span>{item.title}</span>
                    </h3>
                    <p className="text-stone-700 mt-1.5 leading-relaxed text-xs sm:text-sm">
                      {item.content}
                    </p>
                  </div>

                  {/* Before / After Diff Comparison Box (For Changes) */}
                  {(item.beforeChange || item.afterChange) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-lg border border-stone-200/70">
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-rose-700 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>변경 전 (기존)</span>
                        </div>
                        <div className="text-stone-700 bg-white p-2.5 rounded border border-stone-200/80 leading-relaxed font-mono">
                          {item.beforeChange || '확인 필요'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>변경 후 (신규 안)</span>
                        </div>
                        <div className="text-stone-900 bg-emerald-50/50 p-2.5 rounded border border-emerald-200 leading-relaxed font-semibold font-mono">
                          {item.afterChange || '확인 필요'}
                        </div>
                      </div>

                      {item.reason && (
                        <div className="col-span-full pt-1 text-stone-600">
                          <span className="font-semibold text-stone-800">변경 사유:</span> {item.reason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Responsibility & Impact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-stone-100">
                    
                    {/* Requester */}
                    <div>
                      <div className="text-stone-400 font-medium text-[11px]">요청자</div>
                      <div className={`mt-0.5 font-semibold ${hasMissingRequester ? 'text-amber-700 font-bold' : 'text-stone-800'}`}>
                        {item.requester ? item.requester : '**[요청자 확인 필요]**'}
                      </div>
                    </div>

                    {/* Approver / Decision Maker */}
                    <div>
                      <div className="text-stone-400 font-medium text-[11px]">결정자 (승인 주체)</div>
                      <div className={`mt-0.5 font-semibold ${hasMissingApprover ? 'text-amber-700 font-bold bg-amber-50 px-1 rounded inline-block' : 'text-stone-800'}`}>
                        {item.approver && item.approver !== '승인 대기' && item.approver !== '확인 필요'
                          ? item.approver
                          : '**[결정자 확인 필요]**'}
                      </div>
                    </div>

                    {/* Cost Impact */}
                    <div>
                      <div className="text-stone-400 font-medium text-[11px]">비용 영향</div>
                      <div className={`mt-0.5 font-semibold ${isCostUnconfirmed ? 'text-amber-700 font-bold bg-amber-50 px-1 rounded inline-block' : 'text-stone-800'}`}>
                        {item.costImpact || '비용 영향 확인 필요'}
                      </div>
                    </div>

                    {/* Schedule Impact */}
                    <div>
                      <div className="text-stone-400 font-medium text-[11px]">일정 영향</div>
                      <div className={`mt-0.5 font-semibold ${isScheduleUnconfirmed ? 'text-amber-700 font-bold bg-amber-50 px-1 rounded inline-block' : 'text-stone-800'}`}>
                        {item.scheduleImpact || '일정 영향 확인 필요'}
                      </div>
                    </div>
                  </div>

                  {/* Follow-up & Due Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stone-100 text-stone-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-800">후속 조치:</span>
                      <span>{item.followUpAction || '확인 필요'}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] self-end sm:self-auto">
                      <span>담당: <strong className="text-stone-800">{item.relatedAssignee || '확인 필요'}</strong></span>
                      <span>완료예정: <strong className="font-mono text-stone-800">{item.dueDate || '확인 필요'}</strong></span>
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">{item.status}</span>
                    </div>
                  </div>

                  {/* Quick Decision Confirmation Actions (For PM to change status) */}
                  {!item.isConfirmed && (
                    <div className="bg-amber-100/50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                      <span className="text-amber-900 text-xs">
                        건축주 또는 대표 승인이 완료되었습니까?
                      </span>
                      <button
                        onClick={() => {
                          const approverName = prompt('승인/결정한 주체(건축주 또는 직함)를 입력하세요:', item.requester || '');
                          if (approverName) {
                            onUpdateDecisionStatus(item.id, '완료', true, approverName);
                          }
                        }}
                        className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-1 rounded text-xs font-semibold shadow-xs transition-colors"
                      >
                        승인 확정 처리
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
