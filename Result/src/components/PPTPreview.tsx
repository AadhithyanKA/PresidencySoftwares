import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
import { StudentRecord } from "@/lib/csvParser";
import {
  OverallCGPAChart,
  DeptCGPAChart,
  DeptCGPAPieChart,
  DeptPassFailChart,
  DeptPassFailPieChart,
  CGPADistributionChart,
} from "@/components/Charts";
import {
  SlideContainer,
  SlideHeader,
  TitleSlide,
  SummaryStatsSlide,
  ChartSlide,
  DeptTableSlide,
  GradeTableSlide,
  PassFailProgramSlide,
  StudentRecordSlide
} from "@/components/SlideTemplates";

const LIGHT_BG = "#F7F9FC";

interface PPTPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  departments: string[];
  programs: string[];
  courseColumns: string[];
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function PPTPreview({ isOpen, onClose, students, departments, programs, courseColumns }: PPTPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<React.ReactNode[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Build slide list
    const list: React.ReactNode[] = [];
    let page = 0;

    // 1. Title
    page++;
    list.push(<TitleSlide key="title" students={students} departments={departments} programs={programs} />);

    // 2. Summary
    page++;
    list.push(<SummaryStatsSlide key="summary" students={students} departments={departments} programs={programs} pageNum={page} />);

    // 3. Charts
    // We reuse Chart components but wrap them for the slide
    const chartSlides = [
      { title: "Overall CGPA by Program", comp: <OverallCGPAChart students={students} programs={programs} /> },
      { title: "Department Performance", comp: <DeptCGPAChart students={students} departments={departments} /> },
      { title: "Pass vs Fail Overview", comp: <DeptPassFailChart students={students} departments={departments} /> },
      { title: "Overall Grade Distribution", comp: <CGPADistributionChart students={students} /> },
    ];

    chartSlides.forEach((c) => {
      page++;
      list.push(<ChartSlide key={c.title} title={c.title} pageNum={page}>{c.comp}</ChartSlide>);
    });
    
    // Pie Charts need special handling as they are grids in the app but should be individual or gridded in PPT
    // In PPTExport we capture the whole section.
    // Let's just show the grid components as one slide for now, or split if too big.
    // The user might want to see exactly what's on the PPT.
    // PPTExport captures "DeptCGPAPieChart" as one section.
    page++;
    list.push(<ChartSlide key="pie1" title="Grade Distribution Analysis" pageNum={page}><DeptCGPAPieChart students={students} departments={departments} /></ChartSlide>);
    
    page++;
    list.push(<ChartSlide key="pie2" title="Pass/Fail Breakdown" pageNum={page}><DeptPassFailPieChart students={students} departments={departments} /></ChartSlide>);

    // 4. Dept Table
    page++;
    list.push(<DeptTableSlide key="deptTable" students={students} departments={departments} programs={programs} pageNum={page} />);

    // 5. Grade Table
    page++;
    list.push(<GradeTableSlide key="gradeTable" students={students} departments={departments} pageNum={page} />);

    // 6. Pass/Fail per Program
    programs.forEach(prog => {
      page++;
      list.push(<PassFailProgramSlide key={`pf-${prog}`} students={students} departments={departments} program={prog} pageNum={page} />);
    });
    
    // 7. Student Records (First page only as sample?)
    // User wants to see what's going to be on PPT. PPT has ALL students.
    // Rendering thousands of slides in preview is bad.
    // Let's show just the first page of students.
    // Or maybe a few pages.
    page++;
    list.push(
      <StudentRecordSlide 
        key="students-sample"
        students={students.slice(0, 20)}
        startIndex={0}
        totalStudents={students.length}
        courseColumns={courseColumns}
        pageNum={page}
      />
    );

    setSlides(list);
    setCurrentSlide(0);
  }, [isOpen, students, departments, programs, courseColumns]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">PPT Preview</h2>
          <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/10 rounded-full transition">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className={`transition-all duration-300 ${isFullscreen ? 'w-[90vw]' : 'w-[80vw] max-w-6xl'}`}>
          <div className="aspect-video bg-white rounded-lg shadow-2xl overflow-hidden relative group">
             {slides[currentSlide]}
             
             {/* Nav Buttons */}
             <button 
               onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
               disabled={currentSlide === 0}
               className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100"
             >
               <ChevronLeft className="w-6 h-6" />
             </button>
             <button 
               onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
               disabled={currentSlide === slides.length - 1}
               className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100"
             >
               <ChevronRight className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      {/* Thumbnails Strip */}
      <div className="h-24 bg-black/40 flex items-center gap-4 px-8 overflow-x-auto">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-16 aspect-video bg-white rounded flex-shrink-0 transition-all ${
              currentSlide === i ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-50 hover:opacity-100'
            }`}
          >
             <div className="w-full h-full flex items-center justify-center text-slate-900 font-bold text-xs">
               {i + 1}
             </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
