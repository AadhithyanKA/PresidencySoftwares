import React from "react";
import { StudentRecord, cgpaRange, CGPA_RANGE_ORDER } from "@/lib/csvParser";
import presidencyLogoSrc from "@/assets/presidency-university-logo.png";
import psodLogoSrc from "@/assets/psod-logo.png";

// ── Style Constants ─────────────────────────────────────────────────────────
const NAVY = "#1B2A4A";
const GOLD = "#C9A84C";
const LIGHT_BG = "#F7F9FC";
const PASS_C = "#16A34A";
const FAIL_C = "#DC2626";
const DEPT_COLORS = ["#2563EB","#D97706","#059669","#7C3AED","#DB2777","#0891B2","#EA580C","#65A30D"];
const GRADE_COLS: Record<string, string> = {
  "O": "#1E40AF", "A+": "#2563EB", "A": "#0891B2",
  "B+": "#059669", "B": "#D97706", "C": "#EA580C",
  "D": "#EF4444", "F": "#DC2626",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function avgScore(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function isFoundation(dept: string) {
  return dept.trim().toLowerCase().includes("foundation");
}

// ── Components ──────────────────────────────────────────────────────────────

export function SlideContainer({ children, className = "", style, id }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string }) {
  return (
    <div id={id} className={`w-full aspect-video bg-white relative overflow-hidden shadow-2xl ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SlideHeader({ title, pageNum }: { title: string; pageNum: number }) {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-[12%] z-10" style={{ background: NAVY }}>
        <div className="absolute top-full left-0 right-0 h-[2px]" style={{ background: GOLD }} />
        <img src={psodLogoSrc} className="absolute left-[3%] top-[15%] h-[70%] object-contain" alt="PSOD" />
        <img src={presidencyLogoSrc} className="absolute right-[3%] top-[15%] h-[60%] object-contain brightness-0 invert" alt="Presidency" />
        <h2 className="absolute left-[10%] top-0 bottom-0 flex items-center text-white font-bold text-[1.8vw] font-[Calibri]">
          {title}
        </h2>
      </div>
      <SlideFooter pageNum={pageNum} />
    </>
  );
}

function SlideFooter({ pageNum }: { pageNum: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[8%] z-10" style={{ background: LIGHT_BG, borderTop: `4px solid ${NAVY}` }}>
      <div className="absolute top-0 left-0 right-0 h-[4px] -mt-[4px]" style={{ background: NAVY }}>
         <div className="w-full h-[1px] bg-[#C9A84C]" />
      </div>
      <div className="flex items-center justify-between px-[3%] h-full text-[1vw]">
        <div className="flex items-center gap-2">
           <img src={psodLogoSrc} className="h-[2vh] w-auto" alt="PSOD" />
        </div>
        <div className="font-bold" style={{ color: GOLD }}>Presidency University, Bangalore</div>
        <div style={{ color: "#A0AABB" }}>Page {pageNum}</div>
      </div>
    </div>
  );
}

// ── Slide Renderers ─────────────────────────────────────────────────────────

export function TitleSlide({ students, departments, programs }: { students: StudentRecord[], departments: string[], programs: string[] }) {
  return (
    <SlideContainer className="flex flex-col items-center justify-center text-center" style={{ background: NAVY }}>
      <div className="absolute bottom-0 left-0 right-0 h-[12%]" style={{ background: GOLD }} />
      
      <img src={presidencyLogoSrc} className="h-[15%] mb-8 brightness-0 invert" alt="Logo" />
      <img src={psodLogoSrc} className="absolute left-[5%] top-[40%] h-[15%] opacity-80" alt="PSOD" />
      
      <h1 className="text-[4vw] font-bold text-white mb-4">Academic Result Analysis</h1>
      <p className="text-[2vw]" style={{ color: GOLD }}>{programs.join("  ·  ")}</p>
      
      <div className="mt-8 text-[1.2vw] text-slate-400">
        {students.length} Students  ·  {departments.length} Departments  ·  {new Date().toLocaleDateString("en-IN")}
      </div>
      
      <div className="absolute bottom-[4%] w-full text-center text-[0.9vw] font-bold text-[#1B2A4A]">
        Generated using ARA — Presidency University, Bangalore
      </div>
    </SlideContainer>
  );
}

export function SummaryStatsSlide({ students, departments, programs, pageNum }: { students: StudentRecord[], departments: string[], programs: string[], pageNum: number }) {
  const totalPass = students.filter(s => !s.isFail).length;
  const totalFail = students.length - totalPass;
  const overallCGPA = avgScore(students.map(s => s.cgpa));

  const stats = [
    { label: "Total Students", value: students.length, color: NAVY },
    { label: "Departments", value: departments.length, color: "#7C3AED" },
    { label: "Pass", value: totalPass, sub: `${(totalPass/students.length*100).toFixed(1)}%`, color: PASS_C },
    { label: "Fail", value: totalFail, sub: `${(totalFail/students.length*100).toFixed(1)}%`, color: FAIL_C },
    { label: "Avg CGPA", value: overallCGPA.toFixed(2), color: GOLD },
  ];

  return (
    <SlideContainer style={{ background: LIGHT_BG }}>
      <SlideHeader title="📊  Summary Statistics" pageNum={pageNum} />
      <div className="absolute top-[15%] bottom-[10%] left-[3%] right-[3%] flex flex-col gap-6 pt-4">
        {/* Top Stats Row */}
        <div className="grid grid-cols-5 gap-4 h-[25%]">
          {stats.map((st, i) => (
             <div key={i} className="bg-white rounded-xl shadow-sm border-2 flex flex-col items-center justify-center p-2" style={{ borderColor: st.color }}>
                <div className="text-[2.5vw] font-bold leading-none" style={{ color: st.color }}>{st.value}</div>
                <div className="text-[0.9vw] text-slate-500 mt-1">{st.label}</div>
                {st.sub && <div className="text-[0.9vw] font-bold" style={{ color: st.color }}>{st.sub}</div>}
             </div>
          ))}
        </div>

        {/* Program Stats Row */}
        <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: `repeat(${programs.length}, 1fr)` }}>
          {programs.map((prog, i) => {
            const group = students.filter(s => s.program === prog);
            const pp = group.filter(s => !s.isFail).length;
            const avg = avgScore(group.map(s => s.cgpa));
            const color = DEPT_COLORS[i] || NAVY;
            
            return (
              <div key={prog} className="bg-white rounded-xl shadow-sm border-t-4 p-4 flex flex-col items-center text-center" style={{ borderColor: color }}>
                <div className="text-[1.2vw] font-bold mb-2" style={{ color }}>{prog}</div>
                <div className="text-[1vw] text-slate-500 mb-1">{group.length} students</div>
                <div className="text-[0.9vw] text-slate-400 mb-4">Pass: {pp} · Fail: {group.length - pp}</div>
                <div className="mt-auto text-[1.1vw] font-bold" style={{ color }}>Avg CGPA: {avg.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </SlideContainer>
  );
}

export function ChartSlide({ title, children, pageNum }: { title: string, children: React.ReactNode, pageNum: number }) {
  return (
    <SlideContainer style={{ background: LIGHT_BG }}>
      <SlideHeader title={`📊  ${title}`} pageNum={pageNum} />
      <div className="absolute top-[15%] bottom-[10%] left-[5%] right-[5%] flex items-center justify-center p-4">
        <div className="w-full h-full relative">
          {children}
        </div>
      </div>
    </SlideContainer>
  );
}

export function DeptTableSlide({ students, departments, programs, pageNum }: { students: StudentRecord[], departments: string[], programs: string[], pageNum: number }) {
  return (
    <SlideContainer style={{ background: LIGHT_BG }}>
      <SlideHeader title="🏛️  Department-wise Average CGPA" pageNum={pageNum} />
      <div className="absolute top-[15%] bottom-[10%] left-[3%] right-[3%] overflow-auto pt-4">
        <table className="w-full border-collapse bg-white text-[0.9vw]">
          <thead>
            <tr className="text-white" style={{ background: NAVY }}>
              <th className="p-2 border border-slate-200">Department</th>
              <th className="p-2 border border-slate-200">Program(s)</th>
              <th className="p-2 border border-slate-200">Students</th>
              <th className="p-2 border border-slate-200">Avg GPA</th>
              <th className="p-2 border border-slate-200">Pass</th>
              <th className="p-2 border border-slate-200">Fail</th>
              <th className="p-2 border border-slate-200">Metric</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, i) => {
              const group = students.filter(s => s.department === dept);
              const useS = isFoundation(dept);
              const dAvg = avgScore(group.map(s => useS ? s.sgpa : s.cgpa));
              const dPass = group.filter(s => !s.isFail).length;
              return (
                <tr key={dept} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                  <td className="p-2 border border-slate-200 font-bold" style={{ color: DEPT_COLORS[i % DEPT_COLORS.length] }}>{dept}</td>
                  <td className="p-2 border border-slate-200">{programs.filter(p => group.some(s => s.program === p)).join(", ")}</td>
                  <td className="p-2 border border-slate-200 text-center">{group.length}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold">{dAvg.toFixed(2)}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold" style={{ color: PASS_C }}>{dPass}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold" style={{ color: FAIL_C }}>{group.length - dPass}</td>
                  <td className="p-2 border border-slate-200 text-center italic text-slate-500">{useS ? "SGPA" : "CGPA"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SlideContainer>
  );
}

export function GradeTableSlide({ students, departments, pageNum }: { students: StudentRecord[], departments: string[], pageNum: number }) {
  return (
    <SlideContainer style={{ background: LIGHT_BG }}>
      <SlideHeader title="📈  CGPA Grade Distribution by Department" pageNum={pageNum} />
      <div className="absolute top-[15%] bottom-[10%] left-[3%] right-[3%] overflow-auto pt-4">
        <table className="w-full border-collapse bg-white text-[0.8vw]">
          <thead>
            <tr className="text-white" style={{ background: NAVY }}>
              <th className="p-2 border border-slate-200">Department</th>
              <th className="p-2 border border-slate-200">Total</th>
              {CGPA_RANGE_ORDER.map(g => (
                <th key={g} className="p-2 border border-slate-200">{g}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, i) => {
              const group = students.filter(s => s.department === dept);
              const useS = isFoundation(dept);
              const counts: Record<string, number> = {};
              CGPA_RANGE_ORDER.forEach(r => { counts[r] = 0; });
              group.forEach(s => { const r = cgpaRange(useS ? s.sgpa : s.cgpa); counts[r]++; });
              
              return (
                <tr key={dept} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                  <td className="p-2 border border-slate-200 font-bold" style={{ color: DEPT_COLORS[i % DEPT_COLORS.length] }}>{dept}</td>
                  <td className="p-2 border border-slate-200 text-center">{group.length}</td>
                  {CGPA_RANGE_ORDER.map(r => (
                    <td key={r} className="p-2 border border-slate-200 text-center">
                       {counts[r] > 0 ? (
                         <div className="flex flex-col">
                           <span className="font-bold" style={{ color: GRADE_COLS[r] }}>{counts[r]}</span>
                           <span className="text-[0.6vw] text-slate-400">{(counts[r]/group.length*100).toFixed(0)}%</span>
                         </div>
                       ) : <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SlideContainer>
  );
}

export function PassFailProgramSlide({ students, departments, program, pageNum }: { students: StudentRecord[], departments: string[], program: string, pageNum: number }) {
  const group = students.filter(s => s.program === program);
  const pPass = group.filter(s => !s.isFail).length;
  const pFail = group.length - pPass;
  
  return (
    <SlideContainer style={{ background: LIGHT_BG }}>
      <SlideHeader title={`✅  ${program} — Pass / Fail`} pageNum={pageNum} />
      <div className="absolute top-[15%] bottom-[10%] left-[3%] right-[3%] pt-4 flex flex-col gap-6">
        {/* Big Stats */}
        <div className="flex justify-center gap-12">
          <div className="w-[30%] bg-green-50 border-2 border-green-500 rounded-2xl p-4 flex flex-col items-center text-center">
             <div className="text-[4vw] font-bold text-green-600 leading-none">{pPass}</div>
             <div className="text-[1.5vw] font-bold text-green-600">PASS</div>
             <div className="text-[1vw] text-green-600">{(pPass/group.length*100).toFixed(1)}%</div>
          </div>
          <div className="w-[30%] bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex flex-col items-center text-center">
             <div className="text-[4vw] font-bold text-red-600 leading-none">{pFail}</div>
             <div className="text-[1.5vw] font-bold text-red-600">FAIL</div>
             <div className="text-[1vw] text-red-600">{(pFail/group.length*100).toFixed(1)}%</div>
          </div>
        </div>
        
        <div className="text-center text-slate-500 text-[1.2vw]">Total: {group.length} students</div>
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse bg-white text-[0.9vw]">
             <thead>
               <tr className="text-white" style={{ background: NAVY }}>
                 <th className="p-2 border border-slate-200">Department</th>
                 <th className="p-2 border border-slate-200">Students</th>
                 <th className="p-2 border border-slate-200">Pass</th>
                 <th className="p-2 border border-slate-200">Fail</th>
                 <th className="p-2 border border-slate-200">Pass %</th>
                 <th className="p-2 border border-slate-200">Avg CGPA</th>
               </tr>
             </thead>
             <tbody>
               {departments.map((dept, i) => {
                 const dg = students.filter(s => s.program === program && s.department === dept);
                 if (!dg.length) return null;
                 const dp = dg.filter(s => !s.isFail).length;
                 return (
                   <tr key={dept} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                     <td className="p-2 border border-slate-200 font-bold" style={{ color: DEPT_COLORS[i % DEPT_COLORS.length] }}>{dept}</td>
                     <td className="p-2 border border-slate-200 text-center">{dg.length}</td>
                     <td className="p-2 border border-slate-200 text-center text-green-600 font-bold">{dp}</td>
                     <td className="p-2 border border-slate-200 text-center text-red-600 font-bold">{dg.length - dp}</td>
                     <td className="p-2 border border-slate-200 text-center">{(dp/dg.length*100).toFixed(1)}%</td>
                     <td className="p-2 border border-slate-200 text-center font-bold">{avgScore(dg.map(s => s.cgpa)).toFixed(2)}</td>
                   </tr>
                 );
               })}
             </tbody>
          </table>
        </div>
      </div>
    </SlideContainer>
  );
}

export function StudentRecordSlide({ students, startIndex, totalStudents, courseColumns, pageNum }: { students: StudentRecord[], startIndex: number, totalStudents: number, courseColumns: string[], pageNum: number }) {
  const chunk = students; // passed chunk
  const shownCourses = courseColumns.slice(0, 3);
  
  return (
    <SlideContainer style={{ background: LIGHT_BG }}>
      <SlideHeader title={`📋  Student Records (${startIndex+1}–${startIndex+chunk.length} of ${totalStudents})`} pageNum={pageNum} />
      <div className="absolute top-[15%] bottom-[10%] left-[3%] right-[3%] overflow-auto pt-4">
         <table className="w-full border-collapse bg-white text-[0.8vw]">
           <thead>
             <tr className="text-white" style={{ background: NAVY }}>
               <th className="p-2 border border-slate-200">Name</th>
               <th className="p-2 border border-slate-200">Reg No</th>
               <th className="p-2 border border-slate-200">Program</th>
               <th className="p-2 border border-slate-200">Dept</th>
               {shownCourses.map(c => <th key={c} className="p-2 border border-slate-200">{c}</th>)}
               <th className="p-2 border border-slate-200">CGPA</th>
               <th className="p-2 border border-slate-200">Result</th>
             </tr>
           </thead>
           <tbody>
             {chunk.map((s, i) => (
               <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                 <td className="p-2 border border-slate-200 font-bold">{s.studentName}</td>
                 <td className="p-2 border border-slate-200 text-slate-500">{s.registerNumber}</td>
                 <td className="p-2 border border-slate-200">{s.program}</td>
                 <td className="p-2 border border-slate-200">{s.department}</td>
                 {shownCourses.map(c => (
                   <td key={c} className={`p-2 border border-slate-200 text-center ${s.courses[c] === 'F' ? 'text-red-600 font-bold' : ''}`}>
                     {s.courses[c] || '-'}
                   </td>
                 ))}
                 <td className="p-2 border border-slate-200 text-center font-bold">{s.cgpa.toFixed(2)}</td>
                 <td className={`p-2 border border-slate-200 text-center font-bold ${s.isFail ? 'text-red-600' : 'text-green-600'}`}>
                   {s.isFail ? "FAIL" : "PASS"}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </SlideContainer>
  );
}
