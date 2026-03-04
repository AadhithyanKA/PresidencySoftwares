import { useState } from "react";
import { createPortal } from "react-dom";
import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";
import { FileText, FileCheck, Loader2 } from "lucide-react";
import { StudentRecord, cgpaRange, CGPA_RANGE_ORDER } from "@/lib/csvParser";
import presidencyLogoSrc from "@/assets/presidency-university-logo.png";
import psodLogoSrc from "@/assets/psod-logo.png";

interface ProgressState {
  step: string;
  detail: string;
  pct: number;
}

function ProgressOverlay({ progress }: { progress: ProgressState }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(11,17,32,0.82)", backdropFilter: "blur(6px)" }}>
      <div className="w-[420px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg,#C9501A 0%,#E07B3A 100%)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
          <div>
            <p className="font-bold text-base text-white">Generating PPT Presentation</p>
            <p className="text-xs mt-0.5 text-white/60">Please don't close this tab</p>
          </div>
          <span className="ml-auto text-sm font-bold tabular-nums text-white">{progress.pct}%</span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Progress bar */}
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.pct}%`, background: "linear-gradient(90deg,#C9501A,#E07B3A)" }} />
          </div>

          {/* Step info */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse"
              style={{ background: "#C9501A" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{progress.step}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{progress.detail}</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-1.5 pt-1">
            {[
              { label: "Loading logos & assets", threshold: 10 },
              { label: "Building title & stats slides", threshold: 25 },
              { label: "Capturing chart sections", threshold: 70 },
              { label: "Building data table slides", threshold: 85 },
              { label: "Building student record slides", threshold: 95 },
              { label: "Saving file", threshold: 100 },
            ].map((s) => {
              const done = progress.pct >= s.threshold;
              const active = progress.pct >= s.threshold - 15 && !done;
              return (
                <div key={s.label} className="flex items-center gap-2.5 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${done ? "opacity-100" : active ? "opacity-70" : "opacity-25"}`}
                    style={{ background: done ? "#C9501A" : "hsl(var(--muted))" }}>
                    {done && <FileCheck className="w-2.5 h-2.5 text-white" />}
                    {!done && <span className="w-1.5 h-1.5 rounded-full block"
                      style={{ background: active ? "#C9501A" : "hsl(var(--muted-foreground))" }} />}
                  </div>
                  <span style={{ color: done ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    className={done ? "font-medium" : ""}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface PPTExportProps {
  students: StudentRecord[];
  departments: string[];
  programs: string[];
  courseColumns: string[];
  contentId?: string; // id of report-content div for chart capture
  fileName?: string;
}

const NAVY = "1B2A4A";
const GOLD = "C9A84C";
const WHITE = "FFFFFF";
const LIGHT_BG = "F7F9FC";
const PASS_C = "16A34A";
const FAIL_C = "DC2626";
const MUTED = "64748B";
const DEPT_COLORS = ["2563EB","D97706","059669","7C3AED","DB2777","0891B2","EA580C","65A30D"];

const GRADE_COLS: Record<string, string> = {
  "O": "1E40AF", "A+": "2563EB", "A": "0891B2",
  "B+": "059669", "B": "D97706", "C": "EA580C",
  "D": "EF4444", "F": "DC2626",
};

function avgScore(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function isFoundation(dept: string) {
  return dept.trim().toLowerCase().includes("foundation");
}

function hdr(labels: string[]): pptxgen.TableRow {
  return labels.map(text => ({
    text,
    options: { bold: true, color: WHITE, fill: { color: NAVY }, align: "center" as const },
  }));
}

// Convert an img src to base64 PNG data URL
async function imgToBase64(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.src = src;
  });
}

// Capture a DOM element to a base64 PNG — returns data URL + natural pixel dimensions
async function captureElement(el: HTMLElement): Promise<{ data: string; width: number; height: number }> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f7f9fc",
    windowWidth: 1600, // Increased width to prevent cutoffs
    scrollY: -window.scrollY,
    imageTimeout: 0,
    logging: false,
  });
  return { data: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

const W = 13.33;
const H = 7.5;
const FOOTER_H = 0.38;
const HEADER_H = 0.55;
const CONTENT_TOP = HEADER_H + 0.1;
const CONTENT_BOT = H - FOOTER_H - 0.08;

export default function PPTExport({
  students, departments, programs, courseColumns,
  contentId = "report-content",
  fileName = "result-analysis",
}: PPTExportProps) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const setP = (step: string, detail: string, pct: number) =>
    setProgress({ step, detail, pct });

  const buildPPT = async () => {
    setP("Loading logos & assets", "Fetching Presidency University and PSOD logos…", 5);

    // Force container width for consistent chart capture
    const container = document.getElementById(contentId);
    // Store original styles
    const originalWidth = container?.style.width;
    const originalMaxWidth = container?.style.maxWidth;

    if (container) {
      container.style.width = "1500px";
      container.style.maxWidth = "none";
      // Wait for Recharts to resize
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const prs = new pptxgen();
      prs.layout = "LAYOUT_WIDE";

      // Pre-load logos
      const [presidencyB64, psodB64] = await Promise.all([
        imgToBase64(presidencyLogoSrc),
        imgToBase64(psodLogoSrc),
      ]);

      // ── Shared chrome helpers ────────────────────────────────────────────────
      const addFooter = (slide: pptxgen.Slide, pageNum: number) => {
        // Navy footer bar
        slide.addShape(prs.ShapeType.rect, { x: 0, y: H - FOOTER_H, w: W, h: FOOTER_H, fill: { color: NAVY } });
        slide.addShape(prs.ShapeType.rect, { x: 0, y: H - FOOTER_H, w: W, h: 0.04, fill: { color: GOLD } });
        // PSOD in footer left
        slide.addImage({ data: psodB64, x: 0.12, y: H - FOOTER_H + 0.04, w: 0.28, h: 0.28 });
        // "Presidency University, Bangalore" centre
        slide.addText("Presidency University, Bangalore", {
          x: 2, y: H - FOOTER_H + 0.06, w: W - 4, h: 0.26,
          fontSize: 9, color: GOLD, align: "center", bold: true,
        });
        // Page number right
        slide.addText(`Page ${pageNum}`, {
          x: W - 1.3, y: H - FOOTER_H + 0.06, w: 1.15, h: 0.26,
          fontSize: 9, color: "A0AABB", align: "right",
        });
      };

      const sectionHeader = (slide: pptxgen.Slide, text: string, pageNum: number) => {
        slide.background = { color: LIGHT_BG };
        // Header bar
        slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: W, h: HEADER_H, fill: { color: NAVY } });
        slide.addShape(prs.ShapeType.rect, { x: 0, y: HEADER_H, w: W, h: 0.04, fill: { color: GOLD } });
        // PSOD logo in header left
        slide.addImage({ data: psodB64, x: 0.1, y: 0.06, w: 0.42, h: 0.42 });
        // Presidency logo header right (white version)
        slide.addImage({ data: presidencyB64, x: W - 2.5, y: 0.08, w: 2.3, h: 0.38 });
        // Title text
        slide.addText(text, {
          x: 0.65, y: 0.07, w: W - 3.4, h: 0.42,
          fontSize: 15, bold: true, color: WHITE, fontFace: "Calibri",
        });
        addFooter(slide, pageNum);
      };

      let pageNum = 0;

      // ── Slide 1: Title ────────────────────────────────────────────────────────
      pageNum++;
      const s1 = prs.addSlide();
      s1.background = { color: NAVY };
      s1.addShape(prs.ShapeType.rect, { x: 0, y: H - 0.18, w: W, h: 0.18, fill: { color: GOLD } });

      // Presidency logo — big, center
      s1.addImage({ data: presidencyB64, x: (W - 5.5) / 2, y: 0.6, w: 5.5, h: 1.0 });
      // PSOD logo — small, left
      s1.addImage({ data: psodB64, x: 0.4, y: 0.5, w: 1.1, h: 1.1 });

      s1.addText("Academic Result Analysis", {
        x: 0.6, y: 2.0, w: W - 1.2, h: 1.0, fontSize: 42, bold: true, color: WHITE, align: "center",
      });
      s1.addText(programs.join("  ·  "), {
        x: 0.6, y: 3.1, w: W - 1.2, h: 0.5, fontSize: 20, color: GOLD, align: "center",
      });
      s1.addText(`${students.length} Students  ·  ${departments.length} Departments  ·  ${new Date().toLocaleDateString("en-IN")}`, {
        x: 0.6, y: 3.7, w: W - 1.2, h: 0.4, fontSize: 13, color: MUTED, align: "center",
      });
      s1.addText("Generated using ARA — Presidency University, Bangalore", {
        x: 0.6, y: 6.8, w: W - 1.2, h: 0.35, fontSize: 10, color: GOLD, align: "center",
      });

      // ── Slide 2: Summary Stats ────────────────────────────────────────────────
      pageNum++;
      const totalPass = students.filter(s => !s.isFail).length;
      const totalFail = students.length - totalPass;
      const overallCGPA = avgScore(students.map(s => s.cgpa));

      const s2 = prs.addSlide();
      sectionHeader(s2, "📊  Summary Statistics", pageNum);

      const stats = [
        { label: "Total Students", value: students.length.toString(), color: NAVY },
        { label: "Departments", value: departments.length.toString(), color: "7C3AED" },
        { label: "Pass", value: totalPass.toString(), sub: `${(totalPass/students.length*100).toFixed(1)}%`, color: PASS_C },
        { label: "Fail", value: totalFail.toString(), sub: `${(totalFail/students.length*100).toFixed(1)}%`, color: FAIL_C },
        { label: "Avg CGPA", value: overallCGPA.toFixed(2), color: GOLD },
      ];
      stats.forEach((st, i) => {
        const x = 0.3 + i * 2.56;
        s2.addShape(prs.ShapeType.rect, { x, y: CONTENT_TOP + 0.1, w: 2.3, h: 1.6, fill: { color: WHITE }, line: { color: st.color, width: 2 } });
        s2.addText(st.value, { x, y: CONTENT_TOP + 0.2, w: 2.3, h: 0.8, fontSize: 36, bold: true, color: st.color, align: "center" });
        s2.addText(st.label, { x, y: CONTENT_TOP + 1.0, w: 2.3, h: 0.3, fontSize: 12, color: MUTED, align: "center" });
        if (st.sub) s2.addText(st.sub, { x, y: CONTENT_TOP + 1.3, w: 2.3, h: 0.28, fontSize: 12, color: st.color, align: "center", bold: true });
      });

      programs.forEach((prog, i) => {
        const group = students.filter(s => s.program === prog);
        const pp = group.filter(s => !s.isFail).length;
        const x = 0.3 + i * (W - 0.6) / programs.length;
        const w2 = (W - 0.6) / programs.length - 0.15;
        s2.addShape(prs.ShapeType.rect, { x, y: CONTENT_TOP + 2.0, w: w2, h: 1.6, fill: { color: WHITE }, line: { color: DEPT_COLORS[i] || NAVY, width: 1.5 } });
        s2.addText(prog, { x, y: CONTENT_TOP + 2.1, w: w2, h: 0.4, fontSize: 15, bold: true, color: DEPT_COLORS[i] || NAVY, align: "center" });
        s2.addText(`${group.length} students`, { x, y: CONTENT_TOP + 2.5, w: w2, h: 0.28, fontSize: 12, color: MUTED, align: "center" });
        s2.addText(`Pass: ${pp}   Fail: ${group.length - pp}`, { x, y: CONTENT_TOP + 2.78, w: w2, h: 0.28, fontSize: 12, color: MUTED, align: "center" });
        s2.addText(`Avg CGPA: ${avgScore(group.map(s => s.cgpa)).toFixed(2)}`, { x, y: CONTENT_TOP + 3.06, w: w2, h: 0.28, fontSize: 12, bold: true, color: DEPT_COLORS[i] || NAVY, align: "center" });
      });

      // ── Chart slides — capture each data-pdf-section from the DOM ───────────
      setP("Capturing chart sections", "Finding chart sections in the report…", 28);
      const reportContainer = document.getElementById(contentId);
      if (reportContainer) {
        const allSections = Array.from(
          reportContainer.querySelectorAll("[data-pdf-section]")
        ) as HTMLElement[];

        const chartSections = allSections.filter(section => {
          const isTableSection = section.querySelector("table") && !section.querySelector(".recharts-wrapper");
          if (isTableSection) return false;
          const hasChart = section.querySelector(".recharts-wrapper");
          const isStatsBanner = section.querySelector("[class*='hero-header']") || section.querySelector("[class*='StatsCards']");
          return hasChart || isStatsBanner;
        });

        for (let ci = 0; ci < chartSections.length; ci++) {
          const section = chartSections[ci];
          const pct = Math.round(28 + ((ci + 1) / chartSections.length) * 42); // 28→70
          const heading = section.querySelector("h2,h3,h4,p");
          const sectionTitle = heading?.textContent?.trim().slice(0, 60) || "Chart";
          setP(`Capturing chart ${ci + 1} of ${chartSections.length}`, `"${sectionTitle}"`, pct);

          const hideEls = section.querySelectorAll("[data-pdf-hide]") as NodeListOf<HTMLElement>;
          hideEls.forEach(el => { el.style.display = "none"; });

          const captured = await captureElement(section);

          hideEls.forEach(el => { el.style.display = ""; });

          pageNum++;
          const slide = prs.addSlide();
          sectionHeader(slide, `📊  ${sectionTitle}`, pageNum);

          // Compute display dimensions preserving the captured aspect ratio
          const CHART_Y = CONTENT_TOP + 0.05;
          const MAX_W = W - 0.3;
          const MAX_H = CONTENT_BOT - CHART_Y;
          const imgRatio = captured.width / captured.height; // px/px
          let imgW = MAX_W;
          let imgH = imgW / imgRatio;
          if (imgH > MAX_H) {
            imgH = MAX_H;
            imgW = imgH * imgRatio;
          }
          // Centre horizontally
          const imgX = (W - imgW) / 2;
          slide.addImage({ data: captured.data, x: imgX, y: CHART_Y, w: imgW, h: imgH });
        }
      }

      // ── Dept CGPA Table ──────────────────────────────────────────────────────
      setP("Building data table slides", "Department CGPA summary table…", 72);
      pageNum++;
      const s3 = prs.addSlide();
      sectionHeader(s3, "🏛️  Department-wise Average CGPA", pageNum);

      const deptRows: pptxgen.TableRow[] = departments.map((dept, i) => {
        const group = students.filter(s => s.department === dept);
        const useS = isFoundation(dept);
        const dAvg = avgScore(group.map(s => useS ? s.sgpa : s.cgpa));
        const dPass = group.filter(s => !s.isFail).length;
        return [
          { text: dept, options: { bold: true, color: DEPT_COLORS[i % DEPT_COLORS.length], fill: { color: WHITE } } },
          { text: programs.filter(p => group.some(s => s.program === p)).join(", "), options: { fill: { color: WHITE } } },
          { text: group.length.toString(), options: { align: "center" as const, fill: { color: WHITE } } },
          { text: dAvg.toFixed(2), options: { bold: true, align: "center" as const, fill: { color: WHITE } } },
          { text: dPass.toString(), options: { color: PASS_C, align: "center" as const, fill: { color: WHITE } } },
          { text: (group.length - dPass).toString(), options: { color: FAIL_C, align: "center" as const, fill: { color: WHITE } } },
          { text: useS ? "SGPA" : "CGPA", options: { italic: true, align: "center" as const, color: MUTED, fill: { color: WHITE } } },
        ];
      });

      s3.addTable(
        [hdr(["Department","Program(s)","Students","Avg GPA","Pass","Fail","Metric"]), ...deptRows],
        { 
          x: 0.3, y: CONTENT_TOP + 0.05, w: W - 0.6, 
          colW: [3.0,2.5,1.2,1.2,1.0,1.0,1.0], 
          fontSize: 13, fontFace: "Calibri", 
          border: { type: "solid", color: "E2E8F0", pt: 0.5 }, 
          rowH: 0.42,
          autoPage: true,
          newPageStartY: CONTENT_TOP + 0.05,
        } as any,
      );

      // ── Grade Distribution Table ─────────────────────────────────────────────
      setP("Building data table slides", "Grade distribution table…", 76);
      pageNum++;
      const s4 = prs.addSlide();
      sectionHeader(s4, "📈  CGPA Grade Distribution by Department", pageNum);

      const gradeRows: pptxgen.TableRow[] = departments.map((dept, i) => {
        const group = students.filter(s => s.department === dept);
        const useS = isFoundation(dept);
        const counts: Record<string, number> = {};
        CGPA_RANGE_ORDER.forEach(r => { counts[r] = 0; });
        group.forEach(s => { const r = cgpaRange(useS ? s.sgpa : s.cgpa); counts[r]++; });
        return [
          { text: dept, options: { bold: true, color: DEPT_COLORS[i % DEPT_COLORS.length], fill: { color: WHITE } } },
          { text: group.length.toString(), options: { align: "center" as const, fill: { color: WHITE } } },
          ...CGPA_RANGE_ORDER.map(r => ({
            text: counts[r] > 0 ? `${counts[r]}\n(${(counts[r]/group.length*100).toFixed(0)}%)` : "—",
            options: { align: "center" as const, bold: counts[r] > 0, color: counts[r] > 0 ? GRADE_COLS[r] : MUTED, fill: { color: WHITE } },
          })),
        ];
      });

      s4.addTable(
        [hdr(["Department","Total","O","A+","A","B+","B","C","D","F"]), ...gradeRows],
        { 
          x: 0.3, y: CONTENT_TOP + 0.05, w: W - 0.6, 
          colW: [2.5,0.8,1.1,1.1,1.1,1.1,1.1,1.1,1.1,1.1], 
          fontSize: 11, fontFace: "Calibri", 
          border: { type: "solid", color: "E2E8F0", pt: 0.5 }, 
          rowH: 0.5,
          autoPage: true,
          newPageStartY: CONTENT_TOP + 0.05,
        } as any,
      );

      // ── Pass/Fail per Program ────────────────────────────────────────────────
      setP("Building data table slides", "Pass/Fail breakdown by program…", 80);
      programs.forEach((prog) => {
        pageNum++;
        const group = students.filter(s => s.program === prog);
        const pPass = group.filter(s => !s.isFail).length;
        const pFail = group.length - pPass;
        const slide = prs.addSlide();
        sectionHeader(slide, `✅  ${prog} — Pass / Fail`, pageNum);

        slide.addShape(prs.ShapeType.rect, { x: 1.5, y: CONTENT_TOP + 0.2, w: 3.5, h: 2.0, fill: { color: "F0FDF4" }, line: { color: PASS_C, width: 2 } });
        slide.addText(pPass.toString(), { x: 1.5, y: CONTENT_TOP + 0.25, w: 3.5, h: 1.1, fontSize: 64, bold: true, color: PASS_C, align: "center" });
        slide.addText("PASS", { x: 1.5, y: CONTENT_TOP + 1.35, w: 3.5, h: 0.38, fontSize: 18, bold: true, color: PASS_C, align: "center" });
        slide.addText(`${(pPass/group.length*100).toFixed(1)}%`, { x: 1.5, y: CONTENT_TOP + 1.73, w: 3.5, h: 0.3, fontSize: 13, color: PASS_C, align: "center" });

        slide.addShape(prs.ShapeType.rect, { x: 8.3, y: CONTENT_TOP + 0.2, w: 3.5, h: 2.0, fill: { color: "FFF1F2" }, line: { color: FAIL_C, width: 2 } });
        slide.addText(pFail.toString(), { x: 8.3, y: CONTENT_TOP + 0.25, w: 3.5, h: 1.1, fontSize: 64, bold: true, color: FAIL_C, align: "center" });
        slide.addText("FAIL", { x: 8.3, y: CONTENT_TOP + 1.35, w: 3.5, h: 0.38, fontSize: 18, bold: true, color: FAIL_C, align: "center" });
        slide.addText(`${(pFail/group.length*100).toFixed(1)}%`, { x: 8.3, y: CONTENT_TOP + 1.73, w: 3.5, h: 0.3, fontSize: 13, color: FAIL_C, align: "center" });

        slide.addText(`Total: ${group.length} students`, { x: 0, y: CONTENT_TOP + 2.3, w: W, h: 0.32, fontSize: 13, color: MUTED, align: "center" });

        const deptBreak: pptxgen.TableRow[] = departments
          .map((dept, i) => {
            const dg = students.filter(s => s.program === prog && s.department === dept);
            if (!dg.length) return null;
            const dp = dg.filter(s => !s.isFail).length;
            return [
              { text: dept, options: { bold: true, color: DEPT_COLORS[i % DEPT_COLORS.length], fill: { color: WHITE } } },
              { text: dg.length.toString(), options: { align: "center" as const, fill: { color: WHITE } } },
              { text: dp.toString(), options: { color: PASS_C, align: "center" as const, fill: { color: WHITE } } },
              { text: (dg.length-dp).toString(), options: { color: FAIL_C, align: "center" as const, fill: { color: WHITE } } },
              { text: `${(dp/dg.length*100).toFixed(1)}%`, options: { align: "center" as const, fill: { color: WHITE } } },
              { text: avgScore(dg.map(s => s.cgpa)).toFixed(2), options: { bold: true, align: "center" as const, fill: { color: WHITE } } },
            ];
          })
          .filter(Boolean) as pptxgen.TableRow[];

        if (deptBreak.length) {
          slide.addTable(
            [hdr(["Department","Students","Pass","Fail","Pass %","Avg CGPA"]), ...deptBreak],
            { 
              x: 1.5, y: CONTENT_TOP + 2.85, w: 10.3, 
              colW: [3.5,1.5,1.2,1.2,1.5,1.4], 
              fontSize: 13, fontFace: "Calibri", 
              border: { type: "solid", color: "E2E8F0", pt: 0.5 }, 
              rowH: 0.36,
              autoPage: true,
              newPageStartY: CONTENT_TOP + 0.05,
            } as any,
          );
        }
      });

      // ── Student Records slides ────────────────────────────────────────────────
      const ROWS_PER_SLIDE = 21;
      const shownCourses = courseColumns.slice(0, 3);
      const totalStudentSlides = Math.ceil(students.length / ROWS_PER_SLIDE);
      for (let i = 0; i < students.length; i += ROWS_PER_SLIDE) {
        const slideIdx = Math.floor(i / ROWS_PER_SLIDE);
        const pct = Math.round(85 + (slideIdx / totalStudentSlides) * 10);
        setP("Building student record slides", `Slide ${slideIdx + 1} of ${totalStudentSlides}…`, pct);

        pageNum++;
        const chunk = students.slice(i, i + ROWS_PER_SLIDE);
        const slide = prs.addSlide();
        sectionHeader(slide, `📋  Student Records (${i+1}–${i+chunk.length} of ${students.length})`, pageNum);

        const dataRows: pptxgen.TableRow[] = chunk.map(s => [
          { text: s.studentName || "—", options: { bold: true, fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          { text: s.registerNumber, options: { color: MUTED, fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          { text: s.program, options: { fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          { text: s.department, options: { fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          { text: s.sem, options: { align: "center" as const, fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          ...shownCourses.map(c => ({
            text: s.courses[c] || "—",
            options: { align: "center" as const, bold: s.courses[c] === "F", color: s.courses[c] === "F" ? FAIL_C : "1e293b", fill: { color: s.isFail ? "FFF1F2" : WHITE } },
          })),
          { text: s.cgpa.toFixed(2), options: { bold: true, align: "center" as const, fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          { text: s.sgpa.toFixed(2), options: { align: "center" as const, color: MUTED, fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
          { text: s.isFail ? "FAIL" : "PASS", options: { bold: true, align: "center" as const, color: s.isFail ? FAIL_C : PASS_C, fill: { color: s.isFail ? "FFF1F2" : WHITE } } },
        ]);

        const courseColW = shownCourses.map(() => 0.72);
        slide.addTable(
          [hdr(["Name","Reg No","Program","Department","Sem",...shownCourses,"CGPA","SGPA","Result"]), ...dataRows],
          { 
            x: 0.3, y: CONTENT_TOP + 0.05, w: W - 0.6, 
            colW: [2.0,1.4,1.0,1.8,0.45,...courseColW,0.7,0.7,0.85], 
            fontSize: 10, fontFace: "Calibri", 
            border: { type: "solid", color: "E2E8F0", pt: 0.5 }, 
            rowH: 0.27,
            autoPage: true,
            newPageStartY: CONTENT_TOP + 0.05,
          } as any,
        );
      }

      setP("Saving file", `Saving ${pageNum}-slide presentation to your device…`, 96);
      await new Promise(r => setTimeout(r, 300));
      await prs.writeFile({ fileName: `${fileName}-${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pptx` });

      setP("Done!", "Your PPT has been downloaded.", 100);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.error("PPT export failed:", e);
    } finally {
      if (container) {
        container.style.width = originalWidth || "";
        container.style.maxWidth = originalMaxWidth || "";
      }
      setProgress(null);
    }
  };

  return (
    <>
      {progress && <ProgressOverlay progress={progress} />}
      <button
        onClick={buildPPT}
        disabled={!!progress}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg,#C9501A 0%,#E07B3A 100%)",
          color: "#fff",
          boxShadow: "0 2px 12px rgba(201,80,26,0.25)",
        }}
      >
        {progress ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating PPT…</>
        ) : (
          <><FileText className="w-4 h-4" /> PPT Export</>
        )}
      </button>
    </>
  );
}

