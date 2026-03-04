import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FileText, Loader2 } from "lucide-react";
import { StudentRecord } from "@/lib/csvParser";
import { ProgressOverlay, ProgressState } from "./ProgressOverlay";
import {
  OverallCGPAChart,
  DeptCGPAChart,
  DeptCGPAPieChart,
  DeptPassFailChart,
  DeptPassFailPieChart,
  CGPADistributionChart,
} from "@/components/Charts";
import {
  TitleSlide,
  SummaryStatsSlide,
  ChartSlide,
  DeptTableSlide,
  GradeTableSlide,
  PassFailProgramSlide,
  StudentRecordSlide
} from "@/components/SlideTemplates";

interface SlidePDFExportProps {
  students: StudentRecord[];
  departments: string[];
  programs: string[];
  courseColumns: string[];
  fileName?: string;
}

export default function SlidePDFExport({
  students, departments, programs, courseColumns,
  fileName = "result-analysis-slides"
}: SlidePDFExportProps) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [currentSlideNode, setCurrentSlideNode] = useState<React.ReactNode | null>(null);

  const setP = (step: string, detail: string, pct: number) =>
    setProgress({ step, detail, pct });

  const generatePDF = async () => {
    setP("Initializing", "Preparing slide generator...", 5);

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1280, 720], // Match render size (16:9 HD)
        compress: true
      });

      // Build the list of slide render functions
      const slideGenerators: (() => React.ReactNode)[] = [];
      let page = 0;

      // 1. Title
      slideGenerators.push(() => { page++; return <TitleSlide students={students} departments={departments} programs={programs} />; });

      // 2. Summary
      slideGenerators.push(() => { page++; return <SummaryStatsSlide students={students} departments={departments} programs={programs} pageNum={page} />; });

      // 3. Charts
      const chartSlides = [
        { title: "Overall CGPA by Program", comp: <OverallCGPAChart students={students} programs={programs} /> },
        { title: "Department Performance", comp: <DeptCGPAChart students={students} departments={departments} /> },
        { title: "Pass vs Fail Overview", comp: <DeptPassFailChart students={students} departments={departments} /> },
        { title: "Overall Grade Distribution", comp: <CGPADistributionChart students={students} /> },
      ];
      chartSlides.forEach(c => {
        slideGenerators.push(() => { page++; return <ChartSlide title={c.title} pageNum={page}>{c.comp}</ChartSlide>; });
      });

      // Pie Charts
      slideGenerators.push(() => { page++; return <ChartSlide title="Grade Distribution Analysis" pageNum={page}><DeptCGPAPieChart students={students} departments={departments} /></ChartSlide>; });
      slideGenerators.push(() => { page++; return <ChartSlide title="Pass/Fail Breakdown" pageNum={page}><DeptPassFailPieChart students={students} departments={departments} /></ChartSlide>; });

      // 4. Tables
      slideGenerators.push(() => { page++; return <DeptTableSlide students={students} departments={departments} programs={programs} pageNum={page} />; });
      slideGenerators.push(() => { page++; return <GradeTableSlide students={students} departments={departments} pageNum={page} />; });

      // 5. Pass/Fail per Program
      programs.forEach(prog => {
        slideGenerators.push(() => { page++; return <PassFailProgramSlide students={students} departments={departments} program={prog} pageNum={page} />; });
      });

      // 6. Student Records
      const ROWS_PER_SLIDE = 20; // Matches PPTPreview logic
      for (let i = 0; i < students.length; i += ROWS_PER_SLIDE) {
        const startIndex = i;
        const chunk = students.slice(i, i + ROWS_PER_SLIDE);
        // Closure captures current values
        slideGenerators.push(() => {
          page++;
          return (
            <StudentRecordSlide
              students={chunk}
              startIndex={startIndex}
              totalStudents={students.length}
              courseColumns={courseColumns}
              pageNum={page}
            />
          );
        });
      }

      const totalSlides = slideGenerators.length;
      const container = document.getElementById("slide-render-container");
      if (!container) throw new Error("Render container not found");

      // ── Render loop ─────────────────────────────────────────────────────────
      for (let i = 0; i < totalSlides; i++) {
        const pct = Math.round((i / totalSlides) * 100);
        setP("Generating Slides", `Processing slide ${i + 1} of ${totalSlides}...`, pct);

        // Render slide
        const slideNode = slideGenerators[i]();
        setCurrentSlideNode(slideNode);

        // Wait for React render & charts
        // Charts usually need a bit of time to animate/render. 
        // 500ms is safe. 
        await new Promise(r => setTimeout(r, 600));

        // Capture
        const canvas = await html2canvas(container, {
            scale: 1.5, // Balance between quality and speed
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 1280,
            height: 720,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.85);
        
        if (i > 0) pdf.addPage([1280, 720]);
        pdf.addImage(imgData, "JPEG", 0, 0, 1280, 720);
      }

      setP("Saving file", "Writing PDF to disk...", 100);
      await new Promise(r => setTimeout(r, 200));
      
      pdf.save(`${fileName}-${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`);
      
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (e) {
      console.error("PDF Export failed", e);
      alert("Export failed. See console for details.");
    } finally {
      setProgress(null);
      setCurrentSlideNode(null);
    }
  };

  return (
    <>
      {progress && <ProgressOverlay progress={progress} />}
      
      <button
        onClick={generatePDF}
        disabled={!!progress}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        style={{
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", // Red gradient
            boxShadow: "0 4px 14px 0 rgba(239, 68, 68, 0.39)"
        }}
      >
        {progress ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
        ) : (
          <><FileText className="w-4 h-4" /> PDF Slides</>
        )}
      </button>
      
      {/* Container for rendering slides - Off-screen but visible */}
      <div 
        id="slide-render-container"
        className="fixed top-0 left-[-10000px] w-[1280px] h-[720px] bg-white z-[-1] overflow-hidden"
      >
        {currentSlideNode}
      </div>
    </>
  );
}
