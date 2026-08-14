import React, { useState } from 'react';
import { RecordItem, RecordCategory, RecordStatus } from '../types';
import { isOverdue } from '../utils/dateUtils';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Camera, 
  User, 
  Calendar, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface RecordListProps {
  records: RecordItem[];
  reportDate: string;
  onOpenAddRecord: () => void;
  onEditRecord: (record: RecordItem) => void;
  onDeleteRecord: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({
  records,
  reportDate,
  onOpenAddRecord,
  onEditRecord,
  onDeleteRecord,
  onToggleComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: RecordCategory[] = [
    '회의', '통화', '현장', '일정', '요청', '검토', '의견', '결정', '변경', '위험', '완료'
  ];

  const statuses: RecordStatus[] = [
    '확인 필요', '검토 중', '승인 대기', '진행 중', '완료', '보류'
  ];

  const filteredRecords = records.filter((r) => {
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.recordNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.assignee.toLowerCase().includes(q) ||
        (r.requester && r.requester.toLowerCase().includes(q)) ||
        (r.approver && r.approver.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                R-001 순번 아카이브
              </span>
              <span className="text-xs text-stone-500 font-mono">
                총 {records.length}건 등록됨
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              전체 업무 기록 대장
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              사실과 의견, 요청과 결정을 구분하여 기록번호 순서대로 체계적으로 축적합니다.
            </p>
          </div>

          <button
            id="btn-add-record-main"
            onClick={onOpenAddRecord}
            className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>신규 업무 기록 추가</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-stone-100 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="기록번호(R-001), 제목, 내용, 담당자 검색..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">모든 종류 (회의, 통화, 현장, 일정, 요청 등)</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">모든 상태 (진행 중, 검토 중, 승인 대기 등)</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Record Cards */}
      <div className="space-y-3">
        {sortedRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <div className="font-semibold text-stone-700">검색 조건에 일치하는 기록이 없습니다.</div>
            <div className="text-xs text-stone-400 mt-1">새로운 업무 기록을 추가하거나 필터를 재설정해 주세요.</div>
          </div>
        ) : (
          sortedRecords.map((r) => {
            const isItemOverdue = isOverdue(r.dueDate, reportDate, r.status);
            const isExpanded = expandedId === r.id;

            return (
              <div
                key={r.id}
                className={`bg-white rounded-xl border shadow-xs transition-all overflow-hidden ${
                  isItemOverdue
                    ? 'border-red-300 bg-red-50/10'
                    : r.status === '완료'
                    ? 'border-stone-200 opacity-90'
                    : 'border-stone-200 hover:border-amber-400'
                }`}
              >
                {/* Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="p-4 sm:p-4.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                    {/* Record Number Badge */}
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-stone-900 text-white flex-shrink-0">
                      {r.recordNumber}
                    </span>

                    {/* Date */}
                    <span className="font-mono text-xs text-stone-500 font-semibold flex-shrink-0">
                      {r.date}
                    </span>

                    {/* Category */}
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-stone-100 text-stone-700 flex-shrink-0">
                      {r.category}
                    </span>

                    {/* Title */}
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-semibold text-stone-900 text-sm">{r.title}</span>
                      {r.isCorrected && (
                        <span className="ml-2 text-[11px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                          정정됨
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Status Badges & Quick Info */}
                  <div className="flex items-center space-x-2.5 self-end sm:self-auto text-xs flex-shrink-0">
                    {isItemOverdue && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>지연</span>
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                      r.status === '완료' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === '승인 대기' ? 'bg-amber-100 text-amber-800' :
                      r.status === '검토 중' ? 'bg-blue-100 text-blue-800' :
                      r.status === '진행 중' ? 'bg-indigo-100 text-indigo-800' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {r.status}
                    </span>

                    <span className="text-stone-400 font-mono hidden md:inline">
                      담당: {r.assignee || '미지정'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : r.id);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-stone-100 space-y-3.5 text-xs bg-stone-50/50">
                    {/* Full Content */}
                    <div>
                      <div className="font-semibold text-stone-700 text-xs mb-1">상세 내용:</div>
                      <p className="text-stone-800 bg-white p-3 rounded-lg border border-stone-200 leading-relaxed whitespace-pre-wrap">
                        {r.content}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <div className="text-stone-400 font-medium text-[11px] flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-stone-500" />
                          <span>장소</span>
                        </div>
                        <div className="font-semibold text-stone-800 mt-0.5 truncate">{r.location || '확인 필요'}</div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <div className="text-stone-400 font-medium text-[11px] flex items-center space-x-1">
                          <User className="w-3 h-3 text-stone-500" />
                          <span>요청자 / 결정자</span>
                        </div>
                        <div className="font-semibold text-stone-800 mt-0.5 truncate">
                          {r.requester || '요청자 확인 필요'} / {r.approver || '결정자 확인 필요'}
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <div className="text-stone-400 font-medium text-[11px] flex items-center space-x-1">
                          <User className="w-3 h-3 text-stone-500" />
                          <span>담당자</span>
                        </div>
                        <div className="font-semibold text-stone-800 mt-0.5 truncate">{r.assignee || '확인 필요'}</div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-stone-200">
                        <div className="text-stone-400 font-medium text-[11px] flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-stone-500" />
                          <span>완료 예정일</span>
                        </div>
                        <div className={`font-semibold font-mono mt-0.5 ${isItemOverdue ? 'text-red-600 font-bold' : 'text-stone-800'}`}>
                          {r.dueDate || '확인 필요'}
                        </div>
                      </div>
                    </div>

                    {/* Photo Description (Section 9) */}
                    {r.photoDescription && (
                      <div className="bg-white p-2.5 rounded border border-stone-200 flex items-start space-x-2 text-stone-700">
                        <Camera className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-stone-900">관련 사진 설명:</span> {r.photoDescription}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Action */}
                    {r.followUpAction && (
                      <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200 text-stone-800">
                        <span className="font-semibold text-amber-950">후속 조치:</span> {r.followUpAction}
                      </div>
                    )}

                    {/* Linked Decision */}
                    {r.decisionId && (
                      <div className="bg-purple-50/60 p-2.5 rounded border border-purple-200 text-purple-950 flex items-center space-x-2">
                        <span className="font-semibold">연계 의사결정·변경 번호:</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200">{r.decisionId}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                      <button
                        onClick={() => onToggleComplete(r.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{r.status === '완료' ? '진행 중으로 변경' : '완료 처리'}</span>
                      </button>

                      <button
                        onClick={() => onEditRecord(r)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>수정</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`[${r.recordNumber}] 기록을 정말 삭제하시겠습니까?`)) {
                            onDeleteRecord(r.id);
                          }
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
