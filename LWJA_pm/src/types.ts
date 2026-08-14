export type RecordCategory =
  | '회의'
  | '통화'
  | '현장'
  | '일정'
  | '요청'
  | '검토'
  | '의견'
  | '결정'
  | '변경'
  | '위험'
  | '완료'
  | '분류 확인 필요';

export type RecordStatus =
  | '확인 필요'
  | '검토 중'
  | '승인 대기'
  | '진행 중'
  | '완료'
  | '보류';

export type DecisionType = '결정' | '변경' | '결정 검토 중';

export interface Project {
  id: string;
  name: string;
  location: string;
  client: string;
  stage: string;
  scope: string;
  schedule: string;
  internalManager: string;
  externalPartners: string;
  reportDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordItem {
  id: string;
  recordNumber: string; // R-001, R-002...
  projectId: string;
  date: string; // YYYY.MM.DD
  category: RecordCategory;
  title: string;
  content: string;
  location?: string;
  photoDescription?: string;
  requester: string; // 요청자
  approver: string; // 결정자
  assignee: string; // 담당자
  dueDate: string; // 완료 예정일 (YYYY.MM.DD 또는 "확인 필요")
  status: RecordStatus;
  relatedRecordNumber?: string;
  followUpAction?: string;
  isDecisionOrChange?: boolean;
  decisionId?: string; // Links to D-001
  isCorrected?: boolean;
  correctionNote?: string;
  createdAt?: string;
}

export interface DecisionChangeItem {
  id: string;
  decisionNumber: string; // D-001, D-002...
  projectId: string;
  date: string; // YYYY.MM.DD
  type: DecisionType;
  title: string;
  isConfirmed: boolean; // true = 확정, false = [미확정]
  content: string;
  beforeChange?: string;
  afterChange?: string;
  reason?: string;
  requester: string;
  approver: string;
  relatedAssignee: string;
  costImpact: string; // e.g., "비용 영향 없음", "비용 영향 미확인", "증액 예상 (확인 필요)"
  scheduleImpact: string; // e.g., "일정 영향 없음", "일정 영향 미확인", "공기 10일 연장 우려"
  followUpAction: string;
  dueDate: string;
  status: RecordStatus;
  sourceRecordNumber: string; // e.g., "R-001"
}

export interface DelayWarning {
  recordNumber: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: string;
  requiredAction: string;
}

export interface MissingFieldAlert {
  recordNumber: string;
  title: string;
  missingFields: string[];
  type: 'approver' | 'requester' | 'cost' | 'schedule' | 'assignee' | 'clientApproval' | 'conflict';
  message: string;
}

export type ViewTab = 'dashboard' | 'records' | 'decisions' | 'report' | 'chat';
