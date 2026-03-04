import { createPortal } from "react-dom";
import { Loader2, FileCheck } from "lucide-react";

export interface ProgressState {
  step: string;
  detail: string;
  pct: number;
}

interface ProgressOverlayProps {
  progress: ProgressState;
  steps?: { label: string; threshold: number }[];
}

const DEFAULT_STEPS = [
  { label: "Loading logos & assets", threshold: 10 },
  { label: "Preparing slides", threshold: 25 },
  { label: "Capturing content", threshold: 70 },
  { label: "Building PDF", threshold: 90 },
  { label: "Saving file", threshold: 100 },
];

export function ProgressOverlay({ progress, steps = DEFAULT_STEPS }: ProgressOverlayProps) {
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
            <p className="font-bold text-base text-white">Generating Report</p>
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
            {steps.map((s) => {
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
