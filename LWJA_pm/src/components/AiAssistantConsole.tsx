import React, { useState, useRef, useEffect } from 'react';
import { Project, RecordItem, DecisionChangeItem } from '../types';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Bot, 
  User, 
  Terminal, 
  Copy, 
  Check, 
  ArrowRight,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  codeBlock?: string;
}

interface AiAssistantConsoleProps {
  currentProject: Project;
  records: RecordItem[];
  decisions: DecisionChangeItem[];
  onExecuteCommandAction?: (actionType: string, payload: any) => void;
}

export const AiAssistantConsole: React.FC<AiAssistantConsoleProps> = ({
  currentProject,
  records,
  decisions,
  onExecuteCommandAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `안녕하세요. 이우진어소시에이트의 건축·공간기획·PM 실무 기록 및 보고 도우미입니다.

현재 선택된 프로젝트: [${currentProject?.name || '확인 필요'}]
누적 실무 기록: ${records?.length || 0}건

아래 명령어 또는 자유로운 대화 형식으로 업무를 요청하실 수 있습니다:
• "현황 요약해 줘" - 현황 및 긴급 확인 요약 (결과 1)
• "결정·변경 기록 보여줘" - D-001 순번 대장 (결과 2)
• "건축주 보고문 작성해 줘" - 단일 코드블록 보고문 (결과 3)
• "전체 보고 보여줘" - 전체 종합 결과 (1+2+3)
• "기록 추가: 2026.08.14 / 회의 / ..." - 신규 기록 입력`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          projectContext: {
            project: currentProject,
            recordsCount: records.length,
            records,
            decisions,
          },
        }),
      });

      const data = await res.json();
      const assistantReply = data.reply || '답변을 생성하지 못했습니다.';

      // Check if reply contains a codeblock
      const codeMatch = assistantReply.match(/```(?:\w+)?\n([\s\S]*?)```/);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: assistantReply,
        codeBlock: codeMatch ? codeMatch[1].trim() : undefined,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: '서버 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickCommands = [
    '현황 요약해 줘',
    '결정·변경 기록 보여줘',
    '건축주 보고문 작성해 줘',
    '전체 보고 보여줘',
    '짧게',
    '내부용',
    '건축주용',
  ];

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col h-[760px] overflow-hidden">
      
      {/* Console Header */}
      <div className="bg-stone-900 text-stone-100 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-amber-600 flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>이우진어소시에이트 실무 AI 어시스턴트</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-stone-400">
              {currentProject?.name} · 실무 원칙 및 4대 결과물 자동화
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'reset',
                sender: 'assistant',
                text: '대화 기록이 초기화되었습니다. 무엇을 도와드릴까요?',
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          className="text-stone-400 hover:text-stone-200 p-1.5 rounded hover:bg-stone-800 transition-colors text-xs flex items-center space-x-1"
          title="대화 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>초기화</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs bg-stone-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                msg.sender === 'user' ? 'bg-stone-800' : 'bg-amber-600'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className={`max-w-[85%] sm:max-w-2xl space-y-1.5`}>
              <div
                className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-stone-100 rounded-tr-none'
                    : 'bg-white text-stone-900 border border-stone-200 shadow-xs rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Copy Code Block if provided */}
              {msg.codeBlock && (
                <div className="bg-stone-900 rounded-lg p-3 border border-stone-800 text-stone-200 font-mono text-[11px] relative group">
                  <div className="flex justify-between items-center text-stone-400 border-b border-stone-800 pb-1 mb-2">
                    <span>건축주 보고문 텍스트</span>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.codeBlock!)}
                      className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? '복사 완료' : '복사'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{msg.codeBlock}</pre>
                </div>
              )}

              <div
                className={`text-[10px] text-stone-400 px-1 ${
                  msg.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-stone-500 pl-9">
            <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
            <span className="font-medium text-amber-900">이우진어소시에이트 실무 규칙 적용하여 작성 중...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Command Chips */}
      <div className="p-2.5 bg-stone-100 border-t border-stone-200 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
        <span className="text-stone-400 font-semibold flex items-center space-x-1 flex-shrink-0">
          <Terminal className="w-3 h-3" />
          <span>명령어:</span>
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleSendMessage(cmd)}
            className="px-2.5 py-1 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-stone-700 font-medium rounded-full border border-stone-300 shadow-2xs whitespace-nowrap transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="명령어 입력 또는 회의록/현장 메모 붙여넣기 (예: '현황 요약해 줘', '건축주 보고문 작성해 줘')..."
            className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center space-x-1 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>전송</span>
          </button>
        </form>
      </div>

    </div>
  );
};
