import React, { useState } from 'react';
import { Project, ViewTab } from '../types';
import { LwjaLogo } from './LwjaLogo';
import { 
  Building2, 
  Plus, 
  FolderKanban, 
  Calendar, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw,
  CheckCircle2,
  FileText,
  MessageSquareCode
} from 'lucide-react';

interface HeaderProps {
  projects: Project[];
  currentProject: Project;
  onSelectProject: (proj: Project) => void;
  onOpenNewProjectModal: () => void;
  onOpenEditProjectModal: () => void;
  onOpenAddRecordModal: () => void;
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  recordCount: number;
  decisionCount: number;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
  onUpdateReportDate: (newDate: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  currentProject,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
  onOpenAddRecordModal,
  currentTab,
  onSelectTab,
  recordCount,
  decisionCount,
  onExportData,
  onImportData,
  onResetSampleData,
  onUpdateReportDate,
}) => {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      {/* Top Bar: Brand, Project Switcher, Date, Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Project Selector */}
          <div className="flex items-center space-x-4 min-w-0">
            <LwjaLogo 
              size="sm"
              variant="badge"
              showText={true}
              subtitle="건축·공간기획·PM 기록 및 보고 도우미"
            />

            <div className="h-6 w-px bg-stone-700 hidden sm:block" />

            {/* Project Dropdown */}
            <div className="relative">
              <button
                id="btn-project-selector"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center space-x-2 bg-stone-800 hover:bg-stone-700 text-stone-100 px-3 py-1.5 rounded-md text-sm font-medium border border-stone-700 transition-colors max-w-[260px] sm:max-w-xs truncate"
                title="프로젝트 선택"
              >
                <FolderKanban className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">{currentProject?.name || '프로젝트 선택'}</span>
                <span className="text-xs bg-stone-900 px-1.5 py-0.5 rounded text-amber-300 font-mono flex-shrink-0">
                  {recordCount}건
                </span>
              </button>

              {showProjectDropdown && (
                <div className="absolute left-0 mt-2 w-80 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-stone-400 border-b border-stone-700 flex justify-between items-center">
                    <span>프로젝트 목록 ({projects.length})</span>
                    <button
                      onClick={() => {
                        setShowProjectDropdown(false);
                        onOpenNewProjectModal();
                      }}
                      className="text-amber-400 hover:text-amber-300 flex items-center text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> 새 프로젝트
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-700/50">
                    {projects.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-stone-700/70 transition-colors flex items-start space-x-2 ${
                          proj.id === currentProject?.id ? 'bg-amber-950/40 text-amber-200 font-medium' : 'text-stone-300'
                        }`}
                      >
                        <Building2 className="w-4 h-4 mt-0.5 text-stone-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{proj.name}</div>
                          <div className="text-xs text-stone-400 truncate">{proj.stage} · {proj.client}</div>
                        </div>
                        {proj.id === currentProject?.id && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

              <button
                id="btn-edit-project"
                onClick={onOpenEditProjectModal}
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors hidden sm:inline-flex"
                title="프로젝트 기본정보 수정"
              >
                <Settings className="w-4 h-4" />
              </button>
          </div>

          {/* Right Actions: Date, Add Record, Data Menu */}
          <div className="flex items-center space-x-2.5">
            {/* Report Reference Date Input */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-stone-800/80 border border-stone-700 px-2.5 py-1 rounded text-xs text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>기준일:</span>
              <input
                type="text"
                value={currentProject?.reportDate || ''}
                onChange={(e) => onUpdateReportDate(e.target.value)}
                placeholder="YYYY.MM.DD"
                className="bg-transparent text-stone-100 font-mono text-xs w-24 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1"
                title="보고 기준일 (YYYY.MM.DD)"
              />
            </div>

            {/* Quick Add Record Button */}
            <button
              id="btn-add-record"
              onClick={onOpenAddRecordModal}
              className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>기록 추가</span>
            </button>

            {/* More / Data Menu */}
            <div className="relative">
              <button
                id="btn-data-menu"
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="p-2 text-stone-300 hover:text-stone-100 hover:bg-stone-800 rounded-md transition-colors"
                title="데이터 관리 및 초기화"
              >
                <FileText className="w-4 h-4" />
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-stone-400 border-b border-stone-700">
                    데이터 보관 및 복원
                  </div>
                  <button
                    onClick={() => {
                      setShowDataMenu(false);
                      onExportData();
                    }}
                    className="w-full text-left px-3 py-2 text-stone-200 hover:bg-stone-700 flex items-center space-x-2"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>전체 데이터 백업 (JSON)</span>
                  </button>
                  <label className="w-full text-left px-3 py-2 text-stone-200 hover:bg-stone-700 flex items-center space-x-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>데이터 불러오기 (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        setShowDataMenu(false);
                        onImportData(e);
                      }}
                      className="hidden"
                    />
                  </label>
                  <div className="border-t border-stone-700 my-1" />
                  <button
                    onClick={() => {
                      setShowDataMenu(false);
                      onResetSampleData();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-300 hover:bg-rose-950/50 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>샘플 데이터로 재설정</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-stone-800 pt-1 pb-2">
          <button
            id="tab-dashboard"
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span>📊 프로젝트 현황 (결과 1)</span>
          </button>

          <button
            id="tab-decisions"
            onClick={() => onSelectTab('decisions')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              currentTab === 'decisions'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span>⚖️ 의사결정·변경 기록 ({decisionCount}) (결과 2)</span>
          </button>

          <button
            id="tab-report"
            onClick={() => onSelectTab('report')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              currentTab === 'report'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span>✉️ 건축주 보고문 (결과 3)</span>
          </button>

          <button
            id="tab-records"
            onClick={() => onSelectTab('records')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              currentTab === 'records'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span>📋 전체 업무 기록 ({recordCount})</span>
          </button>

          <button
            id="tab-chat"
            onClick={() => onSelectTab('chat')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              currentTab === 'chat'
                ? 'bg-amber-600/90 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>💬 AI 실무 어시스턴트 & 명령</span>
          </button>
        </div>
      </div>
    </header>
  );
};
