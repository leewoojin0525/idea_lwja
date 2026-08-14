import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { getTodayFormatted, formatDate } from '../utils/dateUtils';
import { X, Building2, MapPin, User, Calendar, FileText, Layers, Users } from 'lucide-react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (projectData: Partial<Project>) => void;
  currentProject?: Project | null;
  isNew?: boolean;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  currentProject,
  isNew = false,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [client, setClient] = useState('');
  const [stage, setStage] = useState('실시설계 및 시공사 선정 PM');
  const [scope, setScope] = useState('');
  const [schedule, setSchedule] = useState('');
  const [internalManager, setInternalManager] = useState('');
  const [externalPartners, setExternalPartners] = useState('');
  const [reportDate, setReportDate] = useState(getTodayFormatted());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentProject && !isNew) {
      setName(currentProject.name || '');
      setLocation(currentProject.location || '');
      setClient(currentProject.client || '');
      setStage(currentProject.stage || '실시설계 및 시공사 선정 PM');
      setScope(currentProject.scope || '');
      setSchedule(currentProject.schedule || '');
      setInternalManager(currentProject.internalManager || '');
      setExternalPartners(currentProject.externalPartners || '');
      setReportDate(currentProject.reportDate || getTodayFormatted());
      setNotes(currentProject.notes || '');
    } else {
      setName('');
      setLocation('');
      setClient('');
      setStage('기획 및 기본설계 검토');
      setScope('건축·공간기획 총괄, 공정 관리');
      setSchedule('');
      setInternalManager('이우진 대표');
      setExternalPartners('');
      setReportDate(getTodayFormatted());
      setNotes('');
    }
  }, [currentProject, isNew, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('프로젝트명을 입력해 주세요.');
      return;
    }

    const data: Partial<Project> = {
      name: name.trim(),
      location: location.trim() || '확인 필요',
      client: client.trim() || '확인 필요',
      stage: stage.trim() || '확인 필요',
      scope: scope.trim() || '확인 필요',
      schedule: schedule.trim() || '확인 필요',
      internalManager: internalManager.trim() || '확인 필요',
      externalPartners: externalPartners.trim() || '확인 필요',
      reportDate: formatDate(reportDate),
      notes: notes.trim(),
    };

    onSaveProject(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-white">
              {isNew ? '새 프로젝트 생성' : '프로젝트 기본정보 수정'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form id="project-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              프로젝트명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 한남동 복합문화공간 신축 PM"
              className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-stone-900 font-semibold text-sm focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">대지 위치</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 서울특별시 용산구 한남동 68-12"
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-semibold mb-1">건축주 / 발주자</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="예: (주)한남아트스페이스 이도현 대표"
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">진행 단계</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-lg font-medium text-stone-900"
              >
                <option value="기획 및 기본설계 검토">기획 및 기본설계 검토</option>
                <option value="실시설계 및 시공사 선정 PM">실시설계 및 시공사 선정 PM</option>
                <option value="인허가 및 착공 준비">인허가 및 착공 준비</option>
                <option value="시공 및 공정관리 (PM)">시공 및 공정관리 (PM)</option>
                <option value="인테리어/공간기획 및 감리">인테리어/공간기획 및 감리</option>
                <option value="준공 및 인수인계">준공 및 인수인계</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-semibold mb-1">보고 기준일</label>
              <input
                type="text"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="YYYY.MM.DD"
                className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">업무 범위</label>
            <input
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="예: 건축·공간기획 총괄, 시공사 입찰 및 VE(가치공학) 검토, 인허가 공정 관리"
              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">주요 일정 (마일스톤)</label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="예: 2026.04 기획완료 → 2026.09 착공 → 2027.10 준공"
              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-semibold mb-1">내부 담당자</label>
              <input
                type="text"
                value={internalManager}
                onChange={(e) => setInternalManager(e.target.value)}
                placeholder="예: 이우진 대표, 박정우 PM"
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-semibold mb-1">외부 협력자 (설계/구조/감리)</label>
              <input
                type="text"
                value={externalPartners}
                onChange={(e) => setExternalPartners(e.target.value)}
                placeholder="예: A-Lab 건축사, 삼우구조, 율촌CM"
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-semibold mb-1">특이사항 및 메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="프로젝트 특이사항, 주변 대지 이슈, 건축주 주요 니즈 등"
              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900 leading-relaxed"
            />
          </div>
        </form>

        {/* Footer */}
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
            form="project-form"
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-sm text-xs transition-colors"
          >
            {isNew ? '프로젝트 만들기' : '저장하기'}
          </button>
        </div>

      </div>
    </div>
  );
};
