import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import StatsCards from "@/components/StatsCards";
import StudentTable from "@/components/StudentTable";
import PDFExport from "@/components/PDFExport";
import PPTExport from "@/components/PPTExport";
import PPTPreview from "@/components/PPTPreview";
import HTMLExport from "@/components/HTMLExport";
import {
  OverallCGPAChart,
  DeptCGPAChart,
  DeptCGPAPieChart,
  DeptPassFailChart,
  DeptPassFailPieChart,
  CGPADistributionChart,
} from "@/components/Charts";
import { ParsedData } from "@/lib/csvParser";
import { BarChart2, RefreshCw, FileDown, UploadCloud } from "lucide-react";
import presidencyLogo from "@/assets/presidency-university-logo.png";
import psodLogo from "@/assets/psod-logo.png";

// Helper to build 100-row template
function makeRows(): string[][] {
  const header = ["Program","Department","Sem","Student Name","Register Number","Course_A","Course_B","Course_C","CGPA","SGPA","Result"];
  const grades = ["O","A+","A","B+","B","C","D","F"];
  const depts: [string, string, string, string][] = [
    ["B.Sc","Computer Science","5","22CS"],
    ["B.Sc","Mathematics","5","22MA"],
    ["B.Sc","Physics","5","22PH"],
    ["B.Des","Visual Design","3","22VD"],
    ["B.Des","Fashion Design","3","22FD"],
  ];
  const firstNames = ["Arjun","Meera","Ravi","Priya","Kiran","Aisha","Siva","Nisha","Deepak","Lakshmi","Rahul","Sneha","Vijay","Pooja","Arun","Divya","Suresh","Anitha","Gopal","Kavya"];
  const lastNames = ["R","K","S","M","T","P","N","B","G","V"];
  const rows: string[][] = [header];
  let count = 0;
  for (const [prog, dept, sem, regPrefix] of depts) {
    for (let i = 1; i <= 20; i++) {
      count++;
      const regNo = `${regPrefix}${String(i).padStart(3,"0")}`;
      const name = `${firstNames[(count-1)%firstNames.length]} ${lastNames[(count-1)%lastNames.length]}`;
      const g = (idx: number) => grades[idx % grades.length];
      const roll = count % 7;
      const courseA = g(roll);
      const courseB = g(roll + 2);
      // For Visual Design, simulate a "Nil" course (Course_C is not applicable)
      const courseC = (dept === "Visual Design") ? "Nil" : g(roll + 1);
      
      // Calculate Fail status (ignoring Nil)
      const courses = [courseA, courseB, courseC].filter(c => c !== "Nil");
      const hasFail = courses.includes("F");
      
      const cgpa = hasFail ? (4.5 + (count % 10) * 0.1).toFixed(2) : (6.5 + (count % 30) * 0.1).toFixed(2);
      const sgpa = hasFail ? (4.3 + (count % 10) * 0.1).toFixed(2) : (6.6 + (count % 30) * 0.1).toFixed(2);
      const result = hasFail ? "fail-promoted" : "pass-promoted";
      rows.push([prog, dept, sem, name, regNo, courseA, courseB, courseC, cgpa, sgpa, result]);
    }
  }
  return rows;
}

const TEMPLATE_CSV = makeRows().map(row => row.join(",")).join("\n");

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "result-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

import SlidePDFExport from "@/components/SlidePDFExport";

export default function Index() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [showPPTPreview, setShowPPTPreview] = useState(false);
  const programs = data?.programs ?? [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logos */}
            <div className="flex items-center gap-6">
              <img src={psodLogo} alt="PSOD Logo" className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition" />
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <img src={presidencyLogo} alt="Presidency University" className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition hidden sm:block" />
            </div>

            {/* Title */}
            <div className="hidden md:block text-center">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Presidency Result Report Generator</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Analysis Dashboard</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {data && (
                <>
                  <button
                    onClick={() => setData(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    title="Upload New File"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <div className="h-8 w-px bg-slate-200 mx-1"></div>
                  <HTMLExport students={data.students} departments={data.departments} />
                  <PDFExport contentId="report-content" fileName="result-analysis" />
                  <SlidePDFExport
                    students={data.students}
                    departments={data.departments}
                    programs={data.programs}
                    courseColumns={data.courseColumns}
                    fileName="result-analysis-slides"
                  />
                  <button
                    onClick={() => setShowPPTPreview(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <BarChart2 className="w-4 h-4" /> PPT Preview
                  </button>
                  <PPTExport
                    students={data.students}
                    departments={data.departments}
                    programs={data.programs}
                    courseColumns={data.courseColumns}
                    contentId="report-content"
                    fileName="result-analysis"
                  />
                  <PPTPreview
                    isOpen={showPPTPreview}
                    onClose={() => setShowPPTPreview(false)}
                    students={data.students}
                    departments={data.departments}
                    programs={data.programs}
                    courseColumns={data.courseColumns}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!data ? (
          /* Upload Section */
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6 shadow-sm border border-indigo-100">
                <BarChart2 className="w-4 h-4" />
                <span>Result Analysis Dashboard v2.0</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Transform Result Data into <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Actionable Insights</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Upload your CSV to instantly generate interactive charts, comprehensive analysis, and professional PDF/PPT reports.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2">
              <FileUpload onDataParsed={(parsed) => setData(parsed)} />
            </div>

            {/* Format hint */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-indigo-500" />
                    CSV Format Guide
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Your CSV file should have the following headers. Order doesn't matter, but names must match.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {["Program","Department","Sem","Student Name","Register Number","Course_...","CGPA","SGPA","Result"].map(h => (
                      <span key={h} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded border border-slate-200">{h}</span>
                    ))}
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Sample Template
                  </button>
               </div>
               
               <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white">
                 <h4 className="text-base font-bold mb-4">Pro Tips</h4>
                 <ul className="space-y-3 text-sm text-slate-300">
                   <li className="flex gap-3">
                     <span className="text-indigo-400 font-bold">•</span>
                     <span>"Nil" values in course columns are automatically ignored in calculations.</span>
                   </li>
                   <li className="flex gap-3">
                     <span className="text-indigo-400 font-bold">•</span>
                     <span>'F' grade in any course marks the student as Fail.</span>
                   </li>
                   <li className="flex gap-3">
                     <span className="text-indigo-400 font-bold">•</span>
                     <span>Use the new "Presentation Mode" in HTML export for meetings.</span>
                   </li>
                 </ul>
               </div>
            </div>
          </div>
        ) : (
          /* Dashboard */
          <div id="report-content" className="space-y-10 animate-in fade-in duration-500">

            {/* Stats */}
            <div data-pdf-section>
              <StatsCards students={data.students} departments={data.departments} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div data-pdf-section className="h-full"><OverallCGPAChart students={data.students} programs={programs} /></div>
              <div data-pdf-section className="h-full"><DeptCGPAChart students={data.students} departments={data.departments} /></div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div data-pdf-section className="h-full"><DeptPassFailChart students={data.students} departments={data.departments} /></div>
               <div data-pdf-section className="h-full"><CGPADistributionChart students={data.students} /></div>
            </div>

            {/* Detailed Sections */}
            <DeptCGPAPieChart students={data.students} departments={data.departments} />
            <DeptPassFailPieChart students={data.students} departments={data.departments} />

            {/* Student Table (Interactive) */}
            <div data-pdf-hide className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-200">
                 <h3 className="text-xl font-bold text-slate-800">Detailed Student Records</h3>
                 <p className="text-sm text-slate-500">Search and filter individual student performance</p>
               </div>
               <StudentTable students={data.students} courseColumns={data.courseColumns} />
            </div>

            {/* PDF-only student table */}
            <div data-pdf-section className="hidden-screen">
              <StudentTable students={data.students} courseColumns={data.courseColumns} pdfMode />
            </div>
            
             {/* Errors */}
            {data.errors.length > 0 && (
              <div data-pdf-section className="p-6 rounded-2xl border border-red-200 bg-red-50">
                <p className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">
                   ⚠️ Parse Warnings ({data.errors.length})
                </p>
                <ul className="space-y-1 pl-5 list-disc">
                  {data.errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-sm text-red-600">{e}</li>
                  ))}
                  {data.errors.length > 5 && <li className="text-sm text-red-600 font-medium">…and {data.errors.length - 5} more</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Presidency University. All rights reserved.</p>
          <div className="flex items-center gap-6">
             <span>Generated with <strong>ARA Platform</strong></span>
             <span>•</span>
             <span>Confidential Report</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
