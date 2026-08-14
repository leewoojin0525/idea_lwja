import React, { useState } from 'react';
import { Project, RecordItem, DecisionChangeItem } from '../types';
import { generateStatusSummary } from '../utils/reportGenerator';
import { isOverdue } from '../utils/dateUtils';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  MapPin, 
  Tag, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileCheck2,
  Share2
} from 'lucide-react';

interface ProjectStatusSummaryProps {
  project: Project;
  records: RecordItem[];
  decisions: DecisionChangeItem[];
  onOpenAddRecord: () => void;
}

export const ProjectStatusSummary: React.FC<ProjectStatusSummaryProps> = ({
  project,
  records,
  decisions,
  onOpenAddRecord,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');

  const summaryMarkdown = generateStatusSummary(project, records, decisions);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute urgent alerts
  const overdueRecords = records.filter((r) => isOverdue(r.dueDate, project.reportDate, r.status));
  const pendingApprovals = decisions.filter((d) => !d.isConfirmed || !d.approver || d.approver === '승인 대기' || d.approver === '확인 필요');
  const unconfirmedCosts = decisions.filter((d) => d.costImpact.includes('미확인') || d.costImpact === '확인 필요');
  const unconfirmedSchedules = decisions.filter((d) => d.scheduleImpact.includes('미확인') || d.scheduleImpact === '확인 필요');
  const unassignedRecords = records.filter((r) => !r.assignee || r.assignee === '확인 필요');
  const activeRisks = records.filter((r) => r.category === '위험' && r.status !== '완료');

  const hasUrgentIssues = 
    overdueRecords.length > 0 || 
    pendingApprovals.length > 0 || 
    unconfirmedCosts.length > 0 || 
    unconfirmedSchedules.length > 0 || 
    unassignedRecords.length > 0 || 
    activeRisks.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {project.stage || '단계 확인 필요'}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                기준일: {project.reportDate || '확인 필요'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              {project.name || '프로젝트명 확인 필요'}
            </h1>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs font-medium text-stone-600">
              <button
                onClick={() => setViewMode('structured')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'structured' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                카드 보기
              </button>
              <button
                onClick={() => setViewMode('markdown')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'markdown' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                마크다운 원문
              </button>
            </div>

            <button
              id="btn-copy-status-summary"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료' : '현황 요약 복사'}</span>
            </button>
          </div>
        </div>

        {/* Project Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <div className="text-stone-400 font-medium flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>대지 위치</span>
            </div>
            <div className="font-semibold text-stone-800 mt-1 truncate">{project.location || '확인 필요'}</div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <div className="text-stone-400 font-medium flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span>건축주 / 발주자</span>
            </div>
            <div className="font-semibold text-stone-800 mt-1 truncate">{project.client || '확인 필요'}</div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <div className="text-stone-400 font-medium flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-stone-500" />
              <span>내부 담당자</span>
            </div>
            <div className="font-semibold text-stone-800 mt-1 truncate">{project.internalManager || '확인 필요'}</div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <div className="text-stone-400 font-medium flex items-center space-x-1">
              <FileCheck2 className="w-3.5 h-3.5 text-stone-500" />
              <span>누적 기록</span>
            </div>
            <div className="font-semibold text-stone-800 mt-1 flex items-center space-x-2">
              <span className="font-mono text-sm text-amber-700">{records.length}건</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-600">결정/변경 {decisions.length}건</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'markdown' ? (
        /* Raw Markdown View */
        <div className="bg-stone-900 text-stone-200 rounded-xl p-6 font-mono text-xs overflow-x-auto shadow-inner">
          <pre className="whitespace-pre-wrap leading-relaxed">{summaryMarkdown}</pre>
        </div>
      ) : (
        /* Structured Card View according to Section 11 */
        <div className="space-y-6">

          {/* Section: 긴급 확인 (Urgent Alerts) */}
          <div className={`rounded-xl border p-5 shadow-xs ${
            hasUrgentIssues ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/40 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {hasUrgentIssues ? (
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <h2 className="text-base font-bold text-stone-900">
                  긴급 확인 {hasUrgentIssues && <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full ml-2">조치 필요</span>}
                </h2>
              </div>
            </div>

            {!hasUrgentIssues ? (
              <p className="text-xs text-stone-600 font-medium">현재 확인된 긴급사항 없음</p>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Overdue Items */}
                {overdueRecords.map((r) => (
                  <div key={r.id} className="bg-white p-3.5 rounded-lg border border-red-200 shadow-xs">
                    <div className="flex items-center justify-between text-red-700 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>🚨 지연: [{r.recordNumber}] {r.title}</span>
                      </span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">지연</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-stone-600 text-xs">
                      <div><span className="text-stone-400">담당자:</span> <span className="font-semibold text-stone-800">{r.assignee || '확인 필요'}</span></div>
                      <div><span className="text-stone-400">완료 예정일:</span> <span className="font-mono text-red-600 font-semibold">{r.dueDate}</span></div>
                      <div><span className="text-stone-400">현재 상태:</span> <span className="font-medium text-stone-800">{r.status}</span></div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-stone-100 text-stone-700">
                      <span className="text-stone-400 font-medium">필요한 조치:</span> {r.followUpAction || '즉시 후속 조치 방안 수립 필요'}
                    </div>
                  </div>
                ))}

                {/* Missing Approvers in Decisions */}
                {pendingApprovals.map((d) => (
                  <div key={d.id} className="bg-white p-3 rounded-lg border border-amber-200 text-stone-800 flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-stone-900">
                        [{d.decisionNumber}] {d.title} <span className="text-amber-700 font-bold">[결정자 확인 필요 / 승인 대기]</span>
                      </div>
                      <div className="text-stone-500 mt-0.5">요청자: {d.requester || '확인 필요'} · 후속 조치: {d.followUpAction || '확인 필요'}</div>
                    </div>
                  </div>
                ))}

                {/* Cost/Schedule Unconfirmed */}
                {unconfirmedCosts.map((d) => (
                  <div key={`cost-${d.id}`} className="bg-white p-2.5 rounded-lg border border-amber-200 text-stone-700 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span>[{d.decisionNumber}] {d.title} - <strong className="text-amber-800">비용 영향 미확인</strong> (산출 및 확인 필요)</span>
                  </div>
                ))}

                {unconfirmedSchedules.map((d) => (
                  <div key={`sch-${d.id}`} className="bg-white p-2.5 rounded-lg border border-amber-200 text-stone-700 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span>[{d.decisionNumber}] {d.title} - <strong className="text-amber-800">일정 영향 미확인</strong> (공정 영향 검토 필요)</span>
                  </div>
                ))}

                {/* Unassigned Tasks */}
                {unassignedRecords.map((r) => (
                  <div key={`unassign-${r.id}`} className="bg-white p-2.5 rounded-lg border border-stone-200 text-stone-700 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-stone-400 flex-shrink-0" />
                    <span>[{r.recordNumber}] {r.title} - <strong className="text-stone-900">담당자 미지정</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: 최근 진행 내용 (Recent Progress) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>최근 진행 내용</span>
            </h2>
            <div className="divide-y divide-stone-100">
              {records.length === 0 ? (
                <p className="text-xs text-stone-500 py-3">입력된 진행 내용이 없습니다.</p>
              ) : (
                records.slice(0, 4).map((r) => (
                  <div key={r.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-stone-500 font-semibold">{r.date}</span>
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                          {r.category}
                        </span>
                        <span className="font-semibold text-stone-900">[{r.recordNumber}] {r.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.status === '완료' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === '승인 대기' ? 'bg-amber-100 text-amber-800' :
                        r.status === '진행 중' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1 pl-1 line-clamp-2 leading-relaxed">{r.content}</p>
                    {r.photoDescription && (
                      <div className="mt-1 pl-1 text-[11px] text-stone-400 italic">
                        📷 사진 설명: {r.photoDescription}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: 확정된 결정사항 & 검토·승인 대기사항 (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 확정된 결정사항 */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>확정된 결정사항</span>
              </h2>
              <div className="space-y-3 text-xs">
                {decisions.filter((d) => d.isConfirmed).length === 0 ? (
                  <p className="text-stone-500">현재 확정된 결정사항이 없습니다.</p>
                ) : (
                  decisions.filter((d) => d.isConfirmed).map((d) => (
                    <div key={d.id} className="bg-emerald-50/40 border border-emerald-200/80 rounded-lg p-3">
                      <div className="flex items-center justify-between font-semibold text-emerald-950">
                        <span>[{d.decisionNumber}] {d.title}</span>
                        <span className="font-mono text-stone-500 text-[11px]">{d.date}</span>
                      </div>
                      <div className="text-stone-600 mt-1 leading-relaxed">{d.content}</div>
                      <div className="mt-2 pt-2 border-t border-emerald-100 text-[11px] text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>결정자: <strong className="text-stone-700">{d.approver}</strong></span>
                        <span>비용: <strong className="text-stone-700">{d.costImpact}</strong></span>
                        <span>일정: <strong className="text-stone-700">{d.scheduleImpact}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 검토·승인 대기사항 */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>검토·승인 대기사항</span>
              </h2>
              <div className="space-y-3 text-xs">
                {decisions.filter((d) => !d.isConfirmed).concat(
                  records.filter((r) => (r.status === '검토 중' || r.status === '승인 대기') && !r.isDecisionOrChange) as any
                ).length === 0 ? (
                  <p className="text-stone-500">현재 검토 또는 승인 대기사항이 없습니다.</p>
                ) : (
                  decisions.filter((d) => !d.isConfirmed).map((d) => (
                    <div key={d.id} className="bg-amber-50/40 border border-amber-200/80 rounded-lg p-3">
                      <div className="flex items-center justify-between font-semibold text-amber-950">
                        <span>[{d.decisionNumber}] [미확정] {d.title}</span>
                        <span className="font-mono text-stone-500 text-[11px]">{d.date}</span>
                      </div>
                      <div className="text-stone-600 mt-1 leading-relaxed">{d.content}</div>
                      <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>요청자: <strong className="text-stone-700">{d.requester}</strong></span>
                        <span>결정자: <strong className="text-amber-800 font-bold">{d.approver || '[결정자 확인 필요]'}</strong></span>
                        <span>비용 영향: <strong className="text-stone-700">{d.costImpact}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section: 담당자별 후속 조치 & 다음 주요 일정 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 담당자별 후속 조치 */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center space-x-2">
                <User className="w-4 h-4 text-stone-700" />
                <span>담당자별 후속 조치</span>
              </h2>
              <div className="space-y-2.5 text-xs">
                {records.filter((r) => r.status !== '완료' && r.followUpAction && r.followUpAction !== '확인 필요').length === 0 ? (
                  <p className="text-stone-500">배정된 후속 조치가 없습니다.</p>
                ) : (
                  records.filter((r) => r.status !== '완료' && r.followUpAction && r.followUpAction !== '확인 필요').map((r) => (
                    <div key={r.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-stone-900">
                          <span className="text-stone-400 font-mono mr-1">[{r.recordNumber}]</span>
                          {r.followUpAction}
                        </div>
                        <div className="text-stone-500 mt-1 flex items-center space-x-3 text-[11px]">
                          <span>담당자: <strong className="text-stone-800">{r.assignee || '확인 필요'}</strong></span>
                          <span>예정일: <strong className="text-stone-800 font-mono">{r.dueDate}</strong></span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-200 text-stone-800 ml-2">
                        {r.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 다음 주요 일정 */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-stone-700" />
                <span>다음 주요 일정</span>
              </h2>
              <div className="space-y-2.5 text-xs">
                {records.filter((r) => r.dueDate && r.dueDate !== '확인 필요' && r.status !== '완료').length === 0 ? (
                  <p className="text-stone-500">예정된 일정이 없습니다.</p>
                ) : (
                  records
                    .filter((r) => r.dueDate && r.dueDate !== '확인 필요' && r.status !== '완료')
                    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                    .map((r) => (
                      <div key={r.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="font-mono text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-1 rounded text-xs">
                            {r.dueDate}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900">[{r.recordNumber}] {r.title}</div>
                            <div className="text-stone-500 text-[11px]">담당: {r.assignee || '확인 필요'}</div>
                          </div>
                        </div>
                        <span className="text-xs text-stone-400 font-mono">{r.category}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
