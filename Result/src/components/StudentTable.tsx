import { useState } from "react";
import { StudentRecord } from "@/lib/csvParser";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

interface StudentTableProps {
  students: StudentRecord[];
  courseColumns: string[];
  pdfMode?: boolean; // when true: show all rows, hide search/pagination
}

type SortKey = "studentName" | "program" | "department" | "cgpa" | "sgpa" | "isFail";

export default function StudentTable({ students, courseColumns, pdfMode = false }: StudentTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cgpa");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = students.filter(s =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase()) ||
    s.program.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let av: any = a[sortKey];
    let bv: any = b[sortKey];
    if (typeof av === "boolean") { av = av ? 1 : 0; bv = bv ? 1 : 0; }
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  // In pdfMode show all rows; otherwise paginate
  const paged = pdfMode ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-3 h-3 -mb-1 ${sortKey === k && sortDir === "asc" ? "text-secondary" : "text-muted-foreground/40"}`} />
      <ChevronDown className={`w-3 h-3 ${sortKey === k && sortDir === "desc" ? "text-secondary" : "text-muted-foreground/40"}`} />
    </span>
  );

  const shownCourses = courseColumns.slice(0, 4);

  return (
    <div className="chart-card">
      {/* Header: hidden in PDF */}
      {!pdfMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Student Records</h3>
            <p className="text-sm text-muted-foreground">{filtered.length} of {students.length} students</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring w-60"
              placeholder="Search name, reg no, dept…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      )}

      {pdfMode && (
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground">Student Records</h3>
          <p className="text-sm text-muted-foreground">{students.length} students</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-3 py-3 text-left font-medium text-xs uppercase tracking-wide cursor-pointer whitespace-nowrap"
                onClick={() => !pdfMode && toggleSort("studentName")}>
                Student {!pdfMode && <SortIcon k="studentName" />}
              </th>
              <th className="px-3 py-3 text-left font-medium text-xs uppercase tracking-wide cursor-pointer whitespace-nowrap"
                onClick={() => !pdfMode && toggleSort("program")}>
                Program {!pdfMode && <SortIcon k="program" />}
              </th>
              <th className="px-3 py-3 text-left font-medium text-xs uppercase tracking-wide cursor-pointer whitespace-nowrap"
                onClick={() => !pdfMode && toggleSort("department")}>
                Dept {!pdfMode && <SortIcon k="department" />}
              </th>
              <th className="px-3 py-3 text-left font-medium text-xs uppercase tracking-wide">Sem</th>
              {shownCourses.map(c => (
                <th key={c} className="px-3 py-3 text-center font-medium text-xs uppercase tracking-wide whitespace-nowrap">{c}</th>
              ))}
              {courseColumns.length > 4 && (
                <th className="px-3 py-3 text-center font-medium text-xs uppercase tracking-wide text-primary-foreground/60">+{courseColumns.length - 4}</th>
              )}
              <th className="px-3 py-3 text-center font-medium text-xs uppercase tracking-wide cursor-pointer whitespace-nowrap"
                onClick={() => !pdfMode && toggleSort("cgpa")}>
                CGPA {!pdfMode && <SortIcon k="cgpa" />}
              </th>
              <th className="px-3 py-3 text-center font-medium text-xs uppercase tracking-wide cursor-pointer whitespace-nowrap"
                onClick={() => !pdfMode && toggleSort("sgpa")}>
                SGPA {!pdfMode && <SortIcon k="sgpa" />}
              </th>
              <th className="px-3 py-3 text-center font-medium text-xs uppercase tracking-wide cursor-pointer"
                onClick={() => !pdfMode && toggleSort("isFail")}>
                Status {!pdfMode && <SortIcon k="isFail" />}
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s, i) => (
              <tr key={s.registerNumber + i} className={`border-t border-border transition-colors ${s.isFail ? "bg-destructive/5" : "hover:bg-muted/40"}`}>
                <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                  <div>{s.studentName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.registerNumber}</div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{s.program}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{s.department}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{s.sem}</td>
                {shownCourses.map(c => (
                  <td key={c} className="px-3 py-2.5 text-center">
                    <span className={`font-semibold text-xs ${s.courses[c] === "F" ? "text-destructive" : "text-foreground"}`}>
                      {s.courses[c] || "—"}
                    </span>
                  </td>
                ))}
                {courseColumns.length > 4 && <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">…</td>}
                <td className="px-3 py-2.5 text-center font-semibold text-foreground">{s.cgpa.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">{s.sgpa.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-center">
                  {s.isFail
                    ? <span className="badge-fail">Fail</span>
                    : <span className="badge-pass">Pass</span>
                  }
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9 + shownCourses.length} className="px-4 py-8 text-center text-muted-foreground">
                  No students match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination: hidden in PDF */}
      {!pdfMode && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
