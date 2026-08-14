import { Project, RecordItem, DecisionChangeItem, DelayWarning, MissingFieldAlert } from '../types';
import { isOverdue } from './dateUtils';

// 1. Result 1: 프로젝트 현황 요약 (Project Status Summary)
export function generateStatusSummary(
  project: Project,
  records: RecordItem[],
  decisions: DecisionChangeItem[]
): string {
  const refDate = project.reportDate || '확인 필요';
  const totalCount = records.length;

  // Emergency / Overdue checks
  const delays: DelayWarning[] = [];
  const urgentChecks: string[] = [];

  records.forEach((r) => {
    if (isOverdue(r.dueDate, project.reportDate, r.status)) {
      delays.push({
        recordNumber: r.recordNumber,
        title: r.title,
        assignee: r.assignee || '확인 필요',
        dueDate: r.dueDate,
        status: r.status,
        requiredAction: r.followUpAction || '후속 조치 필요',
      });
    }

    if (r.status === '승인 대기') {
      urgentChecks.push(`[${r.recordNumber}] ${r.title} (승인 대기 중 / 요청자: ${r.requester})`);
    }
    if (!r.assignee || r.assignee === '확인 필요') {
      urgentChecks.push(`[${r.recordNumber}] ${r.title} (담당자 미지정)`);
    }
    if (r.category === '위험' && r.status !== '완료') {
      urgentChecks.push(`[${r.recordNumber}] ${r.title} (현장 위험 대응 중 / 완료예정: ${r.dueDate})`);
    }
  });

  decisions.forEach((d) => {
    if (!d.approver || d.approver === '확인 필요' || d.approver === '승인 대기') {
      urgentChecks.push(`[${d.decisionNumber}] ${d.title} [결정자 확인 필요 / 승인 대기]`);
    }
    if (d.costImpact.includes('미확인') || d.costImpact === '확인 필요') {
      urgentChecks.push(`[${d.decisionNumber}] ${d.title} [비용 영향 미확인]`);
    }
    if (d.scheduleImpact.includes('미확인') || d.scheduleImpact === '확인 필요') {
      urgentChecks.push(`[${d.decisionNumber}] ${d.title} [일정 영향 미확인]`);
    }
  });

  // Recent Progress (sorted by date descending)
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  // Confirmed Decisions
  const confirmedDecisions = decisions.filter((d) => d.isConfirmed && d.status !== '보류');

  // Pending Reviews / Requests
  const pendingItems = records.filter(
    (r) => (r.status === '검토 중' || r.status === '승인 대기' || r.status === '확인 필요') && r.category !== '위험'
  );

  // Site Issues and Risks
  const siteRisks = records.filter(
    (r) => (r.category === '위험' || r.category === '현장') && r.status !== '완료'
  );

  // Follow-ups by Assignee
  const activeFollowUps = records.filter((r) => r.status !== '완료' && r.followUpAction && r.followUpAction !== '확인 필요');

  // Next Milestones / Upcoming schedules
  const upcomingSchedules = records
    .filter((r) => r.dueDate && r.dueDate !== '확인 필요' && r.status !== '완료')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let output = `# 프로젝트 현황

- 프로젝트명: ${project.name || '확인 필요'}
- 위치: ${project.location || '확인 필요'}
- 건축주: ${project.client || '확인 필요'}
- 현재 단계: ${project.stage || '확인 필요'}
- 보고 기준일: ${refDate}
- 누적 기록: ${totalCount}건

## 긴급 확인
`;

  if (delays.length === 0 && urgentChecks.length === 0) {
    output += `현재 확인된 긴급사항 없음\n\n`;
  } else {
    if (delays.length > 0) {
      delays.forEach((d) => {
        output += `🚨 지연: [${d.recordNumber}] ${d.title}\n- 담당자: ${d.assignee}\n- 완료 예정일: ${d.dueDate}\n- 현재 상태: ${d.status}\n- 필요한 조치: ${d.requiredAction}\n\n`;
      });
    }
    if (urgentChecks.length > 0) {
      urgentChecks.forEach((uc) => {
        output += `- ⚠️ ${uc}\n`;
      });
      output += `\n`;
    }
  }

  output += `## 최근 진행 내용\n`;
  if (sortedRecords.length === 0) {
    output += `- 입력된 진행 내용 없음\n\n`;
  } else {
    sortedRecords.slice(0, 5).forEach((r) => {
      output += `- [${r.date}] [${r.category}] ${r.title} (상태: ${r.status})\n  ${r.content}\n`;
    });
    output += `\n`;
  }

  output += `## 확정된 결정사항\n`;
  if (confirmedDecisions.length === 0) {
    output += `- 현재 확정된 결정사항 없음\n\n`;
  } else {
    confirmedDecisions.forEach((d) => {
      output += `- [${d.decisionNumber}] [${d.date}] ${d.title}\n  - 결정자: ${d.approver}\n  - 내용: ${d.content}\n  - 비용 영향: ${d.costImpact}\n  - 일정 영향: ${d.scheduleImpact}\n`;
    });
    output += `\n`;
  }

  output += `## 검토·승인 대기사항\n`;
  if (pendingItems.length === 0) {
    output += `- 현재 검토 또는 승인 대기사항 없음\n\n`;
  } else {
    pendingItems.forEach((p) => {
      output += `- [${p.recordNumber}] [${p.date}] ${p.title} (요청자: ${p.requester}, 상태: ${p.status})\n  - 세부내용: ${p.content}\n`;
    });
    output += `\n`;
  }

  output += `## 현장 이슈 및 위험\n`;
  if (siteRisks.length === 0) {
    output += `- 현재 확인된 현장 이슈 및 위험 없음\n\n`;
  } else {
    siteRisks.forEach((sr) => {
      output += `- [${sr.recordNumber}] [${sr.date}] ${sr.title}\n  - 현장 상태/문제: ${sr.content}\n  - 현재 대응: ${sr.followUpAction || '대응 방안 수립 중'}\n  - 담당자: ${sr.assignee || '확인 필요'} (완료 예정일: ${sr.dueDate || '확인 필요'})\n`;
    });
    output += `\n`;
  }

  output += `## 담당자별 후속 조치\n`;
  if (activeFollowUps.length === 0) {
    output += `- 현재 배정된 후속 조치 없음\n\n`;
  } else {
    activeFollowUps.forEach((fu) => {
      output += `- 담당자: ${fu.assignee || '확인 필요'}\n  - 할 일: [${fu.recordNumber}] ${fu.followUpAction}\n  - 완료 예정일: ${fu.dueDate || '확인 필요'}\n  - 현재 상태: ${fu.status}\n`;
    });
    output += `\n`;
  }

  output += `## 다음 주요 일정\n`;
  if (upcomingSchedules.length === 0) {
    output += `- 등록된 예정 일정 없음\n`;
  } else {
    upcomingSchedules.forEach((s) => {
      output += `- ${s.dueDate}: [${s.recordNumber}] ${s.title} (담당: ${s.assignee || '확인 필요'})\n`;
    });
  }

  return output;
}

// 2. Result 2: 의사결정·변경 기록 (Decision & Change Log)
export function generateDecisionsLog(decisions: DecisionChangeItem[]): string {
  if (!decisions || decisions.length === 0) {
    return `# 의사결정·변경 기록\n\n현재 등록된 의사결정 및 변경 기록이 없습니다.`;
  }

  let output = `# 의사결정·변경 기록\n\n`;

  const sorted = [...decisions].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((d) => {
    const titlePrefix = d.isConfirmed ? '' : '[미확정] ';
    const displayTitle = `${titlePrefix}${d.title}`;

    output += `## ${d.decisionNumber} | ${d.date} | ${d.type}\n\n`;
    output += `- 제목: ${displayTitle}\n`;
    output += `- 구분: ${d.type}\n`;
    output += `- 내용: ${d.content}\n`;
    if (d.type === '변경' || d.beforeChange) {
      output += `- 변경 전: ${d.beforeChange || '확인 필요'}\n`;
      output += `- 변경 후: ${d.afterChange || '확인 필요'}\n`;
      output += `- 사유: ${d.reason || '확인 필요'}\n`;
    }
    output += `- 요청자: ${d.requester ? d.requester : '**[요청자 확인 필요]**'}\n`;
    output += `- 결정자: ${d.approver && d.approver !== '승인 대기' && d.approver !== '확인 필요' ? d.approver : '**[결정자 확인 필요]**'}\n`;
    output += `- 관련 담당자: ${d.relatedAssignee || '확인 필요'}\n`;
    output += `- 비용 영향: ${d.costImpact || '비용 영향 확인 필요'}\n`;
    output += `- 일정 영향: ${d.scheduleImpact || '일정 영향 확인 필요'}\n`;
    output += `- 후속 조치: ${d.followUpAction || '확인 필요'}\n`;
    output += `- 완료 예정일: ${d.dueDate || '확인 필요'}\n`;
    output += `- 현재 상태: ${d.status}\n`;
    output += `- 근거 기록: ${d.sourceRecordNumber || 'R-000'}\n\n`;
  });

  return output.trim();
}

// 3. Result 3: 건축주 보고문 (Client Report - Plain Text in Single Code Block)
export function generateClientReportText(
  project: Project,
  records: RecordItem[],
  decisions: DecisionChangeItem[],
  mode: 'standard' | 'brief' | 'client' | 'internal' = 'standard'
): string {
  const clientName = project.client && project.client !== '확인 필요' ? project.client : '건축주';
  const projectName = project.name && project.name !== '확인 필요' ? project.name : '프로젝트';
  const refDate = project.reportDate || 'YYYY.MM.DD';

  // 1. 현재 진행 상황
  const currentStageText = project.stage && project.stage !== '확인 필요' ? project.stage : '진행 단계 검토';
  const totalRecordText = `현재 ${currentStageText} 단계로 업무가 정상 진행 중이며, 총 ${records.length}건의 주요 업무 및 협의 기록을 바탕으로 현황을 관리하고 있습니다.`;

  // 2. 주요 진행 업무
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  let majorWorkLines: string[] = [];
  if (sortedRecords.length === 0) {
    majorWorkLines.push('- 진행된 주요 업무 내용 확인 필요');
  } else {
    sortedRecords.forEach((r) => {
      if (r.category !== '위험') {
        majorWorkLines.push(`- [${r.date}] ${r.title} (${r.status})`);
      }
    });
  }

  // 3. 확정된 결정 및 변경사항
  const confirmedDecisions = decisions.filter((d) => d.isConfirmed && d.status !== '보류');
  let decisionLines: string[] = [];
  if (confirmedDecisions.length === 0) {
    decisionLines.push('- 현재 확정된 별도 결정 및 변경사항 없음');
  } else {
    confirmedDecisions.forEach((d) => {
      decisionLines.push(`- [${d.date}] ${d.title} (결정 주체: ${d.approver})`);
    });
  }

  // 4. 현장 이슈 및 대응 현황
  const siteIssues = records.filter(
    (r) => r.category === '현장' || r.category === '위험'
  );
  let issueLines: string[] = [];
  if (siteIssues.length === 0) {
    issueLines.push('- 현재 특이 현장 이슈 없음');
  } else {
    siteIssues.forEach((si) => {
      const resp = si.followUpAction && si.followUpAction !== '확인 필요' ? si.followUpAction : '조치 계획 수립 중';
      issueLines.push(`- [${si.date}] ${si.title}: ${resp}`);
    });
  }

  // 5. 확인 또는 결정 요청사항
  const pendingRequests = records.filter(
    (r) => r.status === '승인 대기' || r.status === '확인 필요' || (!r.isDecisionOrChange && r.category === '요청')
  );
  const unconfirmedDecisions = decisions.filter((d) => !d.isConfirmed && d.status === '승인 대기');

  let requestLines: string[] = [];
  let reqIdx = 1;

  unconfirmedDecisions.forEach((ud) => {
    requestLines.push(`${reqIdx}. [의사결정 승인 요청] ${ud.title} (${ud.afterChange || ud.content})`);
    reqIdx++;
  });

  pendingRequests.forEach((pr) => {
    requestLines.push(`${reqIdx}. [확인 요청] ${pr.title}: ${pr.content}`);
    reqIdx++;
  });

  if (requestLines.length === 0) {
    requestLines.push('- 현재 별도 확인 요청사항 없음');
  }

  // 6. 다음 일정 및 예정 업무
  const upcoming = records
    .filter((r) => r.dueDate && r.dueDate !== '확인 필요' && r.status !== '완료')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  let nextScheduleLines: string[] = [];
  if (upcoming.length === 0) {
    nextScheduleLines.push(`- ${project.schedule || '차주 예정 공정 확인 필요'}`);
  } else {
    upcoming.forEach((u) => {
      nextScheduleLines.push(`- [${u.dueDate}] ${u.title} (담당: ${u.assignee})`);
    });
  }

  // Pure plain text block as strictly specified in Section 14
  return `${clientName} 귀하

안녕하세요.
이우진어소시에이트입니다.

${projectName}의 ${refDate} 기준 진행 상황을 아래와 같이 보고드립니다.

1. 현재 진행 상황
- ${totalRecordText}

2. 주요 진행 업무
${majorWorkLines.join('\n')}

3. 확정된 결정 및 변경사항
${decisionLines.join('\n')}

4. 현장 이슈 및 대응 현황
${issueLines.join('\n')}

5. 확인 또는 결정 요청사항
${requestLines.join('\n')}

6. 다음 일정 및 예정 업무
${nextScheduleLines.join('\n')}

확인 또는 결정이 필요한 사항은 회신 부탁드립니다.

감사합니다.

이우진어소시에이트 드림`;
}

// 4. Result 4: 내부 확인 필요사항 (Internal Review Notes outside codeblock)
export function generateInternalNotes(
  project: Project,
  records: RecordItem[],
  decisions: DecisionChangeItem[]
): MissingFieldAlert[] {
  const alerts: MissingFieldAlert[] = [];

  // 1. Check decisions for missing approver or cost/schedule impact
  decisions.forEach((d) => {
    const missing: string[] = [];
    if (!d.approver || d.approver === '확인 필요' || d.approver === '승인 대기') {
      missing.push('결정자 미확정');
    }
    if (d.costImpact.includes('미확인') || d.costImpact === '확인 필요') {
      missing.push('비용 영향 미확인');
    }
    if (d.scheduleImpact.includes('미확인') || d.scheduleImpact === '확인 필요') {
      missing.push('일정 영향 미확인');
    }

    if (missing.length > 0) {
      alerts.push({
        recordNumber: d.decisionNumber,
        title: d.title,
        missingFields: missing,
        type: missing.includes('결정자 미확정') ? 'approver' : 'cost',
        message: `[${d.decisionNumber}] ${d.title} - ${missing.join(', ')}`,
      });
    }
  });

  // 2. Check records for missing assignee or delay
  records.forEach((r) => {
    if (!r.assignee || r.assignee === '확인 필요') {
      alerts.push({
        recordNumber: r.recordNumber,
        title: r.title,
        missingFields: ['담당자 미지정'],
        type: 'assignee',
        message: `[${r.recordNumber}] ${r.title} - 담당자가 지정되지 않았습니다.`,
      });
    }

    if (isOverdue(r.dueDate, project.reportDate, r.status)) {
      alerts.push({
        recordNumber: r.recordNumber,
        title: r.title,
        missingFields: ['공정 지연 발생'],
        type: 'schedule',
        message: `🚨 [${r.recordNumber}] ${r.title} - 완료 예정일(${r.dueDate}) 초과로 긴급 조치 필요`,
      });
    }
  });

  return alerts;
}
