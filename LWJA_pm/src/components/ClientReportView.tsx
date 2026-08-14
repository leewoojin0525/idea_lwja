import React, { useState, useEffect } from 'react';
import { Project, RecordItem, DecisionChangeItem } from '../types';
import { generateClientReportText, generateInternalNotes } from '../utils/reportGenerator';
import { 
  Copy, 
  Check, 
  Send, 
  Mail, 
  MessageCircle, 
  Printer, 
  Edit3, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

interface ClientReportViewProps {
  project: Project;
  records: RecordItem[];
  decisions: DecisionChangeItem[];
}

export const ClientReportView: React.FC<ClientReportViewProps> = ({
  project,
  records,
  decisions,
}) => {
  const [reportMode, setReportMode] = useState<'standard' | 'brief' | 'client' | 'internal'>('standard');
  const [reportText, setReportText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Re-generate report when records/decisions/mode change
  useEffect(() => {
    if (!isEditing) {
      const generated = generateClientReportText(project, records, decisions, reportMode);
      setReportText(generated);
    }
  }, [project, records, decisions, reportMode, isEditing]);

  const internalAlerts = generateInternalNotes(project, records, decisions);

  const handleCopyCodeBlock = (type: 'raw' | 'kakao' | 'email') => {
    let textToCopy = reportText;
    if (type === 'email') {
      const emailSubject = `[보고] ${project.name || '프로젝트'} 진행 상황 보고 (${project.reportDate || 'YYYY.MM.DD'} 기준) - 이우진어소시에이트\n\n`;
      textToCopy = emailSubject + reportText;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleAiRefine = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          records,
          decisions,
          mode: reportMode,
        }),
      });
      const data = await res.json();
      if (data.fullOutput) {
        // Extract code block content if present
        const codeBlockMatch = data.fullOutput.match(/```(?:\w+)?\n([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          setReportText(codeBlockMatch[1].trim());
        } else {
          setReportText(data.fullOutput);
        }
      }
    } catch (err) {
      console.error('AI Report Generation Error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleResetToDefault = () => {
    const generated = generateClientReportText(project, records, decisions, reportMode);
    setReportText(generated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                결과 3 · 실무 건축주 보고문
              </span>
              <span className="text-xs text-stone-500 font-mono">
                기준일: {project.reportDate || 'YYYY.MM.DD'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              건축주 보고문 작성
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              건축주에게 바로 전달할 수 있는 정중하고 간결한 단일 코드블록 텍스트 보고문입니다.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-copy-kakao"
              onClick={() => handleCopyCodeBlock('kakao')}
              className="inline-flex items-center space-x-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedType === 'kakao' ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
              <span>{copiedType === 'kakao' ? '복사 완료' : '카카오톡용 복사'}</span>
            </button>

            <button
              id="btn-copy-email"
              onClick={() => handleCopyCodeBlock('email')}
              className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedType === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{copiedType === 'email' ? '복사 완료' : '이메일용 복사 (제목 포함)'}</span>
            </button>

            <button
              id="btn-ai-refine"
              onClick={handleAiRefine}
              disabled={isAiGenerating}
              className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="AI 문장 다듬기 및 정밀 교정"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>{isAiGenerating ? 'AI 작성 중...' : 'AI 문장 정밀화'}</span>
            </button>

            <button
              id="btn-print-report"
              onClick={() => window.print()}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs transition-colors"
              title="인쇄 및 PDF 저장"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Mode Switcher & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-stone-100 text-xs">
          <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg">
            <button
              onClick={() => setReportMode('standard')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                reportMode === 'standard' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              표준 보고 (기본)
            </button>
            <button
              onClick={() => setReportMode('brief')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                reportMode === 'brief' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              간결 요약 (짧게)
            </button>
            <button
              onClick={() => setReportMode('client')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                reportMode === 'client' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              건축주 전송용
            </button>
            <button
              onClick={() => setReportMode('internal')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                reportMode === 'internal' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              내부 관리용 (비용/공정 포함)
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                isEditing ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? '직접 편집 중 (완료)' : '직접 수정'}</span>
            </button>

            {isEditing && (
              <button
                onClick={handleResetToDefault}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs text-stone-600 hover:text-stone-900 transition-colors"
                title="기본 생성본으로 복원"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>원래대로</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Code Block Container (Mandated by Section 14) */}
      <div className="bg-stone-900 rounded-xl border border-stone-800 shadow-lg overflow-hidden">
        {/* Code Block Top Chrome Bar */}
        <div className="bg-stone-950 px-4 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-700" />
            </div>
            <span className="font-mono text-stone-300 font-semibold pl-2">
              건축주_보고문_{project.reportDate || 'YYYYMMDD'}.txt
            </span>
          </div>

          <button
            id="btn-copy-raw-codeblock"
            onClick={() => handleCopyCodeBlock('raw')}
            className="inline-flex items-center space-x-1 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded font-mono text-xs transition-colors"
          >
            {copiedType === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'raw' ? '복사 완료' : '코드블록 복사'}</span>
          </button>
        </div>

        {/* Plain Text Code Block Display / Editor */}
        <div className="p-6">
          {isEditing ? (
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={24}
              className="w-full bg-transparent font-mono text-xs sm:text-sm text-stone-100 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500 rounded p-2 resize-y"
              placeholder="건축주 보고문 텍스트"
            />
          ) : (
            <pre className="font-mono text-xs sm:text-sm text-stone-100 whitespace-pre-wrap leading-relaxed select-all">
              {reportText}
            </pre>
          )}
        </div>
      </div>

      {/* Result 4: 내부 확인 필요사항 (Rendered OUTSIDE the code block as strictly mandated by Section 14 & 15) */}
      <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <h2 className="text-sm font-bold text-amber-950">
            [내부 확인 필요사항] · 건축주 보고문 미포함 내부 관리 메모
          </h2>
        </div>

        {internalAlerts.length === 0 ? (
          <p className="text-xs text-stone-600">
            현재 내부 검토 및 확인이 필요한 누락 항목(결정자 미확정, 비용 영향 미확인 등)이 없습니다.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {internalAlerts.map((alert, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-start space-x-2 text-stone-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-900">{alert.message}</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    확인 필요 항목: <strong className="text-amber-800">{alert.missingFields.join(', ')}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
