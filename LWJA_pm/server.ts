import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System prompt embodying the entire instruction specification
const SYSTEM_INSTRUCTION = `당신은 이우진어소시에이트의 건축·공간기획·PM 프로젝트 기록 및 보고 도우미입니다.
사용자는 이우진어소시에이트의 대표와 프로젝트 담당자입니다.
당신의 역할은 사용자가 입력한 프로젝트 자료를 구조화하고, 현황·결정·변경·후속 조치를 정확하게 정리하여 실무 보고문을 작성하는 것입니다.
당신은 건축적 판단, 법률적 판단, 공사비 산정 또는 계약상 책임을 임의로 확정하지 않습니다.

[핵심 업무 원칙]
1. 사실, 의견, 요청, 검토, 결정, 변경, 위험, 완료를 엄격히 구분합니다.
2. 입력되지 않은 내용은 추측하거나 보완하지 않습니다. 불분명한 정보는 "확인 필요"로 표시합니다.
3. 결정되지 않은 의견을 확정사항처럼 표현하지 않습니다.
4. 책임 소재가 확인되지 않은 문제에 특정 당사자의 책임을 부여하지 않습니다.
5. 공사비, 일정, 계약 조건, 승인 여부를 임의로 만들어내지 않습니다.
6. "비용 영향 없음"과 "비용 영향 미확인"을 반드시 구분합니다.
7. "일정 영향 없음"과 "일정 영향 미확인"을 반드시 구분합니다.
8. 모든 날짜는 YYYY.MM.DD 형식으로 표시합니다.
9. 기록번호는 프로젝트별로 R-001부터 순서대로 부여합니다.
10. 결정과 변경 기록에는 D-001부터 순서대로 부여합니다.

[건축주 보고문 작성 원칙]
- 건축주에게 바로 전달할 수 있는 정중하고 간결한 업무 문장으로 작성합니다.
- 반드시 하나의 일반 텍스트 코드 블록 안에 작성합니다. 코드 블록 안에는 마크다운 기호를 사용하지 않습니다.
- 형식:
[건축주 성함 또는 직함] 귀하

안녕하세요.
이우진어소시에이트입니다.

[프로젝트명]의 YYYY.MM.DD 기준 진행 상황을 아래와 같이 보고드립니다.

1. 현재 진행 상황
- 내용

2. 주요 진행 업무
- 내용

3. 확정된 결정 및 변경사항
- 내용

4. 현장 이슈 및 대응 현황
- 내용

5. 확인 또는 결정 요청사항
- 내용

6. 다음 일정 및 예정 업무
- 내용

확인 또는 결정이 필요한 사항은 회신 부탁드립니다.

감사합니다.

이우진어소시에이트 드림

- 내부 확인 필요사항은 건축주 보고문 코드 블록 밖에 별도로 표시합니다.
`;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Chat & Command Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, projectContext } = req.body;
    const ai = getAI();

    if (!ai) {
      // Fallback rule-based parsing if no API key is set
      return res.json({
        reply: `기록 도우미가 연결되었습니다. (AI 엔진 준비 중)\n요청하신 내용: "${message}"\n기록 추가 및 현황 관리를 직접 진행하실 수 있습니다.`,
        suggestedAction: null,
      });
    }

    const prompt = `[현재 선택된 프로젝트 정보]
${JSON.stringify(projectContext, null, 2)}

[사용자 입력]
${message}

사용자의 입력(명령어, 회의록, 현장 메모, 질문 등)을 분석하여 원칙에 맞는 응답을 작성하십시오.
반드시 이우진어소시에이트의 실무 지침과 톤앤매너를 지켜주세요.
JSON으로 응답하지 말고 자연스러운 텍스트로 친절하고 명확하게 답변하되, 건축주 보고문 요청 시에는 지침에 맞춘 코드블록 형식으로 제공하십시오.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    const replyText = response.text || '응답을 생성할 수 없습니다.';
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
});

// Parse unformatted memo / notes into structured record
app.post('/api/parse-memo', async (req, res) => {
  try {
    const { rawText, currentProject, nextRecordNum, nextDecisionNum } = req.body;
    const ai = getAI();

    if (!ai) {
      // Basic deterministic fallback
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
      return res.json({
        parsedRecord: {
          recordNumber: nextRecordNum || 'R-001',
          date: today,
          category: '회의',
          title: rawText.slice(0, 30) || '새 기록',
          content: rawText,
          location: '확인 필요',
          photoDescription: '',
          requester: '확인 필요',
          approver: '확인 필요',
          assignee: '확인 필요',
          dueDate: '확인 필요',
          status: '검토 중',
          relatedRecordNumber: '',
          followUpAction: '확인 필요',
          isDecisionOrChange: false,
        },
      });
    }

    const parsePrompt = `사용자가 작성한 자유 형식의 현장 메모/회의록/통화 내용 등을 이우진어소시에이트의 표준 업무 기록 규격으로 구조화하십시오.

[사용자 입력 메모]
${rawText}

[부여할 기록번호]
기록번호: ${nextRecordNum || 'R-001'}
결정/변경번호(해당될 경우): ${nextDecisionNum || 'D-001'}

[규칙]
1. 사실, 의견, 요청, 검토, 결정, 변경, 위험, 완료를 구분할 것.
2. 입력되지 않은 정보는 절대 임의로 상상하지 말고 "확인 필요"로 기록할 것.
3. category는 다음 중 하나만 선택: ["회의", "통화", "현장", "일정", "요청", "검토", "의견", "결정", "변경", "위험", "완료"]
4. status는 다음 중 하나만 선택: ["확인 필요", "검토 중", "승인 대기", "진행 중", "완료", "보류"]
5. 날짜는 YYYY.MM.DD 형식 (알 수 없으면 "확인 필요")
6. 결정 또는 변경 사항인 경우 isDecisionOrChange를 true로 하고 decisionChangeData 객체를 채울 것.
   - costImpact: "비용 영향 없음" / "비용 증가 (세부금액 미확인)" / "비용 영향 미확인" / "확인 필요" 등 엄격히 구분
   - scheduleImpact: "일정 영향 없음" / "일정 영향 미확인" / "공기 연장 우려" 등 엄격히 구분
7. 누락된 중요 사항이 있다면 missingFields 배열에 문자열로 나열할 것. (예: ["결정자", "완료 예정일", "비용 영향"])

JSON 형식으로만 응답하십시오:
{
  "recordNumber": "${nextRecordNum || 'R-001'}",
  "date": "YYYY.MM.DD",
  "category": "회의",
  "title": "요약 제목",
  "content": "상세 내용",
  "location": "장소 또는 확인 필요",
  "photoDescription": "",
  "requester": "요청자명 또는 확인 필요",
  "approver": "결정자명 또는 확인 필요",
  "assignee": "담당자명 또는 확인 필요",
  "dueDate": "YYYY.MM.DD 또는 확인 필요",
  "status": "진행 중",
  "relatedRecordNumber": "",
  "followUpAction": "후속 조치 내용 또는 확인 필요",
  "isDecisionOrChange": false,
  "decisionChangeData": {
    "decisionNumber": "${nextDecisionNum || 'D-001'}",
    "title": "결정/변경 제목",
    "type": "결정" 또는 "변경",
    "isConfirmed": true/false,
    "beforeChange": "변경 전 내용 또는 해당없음",
    "afterChange": "변경 후 내용",
    "reason": "사유",
    "costImpact": "비용 영향 미확인",
    "scheduleImpact": "일정 영향 미확인",
    "followUp": "후속 조치"
  },
  "missingFields": ["확인 필요한 항목명들"],
  "summaryNotice": "R-001 기록이 추출되었습니다. 확인 필요 항목: ..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: parsePrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ parsedRecord: parsed });
  } catch (error: any) {
    console.error('Parse memo API Error:', error);
    res.status(500).json({ error: error.message || '메모 분석 중 오류가 발생했습니다.' });
  }
});

// Generate Client Report & Comprehensive Status Endpoint
app.post('/api/generate-report', async (req, res) => {
  try {
    const { project, records, decisions, mode = 'standard' } = req.body;
    const ai = getAI();

    if (!ai) {
      // Fallback deterministic report builder
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
      const clientName = project?.client || '건축주';
      const projectName = project?.name || '프로젝트';

      const codeBlock = `${clientName} 귀하

안녕하세요.
이우진어소시에이트입니다.

${projectName}의 ${project?.reportDate || today} 기준 진행 상황을 아래와 같이 보고드립니다.

1. 현재 진행 상황
- 현재 ${project?.stage || '진행 단계 확인 필요'} 단계로 총 ${records?.length || 0}건의 실무 기록이 관리되고 있습니다.

2. 주요 진행 업무
${records?.map((r: any) => `- [${r.date}] ${r.title} (${r.status})`).join('\n') || '- 입력된 주요 진행 업무 없음'}

3. 확정된 결정 및 변경사항
${decisions?.filter((d: any) => d.isConfirmed).map((d: any) => `- [${d.date}] ${d.title} (결정자: ${d.approver || '확인 필요'})`).join('\n') || '- 현재 확정된 별도 결정/변경사항 없음'}

4. 현장 이슈 및 대응 현황
${records?.filter((r: any) => r.category === '위험' || r.category === '현장').map((r: any) => `- [${r.date}] ${r.title}: ${r.followUpAction || '대응 검토 중'}`).join('\n') || '- 현재 특이 현장 이슈 없음'}

5. 확인 또는 결정 요청사항
${records?.filter((r: any) => r.status === '승인 대기' || r.status === '확인 필요').map((r: any, idx: number) => `${idx + 1}. [${r.title}] ${r.content} (확인 요청)`).join('\n') || '- 현재 별도 확인 요청사항 없음'}

6. 다음 일정 및 예정 업무
${records?.filter((r: any) => r.dueDate && r.dueDate !== '확인 필요').map((r: any) => `- [${r.dueDate}] ${r.title} (담당: ${r.assignee || '확인 필요'})`).join('\n') || '- 다음 예정 일정 확인 필요'}

확인 또는 결정이 필요한 사항은 회신 부탁드립니다.

감사합니다.

이우진어소시에이트 드림`;

      return res.json({
        reportText: codeBlock,
        internalNotes: '내부 확인 필요사항:\n- 담당자 및 승인 대기 항목 사전 검토 필요',
      });
    }

    const reportPrompt = `다음 프로젝트 정보와 누적 업무 기록을 바탕으로 이우진어소시에이트 실무 기준에 맞춘 보고서를 작성하십시오.

[모드]: ${mode} (standard: 표준 상세 보고, brief: 핵심 요약 보고, client: 건축주 제출용, internal: 내부 위험/비용 관리용)

[프로젝트 기본정보]
${JSON.stringify(project, null, 2)}

[누적 업무 기록 (${records?.length || 0}건)]
${JSON.stringify(records, null, 2)}

[의사결정 및 변경 기록 (${decisions?.length || 0}건)]
${JSON.stringify(decisions, null, 2)}

[작성 요구사항]
1. [건축주 보고문]은 반드시 마크다운 없는 순수 텍스트로, 다음 표준 양식을 엄격히 준수하여 하나의 코드블록으로 작성할 것.
2. 사실과 확인된 결정만 담고, 내부 추측이나 미정 사항을 확정된 것처럼 쓰지 말 것.
3. 확인이 필요한 사항은 번호(1, 2, 3...)를 붙여 명시할 것.
4. 코드블록 외부에는 [내부 확인 필요사항] (비용 영향 미확인, 일정 지연 위험, 책임자 미지정, 긴급 조치 필요 항목)을 명확하게 정리할 것.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: reportPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.15,
      },
    });

    const output = response.text || '';
    res.json({ fullOutput: output });
  } catch (error: any) {
    console.error('Report API Error:', error);
    res.status(500).json({ error: error.message || '보고서 생성 중 오류가 발생했습니다.' });
  }
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`이우진어소시에이트 프로젝트 도우미 서버 가동 중: http://localhost:${PORT}`);
  });
}

startServer();
