import React, { useState, useEffect } from 'react';
import { Project, RecordItem, DecisionChangeItem, RecordCategory, RecordStatus, DecisionType } from '../types';
import { getTodayFormatted, formatDate } from '../utils/dateUtils';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Camera, 
  MapPin, 
  User, 
  Calendar, 
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (
    record: Partial<RecordItem>, 
    decisionData?: Partial<DecisionChangeItem> | null
  ) => void;
  currentProject: Project;
  nextRecordNumber: string;
  nextDecisionNumber: string;
  editingRecord?: RecordItem | null;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSaveRecord,
  currentProject,
  nextRecordNumber,
  nextDecisionNumber,
  editingRecord,
}) => {
  const [activeMode, setActiveMode] = useState<'smart' | 'manual'>('manual');
  const [rawMemo, setRawMemo] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // Form Fields
  const [recordNumber, setRecordNumber] = useState(nextRecordNumber);
  const [date, setDate] = useState(getTodayFormatted());
  const [category, setCategory] = useState<RecordCategory>('회의');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [approver, setApprover] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<RecordStatus>('진행 중');
  const [relatedRecordNumber, setRelatedRecordNumber] = useState('');
  const [followUpAction, setFollowUpAction] = useState('');

  // Decision & Change sub-form toggle
  const [isDecisionOrChange, setIsDecisionOrChange] = useState(false);
  const [decisionNumber, setDecisionNumber] = useState(nextDecisionNumber);
  const [decisionType, setDecisionType] = useState<DecisionType>('결정');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [beforeChange, setBeforeChange] = useState('');
  const [afterChange, setAfterChange] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [costImpact, setCostImpact] = useState('비용 영향 미확인');
  const [scheduleImpact, setScheduleImpact] = useState('일정 영향 미확인');

  useEffect(() => {
    if (editingRecord) {
      setActiveMode('manual');
      setRecordNumber(editingRecord.recordNumber);
      setDate(editingRecord.date);
      setCategory(editingRecord.category);
      setTitle(editingRecord.title);
      setContent(editingRecord.content);
      setLocation(editingRecord.location || '');
      setPhotoDescription(editingRecord.photoDescription || '');
      setRequester(editingRecord.requester || '');
      setApprover(editingRecord.approver || '');
      setAssignee(editingRecord.assignee || '');
      setDueDate(editingRecord.dueDate || '');
      setStatus(editingRecord.status);
      setRelatedRecordNumber(editingRecord.relatedRecordNumber || '');
      setFollowUpAction(editingRecord.followUpAction || '');
      setIsDecisionOrChange(editingRecord.isDecisionOrChange || false);
    } else {
      setRecordNumber(nextRecordNumber);
      setDecisionNumber(nextDecisionNumber);
      setDate(getTodayFormatted());
      setCategory('회의');
      setTitle('');
      setContent('');
      setLocation(currentProject?.location || '');
      setPhotoDescription('');
      setRequester('');
      setApprover('');
      setAssignee(currentProject?.internalManager?.split(',')[0] || '');
      setDueDate('');
      setStatus('진행 중');
      setRelatedRecordNumber('');
      setFollowUpAction('');
      setIsDecisionOrChange(false);
      setBeforeChange('');
      setAfterChange('');
      setChangeReason('');
      setCostImpact('비용 영향 미확인');
      setScheduleImpact('일정 영향 미확인');
      setParseNotice(null);
    }
  }, [editingRecord, nextRecordNumber, nextDecisionNumber, currentProject, isOpen]);

  if (!isOpen) return null;

  const handleSmartParse = async () => {
    if (!rawMemo.trim()) return;
    setIsParsing(true);
    setParseNotice(null);

    try {
      const res = await fetch('/api/parse-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawMemo,
          currentProject,
          nextRecordNum: recordNumber,
          nextDecisionNum: decisionNumber,
        }),
      });

      const data = await res.json();
      if (data.parsedRecord) {
        const p = data.parsedRecord;
        if (p.date) setDate(formatDate(p.date));
        if (p.category) setCategory(p.category);
        if (p.title) setTitle(p.title);
        if (p.content) setContent(p.content);
        if (p.location) setLocation(p.location);
        if (p.photoDescription) setPhotoDescription(p.photoDescription);
        if (p.requester) setRequester(p.requester);
        if (p.approver) setApprover(p.approver);
        if (p.assignee) setAssignee(p.assignee);
        if (p.dueDate) setDueDate(formatDate(p.dueDate));
        if (p.status) setStatus(p.status);
        if (p.followUpAction) setFollowUpAction(p.followUpAction);

        if (p.isDecisionOrChange && p.decisionChangeData) {
          setIsDecisionOrChange(true);
          const d = p.decisionChangeData;
          if (d.type) setDecisionType(d.type);
          if (d.isConfirmed !== undefined) setIsConfirmed(d.isConfirmed);
          if (d.beforeChange) setBeforeChange(d.beforeChange);
          if (d.afterChange) setAfterChange(d.afterChange);
          if (d.reason) setChangeReason(d.reason);
          if (d.costImpact) setCostImpact(d.costImpact);
          if (d.scheduleImpact) setScheduleImpact(d.scheduleImpact);
        }

        const missing = p.missingFields && p.missingFields.length > 0 ? p.missingFields.join(', ') : '없음';
        setParseNotice(`AI 구조화 완료: 확인 필요 항목: [${missing}]`);
        setActiveMode('manual'); // Switch to review in manual form
      }
    } catch (err) {
      console.error('Smart parse error:', err);
      setParseNotice('AI 분석 중 오류가 발생했습니다. 직접 입력 양식으로 작성해 주세요.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('기록 제목을 입력해 주세요.');
      return;
    }

    const recordData: Partial<RecordItem> = {
      recordNumber,
      date: formatDate(date),
      category,
      title: title.trim(),
      content: content.trim() || title.trim(),
      location: location.trim() || '확인 필요',
      photoDescription: photoDescription.trim(),
      requester: requester.trim() || '확인 필요',
      approver: approver.trim() || '확인 필요',
      assignee: assignee.trim() || '확인 필요',
      dueDate: dueDate.trim() ? formatDate(dueDate) : '확인 필요',
      status,
      relatedRecordNumber: relatedRecordNumber.trim(),
      followUpAction: followUpAction.trim() || '확인 필요',
      isDecisionOrChange,
      decisionId: isDecisionOrChange ? decisionNumber : undefined,
    };

    let decisionData: Partial<DecisionChangeItem> | null = null;
    if (isDecisionOrChange || category === '결정' || category === '변경') {
      decisionData = {
        decisionNumber,
        date: formatDate(date),
        type: category === '변경' ? '변경' : decisionType,
        title: title.trim(),
        isConfirmed: isConfirmed || approver === currentProject.client,
        content: content.trim() || title.trim(),
        beforeChange: beforeChange.trim() || '해당없음',
        afterChange: afterChange.trim() || content.trim(),
        reason: changeReason.trim() || '공간품질 향상 및 요구사항 반영',
        requester: requester.trim() || '확인 필요',
        approver: approver.trim() || '승인 대기',
        relatedAssignee: assignee.trim() || '확인 필요',
        costImpact: costImpact.trim() || '비용 영향 미확인',
        scheduleImpact: scheduleImpact.trim() || '일정 영향 미확인',
        followUpAction: followUpAction.trim() || '후속 조치 계획 수립',
        dueDate: dueDate.trim() ? formatDate(dueDate) : '확인 필요',
        status,
        sourceRecordNumber: recordNumber,
      };
    }

    onSaveRecord(recordData, decisionData);
    onClose();
  };

  const categories: RecordCategory[] = [
    '회의', '통화', '현장', '일정', '요청', '검토', '의견', '결정', '변경', '위험', '완료'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs bg-amber-600 text-white font-bold px-2 py-0.5 rounded">
                {recordNumber}
              </span>
              <span className="text-xs text-stone-400">
                {currentProject?.name}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {editingRecord ? '업무 기록 수정' : '신규 업무 기록 추가'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!editingRecord && (
          <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-3">
            <button
              onClick={() => setActiveMode('manual')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeMode === 'manual'
                  ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>직접 입력 (표준 양식)</span>
            </button>

            <button
              onClick={() => setActiveMode('smart')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeMode === 'smart'
                  ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>🪄 AI 메모/통화/회의록 자동 구조화</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Smart Parse Mode UI */}
          {activeMode === 'smart' && (
            <div className="space-y-4 bg-amber-50/40 p-5 rounded-xl border border-amber-200">
              <div>
                <label className="font-semibold text-stone-800 flex items-center justify-between">
                  <span>자유 메모 / 카카오톡 대화 / 통화 내용 붙여넣기</span>
                  <span className="text-[11px] text-amber-800 font-normal">
                    사실, 의견, 결정, 비용/일정 영향 및 누락 항목을 자동 분석합니다.
                  </span>
                </label>
                <textarea
                  value={rawMemo}
                  onChange={(e) => setRawMemo(e.target.value)}
                  rows={7}
                  placeholder={`예시:
2026.08.14 한남동 현장에서 건축주 이도현 대표님과 미팅함.
2층 테라스 바닥재를 방부목 대신 이태리산 포세린 타일로 변경 요청하심.
시공비 증액 여부는 견적팀에서 다음주 수요일까지 확인하기로 함.
결정권자는 건축주 승인 대기 상태임.`}
                  className="w-full mt-2 p-3 bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-xs leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleSmartParse}
                disabled={isParsing || !rawMemo.trim()}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>실무 원칙에 맞춰 AI 구조화 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>이우진어소시에이트 표준 규격으로 추출하기</span>
                  </>
                )}
              </button>

              {parseNotice && (
                <div className="bg-white p-3 rounded-lg border border-amber-300 text-amber-900 font-medium">
                  {parseNotice}
                </div>
              )}
            </div>
          )}

          {/* Structured Form (Always available or loaded after smart parsing) */}
          <form id="record-form" onSubmit={handleSubmit} className="space-y-4">
            
            {parseNotice && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg font-medium flex items-center justify-between">
                <span>{parseNotice}</span>
                <span className="text-[11px] text-emerald-700">양식 확인 후 저장해 주세요.</span>
              </div>
            )}

            {/* Row 1: Number, Date, Category, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">기록번호 (순번)</label>
                <input
                  type="text"
                  value={recordNumber}
                  onChange={(e) => setRecordNumber(e.target.value)}
                  className="w-full p-2 bg-stone-100 border border-stone-300 rounded-lg font-mono font-bold text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">날짜 (YYYY.MM.DD)</label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="YYYY.MM.DD"
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-stone-900 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setDate(getTodayFormatted())}
                    className="px-2 bg-stone-100 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-200 font-medium"
                    title="오늘 날짜 적용"
                  >
                    오늘
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">기록 종류</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as RecordCategory;
                    setCategory(cat);
                    if (cat === '결정' || cat === '변경') {
                      setIsDecisionOrChange(true);
                      setDecisionType(cat === '변경' ? '변경' : '결정');
                    }
                  }}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg font-medium text-stone-900 focus:ring-1 focus:ring-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">진행 상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RecordStatus)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg font-medium text-stone-900 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="진행 중">진행 중</option>
                  <option value="검토 중">검토 중</option>
                  <option value="승인 대기">승인 대기</option>
                  <option value="완료">완료</option>
                  <option value="보류">보류</option>
                  <option value="확인 필요">확인 필요</option>
                </select>
              </div>
            </div>

            {/* Row 2: Title */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                기록 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 2층 복합 카페테리아 층고 상향 및 구조 보강 협의"
                className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-stone-900 font-semibold text-sm focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            {/* Row 3: Content */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                상세 내용 (사실 / 의견 / 논의사항 분리)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="회의 또는 현장에서 확인된 구체적인 사실 관계, 당사자들의 논의 내용 및 요청 사항을 상세히 기술하세요."
                className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-stone-900 leading-relaxed focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Row 4: Location & Photo Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">회의 / 발생 장소</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 한남동 대지 현장 / 대회의실 / 확인 필요"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  관련 사진 설명 (촬영일 / 위치 등)
                </label>
                <input
                  type="text"
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="예: 북측 경계선 측량 말뚝 및 도시가스 맨홀 확인 사진"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
                />
              </div>
            </div>

            {/* Row 5: Requester, Approver, Assignee, Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">요청자</label>
                <input
                  type="text"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  placeholder="예: 건축주 / A-Lab"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  결정자 / 승인 주체
                </label>
                <input
                  type="text"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder="예: 이도현 대표 / 승인 대기"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">내부 담당자</label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="예: 박정우 수석PM"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">완료 예정일</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="YYYY.MM.DD"
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-stone-900"
                />
              </div>
            </div>

            {/* Row 6: Follow-up action */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                후속 조치 (할 일)
              </label>
              <input
                type="text"
                value={followUpAction}
                onChange={(e) => setFollowUpAction(e.target.value)}
                placeholder="예: 구조계산서 보강 및 공사비 산출서 작성 후 차주 보고"
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            {/* Section: Decision / Change Log linkage */}
            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 p-3 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  checked={isDecisionOrChange}
                  onChange={(e) => setIsDecisionOrChange(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="font-semibold text-purple-950">
                  ⚖️ 의사결정·변경 기록(D-001 대장)으로 함께 등록 및 관리
                </span>
              </label>
            </div>

            {isDecisionOrChange && (
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between font-semibold text-purple-950">
                  <span>의사결정·변경 세부 속성 ({decisionNumber})</span>
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="w-3.5 h-3.5 text-purple-600 rounded"
                    />
                    <span>확정 승인 완료 (체크 해제 시 [미확정])</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">변경 전 내용</label>
                    <textarea
                      value={beforeChange}
                      onChange={(e) => setBeforeChange(e.target.value)}
                      rows={2}
                      placeholder="기존 계획 또는 당초 안"
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">변경 후 내용</label>
                    <textarea
                      value={afterChange}
                      onChange={(e) => setAfterChange(e.target.value)}
                      rows={2}
                      placeholder="신규 변경 안 또는 결정된 스펙"
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">변경 사유</label>
                    <input
                      type="text"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="예: 2층 쾌적성 향상 및 건축주 요청"
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">비용 영향 (엄격 구분)</label>
                    <select
                      value={costImpact}
                      onChange={(e) => setCostImpact(e.target.value)}
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg font-medium"
                    >
                      <option value="비용 영향 미확인">비용 영향 미확인 (확인 필요)</option>
                      <option value="비용 영향 없음">비용 영향 없음 (기존 예산 내)</option>
                      <option value="공사비 증액 예상 (금액 산출 중)">공사비 증액 예상 (금액 산출 중)</option>
                      <option value="공사비 절감 (VE)">공사비 절감 (VE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">일정 영향 (엄격 구분)</label>
                    <select
                      value={scheduleImpact}
                      onChange={(e) => setScheduleImpact(e.target.value)}
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg font-medium"
                    >
                      <option value="일정 영향 미확인">일정 영향 미확인 (검토 중)</option>
                      <option value="일정 영향 없음">일정 영향 없음 (공기 준수)</option>
                      <option value="공기 연장 우려 (인허가/도면 보완)">공기 연장 우려 (인허가/도면 보완)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 text-xs transition-colors"
          >
            취소
          </button>

          <button
            type="submit"
            form="record-form"
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-sm text-xs transition-colors"
          >
            {editingRecord ? '기록 수정 완료' : '기록 저장하기'}
          </button>
        </div>

      </div>
    </div>
  );
};
