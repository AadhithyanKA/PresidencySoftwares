import Papa from "papaparse";

export interface StudentRecord {
  program: string;
  department: string;
  sem: string;
  studentName: string;
  registerNumber: string;
  courses: Record<string, string>; // course code -> grade
  cgpa: number;
  sgpa: number;
  result: string; // "pass-promoted" | "fail-promoted"
  isFailByCourse: boolean; // has any 'F' in course
  isFail: boolean; // final fail status
}

export interface ParsedData {
  students: StudentRecord[];
  courseColumns: string[];
  programs: string[];
  departments: string[];
  errors: string[];
}

const KNOWN_NON_COURSE_COLS = new Set([
  "program", "department", "sem", "semester",
  "student name", "studentname", "name",
  "register number", "registernumber", "reg no", "regno",
  "cgpa", "sgpa", "result",
]);

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        if (!results.data || results.data.length === 0) {
          resolve({ students: [], courseColumns: [], programs: [], departments: [], errors: ["No data found in CSV."] });
          return;
        }

        const rawRows = results.data as Record<string, string>[];
        const headers = Object.keys(rawRows[0]);

        // Map header -> normalized key
        const headerMap: Record<string, string> = {};
        headers.forEach(h => { headerMap[normalizeKey(h)] = h; });

        const get = (row: Record<string, string>, ...keys: string[]): string => {
          for (const k of keys) {
            const orig = headerMap[k];
            if (orig && row[orig] !== undefined) return row[orig].trim();
          }
          return "";
        };

        // Detect course columns
        const courseColumns = headers.filter(h => {
          const norm = normalizeKey(h);
          return !KNOWN_NON_COURSE_COLS.has(norm);
        });

        const students: StudentRecord[] = rawRows.map((row, idx) => {
          const courses: Record<string, string> = {};
          courseColumns.forEach(col => {
            const val = (row[col] ?? "").trim();
            // Ignore empty values and "Nil" (case-insensitive)
            if (val && val.toLowerCase() !== "nil") {
              courses[col] = val.toUpperCase();
            }
          });

          const isFailByCourse = Object.values(courses).some(g => g === "F");

          const resultRaw = get(row, "result").toLowerCase();
          const isFailByResult = resultRaw.includes("fail");

          const cgpaRaw = get(row, "cgpa");
          const sgpaRaw = get(row, "sgpa");
          const cgpa = parseFloat(cgpaRaw) || 0;
          const sgpa = parseFloat(sgpaRaw) || 0;

          const program = get(row, "program");
          const department = get(row, "department");

          if (!program || !department) {
            errors.push(`Row ${idx + 2}: Missing Program or Department`);
          }

          return {
            program,
            department,
            sem: get(row, "sem", "semester"),
            studentName: get(row, "student name", "studentname", "name"),
            registerNumber: get(row, "register number", "registernumber", "reg no", "regno"),
            courses,
            cgpa,
            sgpa,
            result: resultRaw,
            isFailByCourse,
            isFail: isFailByCourse || isFailByResult,
          };
        });

        const programs = [...new Set(students.map(s => s.program).filter(Boolean))];
        const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

        resolve({ students, courseColumns, programs, departments, errors });
      },
      error: (err) => {
        resolve({ students: [], courseColumns: [], programs: [], departments: [], errors: [err.message] });
      },
    });
  });
}

export function cgpaRange(cgpa: number): string {
  if (cgpa >= 9) return "O";
  if (cgpa >= 8) return "A+";
  if (cgpa >= 7) return "A";
  if (cgpa >= 6) return "B+";
  if (cgpa >= 5.5) return "B";
  if (cgpa >= 5.0) return "C";
  if (cgpa >= 4.0) return "D";
  return "F";
}

export const CGPA_RANGE_ORDER = [
  "O",
  "A+",
  "A",
  "B+",
  "B",
  "C",
  "D",
  "F",
];
