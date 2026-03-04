import { useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, FileCheck, Loader2 } from "lucide-react";
import presidencyLogoSrc from "@/assets/presidency-university-logo.png";
import psodLogoSrc from "@/assets/psod-logo.png";

interface PDFExportProps {
  contentId: string;
  fileName?: string;
}

interface ProgressState {
  step: string;
  detail: string;
  pct: number;
}

async function toDataUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      } catch { resolve(""); }
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

// ── Progress overlay ─────────────────────────────────────────────────────────
function ProgressOverlay({ progress }: { progress: ProgressState }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(11,17,32,0.82)", backdropFilter: "blur(6px)" }}>
      <div className="w-[420px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3"
          style={{ background: "hsl(var(--primary))" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--secondary) / 0.25)" }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(var(--secondary))" }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "hsl(var(--primary-foreground))" }}>
              Generating PDF Report
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--primary-foreground) / 0.65)" }}>
              Please don't close this tab
            </p>
          </div>
          <span className="ml-auto text-sm font-bold tabular-nums"
            style={{ color: "hsl(var(--secondary))" }}>
            {progress.pct}%
          </span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Progress bar */}
          <div className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "hsl(var(--muted))" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress.pct}%`,
                background: "linear-gradient(90deg, hsl(var(--secondary)), hsl(var(--secondary) / 0.7))",
              }}
            />
          </div>

          {/* Step info */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse"
              style={{ background: "hsl(var(--secondary))" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {progress.step}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {progress.detail}
              </p>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-1.5 pt-1">
            {[
              { label: "Loading logos & assets", threshold: 10 },
              { label: "Preparing page layout", threshold: 20 },
              { label: "Capturing report sections", threshold: 80 },
              { label: "Building PDF document", threshold: 90 },
              { label: "Saving file", threshold: 100 },
            ].map((s) => {
              const done = progress.pct >= s.threshold;
              const active = progress.pct >= s.threshold - 15 && !done;
              return (
                <div key={s.label} className="flex items-center gap-2.5 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    done ? "opacity-100" : active ? "opacity-70" : "opacity-25"
                  }`}
                    style={{ background: done ? "hsl(var(--secondary))" : "hsl(var(--muted))" }}>
                    {done && <FileCheck className="w-2.5 h-2.5" style={{ color: "hsl(var(--primary))" }} />}
                    {!done && <span className="w-1.5 h-1.5 rounded-full block"
                      style={{ background: active ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))" }} />}
                  </div>
                  <span style={{ color: done ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    className={done ? "font-medium" : ""}>
                    {s.label}
                  </span>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function PDFExport({ contentId, fileName = "result-analysis-report" }: PDFExportProps) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const setP = (step: string, detail: string, pct: number) =>
    setProgress({ step, detail, pct });

  const exportPDF = async () => {
    setP("Loading logos & assets", "Fetching logos…", 5);
    
    // Force container width to ensure charts render fully
    const container = document.getElementById(contentId);
    if (!container) { setProgress(null); return; }
    
    // Store original styles to restore later
    const originalWidth = container.style.width;
    const originalMaxWidth = container.style.maxWidth;
    
    // Force wide layout for chart rendering
    container.style.width = "700px";
    container.style.maxWidth = "none";
    
    // Inject PDF-specific styles to fix sizing
    const style = document.createElement('style');
    style.id = 'pdf-export-styles';
    style.innerHTML = `
      #${contentId} .chart-card h3 { 
        font-size: 24px !important; 
        line-height: 1.3 !important;
        margin-bottom: 10px !important;
      }
      #${contentId} .chart-card p { 
        font-size: 12px !important; 
        margin-bottom: 10px !important;
      }
      #${contentId} .chart-card canvas { 
        height: 220px !important;
        max-height: 220px !important;
      }
      #${contentId} .chart-card {
        padding: 16px !important;
        break-inside: avoid;
        page-break-inside: avoid;
        box-shadow: none !important;
        border: 1px solid #e2e8f0 !important;
      }
      #${contentId} [data-pdf-section] {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding-bottom: 20px !important;
        margin-bottom: 24px !important;
        align-self: start !important;
        flex: none !important;
      }
      /* Force 2-column grid for pie charts to save space */
      #${contentId} .grid-cols-1.md\\:grid-cols-2 {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 16px !important;
      }
    `;
    document.head.appendChild(style);

    // Wait for Recharts to update (it uses ResizeObserver)
    await new Promise(r => setTimeout(r, 800));

    try {
      // ── A4 Portrait dimensions (mm) ──────────────────────────────────────────
      const PAGE_W = 210;
      const PAGE_H = 297;
      const MARGIN = 10;
      const HEADER_H = 22;
      const FOOTER_H = 10;
      const CONTENT_W = PAGE_W - MARGIN * 2;        // 190 mm
      const USABLE_TOP = MARGIN + HEADER_H + 3;     // 45 mm from top
      const USABLE_BOT = PAGE_H - MARGIN - FOOTER_H; // 277 mm from top
      const USABLE_H = USABLE_BOT - USABLE_TOP;     // ~232 mm per page

      const [presidencyB64, psodB64] = await Promise.all([
        toDataUrl(presidencyLogoSrc),
        toDataUrl(psodLogoSrc),
      ]);

      setP("Preparing page layout", "Initialising A4 portrait PDF…", 15);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // ── Page chrome: header + footer ─────────────────────────────────────────
      const drawPageChrome = (pageNum: number) => {
        // Header bar
        pdf.setFillColor(27, 42, 74);
        pdf.rect(0, 0, PAGE_W, MARGIN + HEADER_H, "F");

        // PSOD logo — left
        const psodSize = 16;
        const psodX = MARGIN;
        const psodY = (MARGIN + HEADER_H - psodSize) / 2;
        pdf.setFillColor(255, 255, 255);
        pdf.circle(psodX + psodSize / 2, psodY + psodSize / 2, psodSize / 2 + 0.5, "F");
        if (psodB64) pdf.addImage(psodB64, "PNG", psodX, psodY, psodSize, psodSize);

        // Presidency logo — centre
        const presH = 13;
        const presW = presH * (640 / 220);
        const presX = (PAGE_W - presW) / 2;
        const presY = (MARGIN + HEADER_H - presH) / 2;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(presX - 3, presY - 1.5, presW + 6, presH + 3, 2, 2, "F");
        if (presidencyB64) pdf.addImage(presidencyB64, "PNG", presX, presY, presW, presH);

        // Gold separator line
        pdf.setFillColor(201, 168, 76);
        pdf.rect(0, MARGIN + HEADER_H, PAGE_W, 0.8, "F");

        // Footer bar
        pdf.setFillColor(27, 42, 74);
        pdf.rect(0, PAGE_H - MARGIN - FOOTER_H, PAGE_W, MARGIN + FOOTER_H, "F");
        pdf.setFillColor(201, 168, 76);
        pdf.rect(0, PAGE_H - MARGIN - FOOTER_H, PAGE_W, 0.7, "F");

        const footerY = PAGE_H - MARGIN - FOOTER_H + 7;
        pdf.setFontSize(7); pdf.setTextColor(180, 190, 210);
        pdf.text("Generated using ARA", MARGIN + 1, footerY);
        pdf.setFontSize(7.5); pdf.setTextColor(201, 168, 76);
        pdf.text("Presidency University, Bangalore", PAGE_W / 2, footerY, { align: "center" });
        pdf.setFontSize(7); pdf.setTextColor(180, 190, 210);
        pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN - 1, footerY, { align: "right" });
        pdf.setTextColor(0, 0, 0);
      };

      // ── Reveal hidden-screen elements for capture ─────────────────────────────
      const hiddenEls = container.querySelectorAll(".hidden-screen") as NodeListOf<HTMLElement>;

      hiddenEls.forEach(el => {
        el.style.position = "static";
        el.style.left = "auto";
        el.style.visibility = "visible";
        el.style.overflow = "visible";
        el.style.height = "auto";
      });

      const sections = Array.from(
          container.querySelectorAll("[data-pdf-section]")
        ) as HTMLElement[];

      let currentY = USABLE_TOP;
      let currentPage = 1;
      drawPageChrome(currentPage);

      const PCT_START = 20;
      const PCT_END = 85;

      for (let si = 0; si < sections.length; si++) {
        const section = sections[si];
        const pct = Math.round(PCT_START + ((si + 1) / sections.length) * (PCT_END - PCT_START));
        const label = section.querySelector("h2,h3,h4,p")?.textContent?.trim().slice(0, 50) || `Section ${si + 1}`;

        setP(`Capturing section ${si + 1} of ${sections.length}`, `"${label}"`, pct);

        // Hide interactive-only elements during capture
        const hideEls = section.querySelectorAll("[data-pdf-hide]") as NodeListOf<HTMLElement>;
        hideEls.forEach(el => { el.style.display = "none"; });

        let canvas: HTMLCanvasElement;
        try {
          canvas = await html2canvas(section, {
            scale: 2,            // slightly lower scale to save memory with larger window
            useCORS: true,
            backgroundColor: "#f7f9fc",
            windowWidth: 700,   // wider capture window to prevent chart cutoffs
            scrollY: -window.scrollY,
            imageTimeout: 0,
            logging: false,
          });
        } catch (err) {
          console.warn("Section capture failed:", err);
          hideEls.forEach(el => { el.style.display = ""; });
          continue;
        }

        hideEls.forEach(el => { el.style.display = ""; });

        // Convert canvas pixels → mm on the PDF page
        // canvas was captured at scale=2, so 1 CSS pixel = 2 canvas pixels
        const CAPTURE_SCALE = 2;
        const cssW = canvas.width / CAPTURE_SCALE;
        const cssH = canvas.height / CAPTURE_SCALE;

        // Scale to fit CONTENT_W exactly
        const scaleRatio = CONTENT_W / cssW;
        const sectionMM_H = cssH * scaleRatio;

        if (sectionMM_H <= USABLE_H) {
          // ── Section fits on a single page: never cut it ──────────────────────
          const remaining = USABLE_BOT - currentY;
          if (sectionMM_H > remaining) {
            // Not enough room → push to next page
            currentPage++;
            pdf.addPage();
            drawPageChrome(currentPage);
            currentY = USABLE_TOP;
          }
          const imgData = canvas.toDataURL("image/jpeg", 0.93);
          pdf.addImage(imgData, "JPEG", MARGIN, currentY, CONTENT_W, sectionMM_H);
          currentY += sectionMM_H + 5;
        } else {
          // ── Section taller than one full page: slice it (e.g. student table) ─
          const pxPerMM = canvas.height / sectionMM_H;
          let sliceStartPx = 0;

          while (sliceStartPx < canvas.height) {
            const availMM = USABLE_BOT - currentY;
            let sliceHeightPx = Math.floor(availMM * pxPerMM);

            if (sliceHeightPx <= 20) {
              // Almost no room — new page
              currentPage++;
              pdf.addPage();
              drawPageChrome(currentPage);
              currentY = USABLE_TOP;
              continue;
            }

            sliceHeightPx = Math.min(sliceHeightPx, canvas.height - sliceStartPx);

            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeightPx;
            sliceCanvas.getContext("2d")!.drawImage(
              canvas,
              0, sliceStartPx,          // source x, y
              canvas.width, sliceHeightPx, // source w, h
              0, 0,                      // dest x, y
              canvas.width, sliceHeightPx  // dest w, h
            );

            const sliceImg = sliceCanvas.toDataURL("image/jpeg", 0.93);
            const sliceH = sliceHeightPx / pxPerMM;

            pdf.addImage(sliceImg, "JPEG", MARGIN, currentY, CONTENT_W, sliceH);
            currentY += sliceH + 2;
            sliceStartPx += sliceHeightPx;

            if (sliceStartPx < canvas.height) {
              currentPage++;
              pdf.addPage();
              drawPageChrome(currentPage);
              currentY = USABLE_TOP;
            }
          }
        }

        // If we're very close to the bottom, start fresh on the next section
        if (currentY > USABLE_BOT - 8) {
          currentPage++;
          pdf.addPage();
          drawPageChrome(currentPage);
          currentY = USABLE_TOP;
        }
      }

      // ── Restore hidden-screen elements ────────────────────────────────────────
      hiddenEls.forEach(el => {
        el.style.position = "";
        el.style.left = "";
        el.style.visibility = "";
        el.style.overflow = "";
        el.style.height = "";
      });

      setP("Saving file", `Saving ${currentPage}-page portrait PDF…`, 95);
      await new Promise(r => setTimeout(r, 400));

      pdf.save(`${fileName}-${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`);

      setP("Done!", "Your PDF has been downloaded.", 100);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      // Restore hidden elements & container width
      const container = document.getElementById(contentId);
      
      // Remove injected styles
      const style = document.getElementById('pdf-export-styles');
      if (style) style.remove();

      if (container) {
        // Restore width
        container.style.width = originalWidth;
        container.style.maxWidth = originalMaxWidth;

        const hiddenEls = container.querySelectorAll(".hidden-screen") as NodeListOf<HTMLElement>;
        // We can't access originalStyles here easily unless we lift scope, 
        // but typically we just want to clear the inline overrides.
        hiddenEls.forEach(el => {
          el.style.position = "";
          el.style.left = "";
          el.style.visibility = "";
          el.style.overflow = "";
          el.style.height = "";
        });
      }
      setProgress(null);
    }
  };

  return (
    <>
      {progress && <ProgressOverlay progress={progress} />}
      <button
        onClick={exportPDF}
        disabled={!!progress}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "var(--gradient-gold)",
          color: "hsl(var(--primary))",
          boxShadow: "var(--shadow-gold)",
        }}
      >
        {progress ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
        ) : (
          <><Download className="w-4 h-4" /> PDF Report</>
        )}
      </button>
    </>
  );
}
