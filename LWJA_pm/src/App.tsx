/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, RecordItem, DecisionChangeItem, ViewTab } from './types';
import { INITIAL_PROJECTS, INITIAL_RECORDS, INITIAL_DECISIONS } from './data/sampleProjects';
import { Header } from './components/Header';
import { ProjectStatusSummary } from './components/ProjectStatusSummary';
import { DecisionChangeLog } from './components/DecisionChangeLog';
import { ClientReportView } from './components/ClientReportView';
import { RecordList } from './components/RecordList';
import { AiAssistantConsole } from './components/AiAssistantConsole';
import { AddRecordModal } from './components/AddRecordModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { LwjaLogo } from './components/LwjaLogo';
import { formatDate } from './utils/dateUtils';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  X, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const STORAGE_KEY_PROJECTS = 'lw_projects_v1';
const STORAGE_KEY_RECORDS = 'lw_records_v1';
const STORAGE_KEY_DECISIONS = 'lw_decisions_v1';
const STORAGE_KEY_CURRENT_PID = 'lw_current_pid_v1';

export default function App() {
  // 1. Projects State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PROJECTS;
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_PID);
    return saved || INITIAL_PROJECTS[0].id;
  });

  // 2. Records State
  const [records, setRecords] = useState<RecordItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_RECORDS;
  });

  // 3. Decisions State
  const [decisions, setDecisions] = useState<DecisionChangeItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DECISIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DECISIONS;
  });

  // 4. View Tabs
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // 5. Modals State
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isNewProjectModal, setIsNewProjectModal] = useState(false);

  // 6. Conflict Resolution Modal State
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    existingRecord?: RecordItem;
    newDraft?: Partial<RecordItem>;
    diffNotes: string;
  }>({ isOpen: false, diffNotes: '' });

  // 7. Toast / Alert Banner State (Section 7 confirmation & Section 10 triggers)
  const [toastNotice, setToastNotice] = useState<{
    type: 'success' | 'alert' | 'trigger3';
    title: string;
    message: string;
  } | null>(null);

  // Persistence to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_PID, currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(decisions));
  }, [decisions]);

  // Derived current project and project records
  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];
  const projectRecords = records.filter((r) => r.projectId === currentProject?.id);
  const projectDecisions = decisions.filter((d) => d.projectId === currentProject?.id);

  // Next available Record & Decision numbers
  const nextRecordNum = `R-${String(projectRecords.length + 1).padStart(3, '0')}`;
  const nextDecisionNum = `D-${String(projectDecisions.length + 1).padStart(3, '0')}`;

  // Handler: Save / Update Record
  const handleSaveRecord = (
    recordData: Partial<RecordItem>,
    decisionData?: Partial<DecisionChangeItem> | null
  ) => {
    if (editingRecord) {
      // Check if existing content is substantially different (Conflict / Revision tracking)
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id === editingRecord.id) {
            return {
              ...r,
              ...recordData,
              isCorrected: true,
              correctionNote: `[${formatDate(new Date())} 수정 정정됨]`,
            } as RecordItem;
          }
          return r;
        })
      );

      setToastNotice({
        type: 'success',
        title: `${recordData.recordNumber || editingRecord.recordNumber} 기록이 수정되었습니다.`,
        message: '의사결정 및 건축주 보고문 데이터에 실시간 반영되었습니다.',
      });
      setEditingRecord(null);
    } else {
      // New Record
      const newRec: RecordItem = {
        id: `rec-${Date.now()}`,
        projectId: currentProject.id,
        recordNumber: recordData.recordNumber || nextRecordNum,
        date: recordData.date || formatDate(new Date()),
        category: recordData.category || '회의',
        title: recordData.title || '',
        content: recordData.content || '',
        location: recordData.location,
        photoDescription: recordData.photoDescription,
        requester: recordData.requester || '확인 필요',
        approver: recordData.approver || '확인 필요',
        assignee: recordData.assignee || '확인 필요',
        dueDate: recordData.dueDate || '확인 필요',
        status: recordData.status || '진행 중',
        relatedRecordNumber: recordData.relatedRecordNumber,
        followUpAction: recordData.followUpAction,
        isDecisionOrChange: !!decisionData || recordData.isDecisionOrChange,
        decisionId: decisionData?.decisionNumber || undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedRecords = [...records, newRec];
      setRecords(updatedRecords);

      // Save Decision if present
      if (decisionData) {
        const newDec: DecisionChangeItem = {
          id: `dec-${Date.now()}`,
          projectId: currentProject.id,
          decisionNumber: decisionData.decisionNumber || nextDecisionNum,
          date: decisionData.date || newRec.date,
          type: decisionData.type || '결정',
          title: decisionData.title || newRec.title,
          isConfirmed: decisionData.isConfirmed || false,
          content: decisionData.content || newRec.content,
          beforeChange: decisionData.beforeChange,
          afterChange: decisionData.afterChange,
          reason: decisionData.reason,
          requester: decisionData.requester || newRec.requester,
          approver: decisionData.approver || newRec.approver,
          relatedAssignee: decisionData.relatedAssignee || newRec.assignee,
          costImpact: decisionData.costImpact || '비용 영향 미확인',
          scheduleImpact: decisionData.scheduleImpact || '일정 영향 미확인',
          followUpAction: decisionData.followUpAction || newRec.followUpAction || '후속 조치 수립',
          dueDate: decisionData.dueDate || newRec.dueDate,
          status: decisionData.status || newRec.status,
          sourceRecordNumber: newRec.recordNumber,
        };
        setDecisions((prev) => [...prev, newDec]);
      }

      // Check missing fields for Section 7 notice
      const missingList: string[] = [];
      if (!newRec.assignee || newRec.assignee === '확인 필요') missingList.push('담당자');
      if (!newRec.dueDate || newRec.dueDate === '확인 필요') missingList.push('완료 예정일');
      if (newRec.isDecisionOrChange && (!newRec.approver || newRec.approver === '확인 필요' || newRec.approver === '승인 대기')) {
        missingList.push('결정자(승인 주체)');
      }

      const countInProject = updatedRecords.filter((r) => r.projectId === currentProject.id).length;

      // Section 10: Cumulative record triggers
      if (countInProject === 3) {
        setToastNotice({
          type: 'trigger3',
          title: `🎉 누적 기록 3건 달성!`,
          message: `${newRec.recordNumber} 기록 추가로 총 3건이 누적되어 현황 요약, 결정 기록, 건축주 보고문이 자동 완성되었습니다.`,
        });
      } else if (newRec.category === '위험') {
        setToastNotice({
          type: 'alert',
          title: `⚠️ 현장 위험 기록 등록 (${newRec.recordNumber})`,
          message: `지연 및 위험 관리 항목으로 지정되었습니다. 담당자 후속 조치를 확인하세요.`,
        });
      } else {
        // Standard Section 7 confirmation message
        setToastNotice({
          type: 'success',
          title: `${newRec.recordNumber} 기록이 추가되었습니다.`,
          message: `현재 누적 기록: ${countInProject}건 / 확인 필요 항목: ${missingList.length > 0 ? missingList.join(', ') : '없음'}`,
        });
      }
    }
  };

  // Handler: Delete record
  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    setToastNotice({
      type: 'success',
      title: '기록이 삭제되었습니다.',
      message: '관련 통계 및 보고서에 반영되었습니다.',
    });
  };

  // Handler: Toggle complete status
  const handleToggleComplete = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          const newStatus = r.status === '완료' ? '진행 중' : '완료';
          return { ...r, status: newStatus };
        }
        return r;
      })
    );
  };

  // Handler: Update Decision status (Approver confirmation)
  const handleUpdateDecisionStatus = (
    decisionId: string,
    status: any,
    isConfirmed: boolean,
    approverName?: string
  ) => {
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.id === decisionId) {
          return {
            ...d,
            status,
            isConfirmed,
            approver: approverName || d.approver,
          };
        }
        return d;
      })
    );
    setToastNotice({
      type: 'success',
      title: '의사결정 승인 상태가 업데이트되었습니다.',
      message: '건축주 보고문 및 현황 요약의 확정 결정사항에 반영되었습니다.',
    });
  };

  // Handler: Save Project Settings
  const handleSaveProject = (projectData: Partial<Project>) => {
    if (isNewProjectModal) {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name || '새 프로젝트',
        location: projectData.location || '확인 필요',
        client: projectData.client || '확인 필요',
        stage: projectData.stage || '기획 및 기본설계 검토',
        scope: projectData.scope || '확인 필요',
        schedule: projectData.schedule || '확인 필요',
        internalManager: projectData.internalManager || '이우진 대표',
        externalPartners: projectData.externalPartners || '확인 필요',
        reportDate: projectData.reportDate || formatDate(new Date()),
        notes: projectData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProj]);
      setCurrentProjectId(newProj.id);
      setToastNotice({
        type: 'success',
        title: `새 프로젝트 [${newProj.name}] 생성 완료`,
        message: '새로운 프로젝트 업무 기록을 추가할 수 있습니다.',
      });
    } else {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              ...projectData,
              updatedAt: new Date().toISOString(),
            } as Project;
          }
          return p;
        })
      );
      setToastNotice({
        type: 'success',
        title: '프로젝트 정보가 수정되었습니다.',
        message: '보고서 상단 기본정보에 즉시 반영되었습니다.',
      });
    }
  };

  // Handler: Export Backup JSON
  const handleExportData = () => {
    const backupData = {
      projects,
      records,
      decisions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `이우진어소시에이트_프로젝트데이터_${formatDate(new Date()).replace(/\./g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Import Backup JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.projects && parsed.records) {
          setProjects(parsed.projects);
          setRecords(parsed.records);
          if (parsed.decisions) setDecisions(parsed.decisions);
          if (parsed.projects.length > 0) setCurrentProjectId(parsed.projects[0].id);
          setToastNotice({
            type: 'success',
            title: '데이터를 성공적으로 불러왔습니다.',
            message: `프로젝트 ${parsed.projects.length}건, 업무 기록 ${parsed.records.length}건이 복원되었습니다.`,
          });
        }
      } catch (err) {
        alert('올바른 JSON 데이터 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  // Handler: Reset Sample Data
  const handleResetSampleData = () => {
    if (confirm('샘플 데이터(한남동 복합문화공간 신축 PM 등)로 초기화하시겠습니까? 현재 변경사항은 덮어씌워집니다.')) {
      setProjects(INITIAL_PROJECTS);
      setRecords(INITIAL_RECORDS);
      setDecisions(INITIAL_DECISIONS);
      setCurrentProjectId(INITIAL_PROJECTS[0].id);
      setToastNotice({
        type: 'success',
        title: '샘플 데이터로 재설정되었습니다.',
        message: '한남동 복합문화공간 신축 PM 실무 데이터 4건이 로드되었습니다.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col selection:bg-amber-200 selection:text-amber-900">
      
      {/* Header Bar */}
      <Header
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(proj) => setCurrentProjectId(proj.id)}
        onOpenNewProjectModal={() => {
          setIsNewProjectModal(true);
          setIsProjectSettingsOpen(true);
        }}
        onOpenEditProjectModal={() => {
          setIsNewProjectModal(false);
          setIsProjectSettingsOpen(true);
        }}
        onOpenAddRecordModal={() => {
          setEditingRecord(null);
          setIsAddRecordModalOpen(true);
        }}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        recordCount={projectRecords.length}
        decisionCount={projectDecisions.length}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetSampleData={handleResetSampleData}
        onUpdateReportDate={(newDate) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === currentProject.id ? { ...p, reportDate: newDate } : p))
          );
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Toast Notification Banner (Section 7 & 10) */}
        {toastNotice && (
          <div className={`mb-6 p-4 rounded-xl border shadow-sm flex items-start justify-between animate-fade-in ${
            toastNotice.type === 'trigger3'
              ? 'bg-amber-600 text-white border-amber-700'
              : toastNotice.type === 'alert'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-white text-stone-900 border-emerald-300 shadow-xs'
          }`}>
            <div className="flex items-start space-x-3">
              {toastNotice.type === 'trigger3' ? (
                <Sparkles className="w-5 h-5 text-amber-200 flex-shrink-0 mt-0.5" />
              ) : toastNotice.type === 'alert' ? (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              )}

              <div>
                <div className="font-bold text-sm leading-tight">{toastNotice.title}</div>
                <div className={`text-xs mt-1 leading-relaxed ${
                  toastNotice.type === 'trigger3' ? 'text-amber-100' : 'text-stone-600'
                }`}>
                  {toastNotice.message}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {toastNotice.type === 'trigger3' && (
                <button
                  onClick={() => {
                    setCurrentTab('report');
                    setToastNotice(null);
                  }}
                  className="px-3 py-1 bg-white text-amber-950 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                >
                  건축주 보고문 보기
                </button>
              )}
              <button
                onClick={() => setToastNotice(null)}
                className={`p-1 rounded hover:bg-black/10 transition-colors ${
                  toastNotice.type === 'trigger3' ? 'text-white' : 'text-stone-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: 프로젝트 현황 (Result 1) */}
        {currentTab === 'dashboard' && (
          <ProjectStatusSummary
            project={currentProject}
            records={projectRecords}
            decisions={projectDecisions}
            onOpenAddRecord={() => {
              setEditingRecord(null);
              setIsAddRecordModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: 의사결정·변경 기록 (Result 2) */}
        {currentTab === 'decisions' && (
          <DecisionChangeLog
            decisions={projectDecisions}
            onOpenAddDecision={() => {
              setEditingRecord(null);
              setIsAddRecordModalOpen(true);
            }}
            onUpdateDecisionStatus={handleUpdateDecisionStatus}
          />
        )}

        {/* Tab 3: 건축주 보고문 (Result 3 & Result 4) */}
        {currentTab === 'report' && (
          <ClientReportView
            project={currentProject}
            records={projectRecords}
            decisions={projectDecisions}
          />
        )}

        {/* Tab 4: 전체 업무 기록 대장 */}
        {currentTab === 'records' && (
          <RecordList
            records={projectRecords}
            reportDate={currentProject.reportDate}
            onOpenAddRecord={() => {
              setEditingRecord(null);
              setIsAddRecordModalOpen(true);
            }}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsAddRecordModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {/* Tab 5: AI 실무 어시스턴트 & 명령어 콘솔 */}
        {currentTab === 'chat' && (
          <AiAssistantConsole
            currentProject={currentProject}
            records={projectRecords}
            decisions={projectDecisions}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <LwjaLogo 
              size="xs" 
              variant="light" 
              showText={false} 
            />
            <div>
              <strong className="text-stone-800">이우진어소시에이트 (LEE WOOJIN ASSOCIATES)</strong> · 건축·공간기획·PM 기록 및 보고 시스템
            </div>
          </div>
          <div className="text-stone-400 text-center sm:text-right">
            건축적 판단, 법률적 판단, 공사비 산정 또는 계약상 책임을 임의로 확정하지 않습니다.
          </div>
        </div>
      </footer>

      {/* Add / Edit Record Modal */}
      <AddRecordModal
        isOpen={isAddRecordModalOpen}
        onClose={() => {
          setIsAddRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSaveRecord={handleSaveRecord}
        currentProject={currentProject}
        nextRecordNumber={editingRecord?.recordNumber || nextRecordNum}
        nextDecisionNumber={nextDecisionNum}
        editingRecord={editingRecord}
      />

      {/* Project Settings / New Project Modal */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        onSaveProject={handleSaveProject}
        currentProject={currentProject}
        isNew={isNewProjectModal}
      />

      {/* Conflict Resolution Modal (Section 16) */}
      {conflictState.isOpen && conflictState.existingRecord && conflictState.newDraft && (
        <ConflictResolutionModal
          isOpen={conflictState.isOpen}
          onClose={() => setConflictState({ isOpen: false, diffNotes: '' })}
          existingRecord={conflictState.existingRecord}
          newRecordDraft={conflictState.newDraft}
          diffNotes={conflictState.diffNotes}
          onResolve={(action) => {
            if (action === 'overwrite_with_corrected_tag') {
              handleSaveRecord(conflictState.newDraft!);
            } else if (action === 'add_as_new_record') {
              handleSaveRecord({ ...conflictState.newDraft, recordNumber: nextRecordNum });
            }
            setConflictState({ isOpen: false, diffNotes: '' });
          }}
        />
      )}

    </div>
  );
}
