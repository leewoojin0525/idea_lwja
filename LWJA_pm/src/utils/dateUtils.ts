export function formatDate(input?: string | Date): string {
  if (!input) return '확인 필요';
  if (typeof input === 'string') {
    // Already in YYYY.MM.DD
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(input.trim())) {
      return input.trim();
    }
    // Try parsing YYYY-MM-DD or similar
    const clean = input.replace(/\//g, '-').replace(/\./g, '-');
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    }
    return input;
  }
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, '0');
  const day = String(input.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function getTodayFormatted(): string {
  return formatDate(new Date());
}

export function isOverdue(dueDateStr: string, referenceDateStr?: string, status?: string): boolean {
  if (status === '완료') return false;
  if (!dueDateStr || dueDateStr === '확인 필요') return false;

  const targetDate = parseDateString(dueDateStr);
  if (!targetDate) return false;

  const refDate = referenceDateStr ? parseDateString(referenceDateStr) : new Date();
  if (!refDate) return false;

  // Set time to end of day for fair comparison
  refDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate < refDate;
}

function parseDateString(dateStr: string): Date | null {
  if (!dateStr || dateStr === '확인 필요') return null;
  const parts = dateStr.split(/[.\-/]/);
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}
