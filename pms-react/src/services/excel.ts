import * as XLSX from 'xlsx';

export type ProjectImportRow = {
  코드: string;
  프로젝트명: string;
  상태?: string;
  계약금액?: number;
  예산?: number;
  착공일?: string;
  완공일?: string;
  발주처?: string;
  현장주소?: string;
  비고?: string;
};

export type ResourceImportRow = {
  사번: string;
  이름: string;
  부서?: string;
  직위?: string;
  직급?: string;
  시간단가?: number;
  월단가?: number;
  가용률?: number;
  연락처?: string;
  이메일?: string;
  보유기술?: string;
  자격증?: string;
};

export function parseProjectsFromExcel(buffer: ArrayBuffer): ProjectImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<ProjectImportRow>(sheet);
  return data;
}

export function parseResourcesFromExcel(buffer: ArrayBuffer): ResourceImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<ResourceImportRow>(sheet);
  return data;
}

export function createProjectTemplate(): ArrayBuffer {
  const sampleData: ProjectImportRow[] = [
    {
      코드: 'PRJ-001',
      프로젝트명: '샘플 프로젝트',
      상태: 'registered',
      계약금액: 100000000,
      예산: 80000000,
      착공일: '2024-01-01',
      완공일: '2024-12-31',
      발주처: '샘플 발주처',
      현장주소: '서울시 강남구',
      비고: '테스트 프로젝트',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
  ];
  ws['!freeze'] = { top: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '프로젝트 등록 양식');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as unknown as ArrayBuffer;
}

export function createResourceTemplate(): ArrayBuffer {
  const sampleData: ResourceImportRow[] = [
    {
      사번: 'EMP001',
      이름: '김철수',
      부서: '설계팀',
      직위: '팀장',
      직급: '이사',
      시간단가: 50000,
      월단가: 8000000,
      가용률: 100,
      연락처: '010-1234-5678',
      이메일: 'chulsoo@example.com',
      보유기술: 'AutoCAD, Revit',
      자격증: '建筑工程 施工管理员',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
    { wch: 30 }, { wch: 30 },
  ];
  ws['!freeze'] = { top: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '인력 등록 양식');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as unknown as ArrayBuffer;
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  sheetName: string,
  columns: { key: keyof T; header: string; width?: number }[]
): ArrayBuffer {
  const exportData = data.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach(col => {
      obj[col.header] = row[col.key];
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));
  ws['!freeze'] = { top: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as unknown as ArrayBuffer;
}

export function downloadExcel(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
