import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { ParsedData, parseCSV } from "@/lib/csvParser";

interface FileUploadProps {
  onDataParsed: (data: ParsedData) => void;
}

export default function FileUpload({ onDataParsed }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    setLoading(true);
    setError(null);
    setFileName(file.name);
    const data = await parseCSV(file);
    if (data.errors.length > 0 && data.students.length === 0) {
      setError(data.errors[0]);
      setLoading(false);
      return;
    }
    setLoading(false);
    onDataParsed(data);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`upload-zone ${dragging ? "dragover" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
            <p className="text-muted-foreground font-medium">Parsing CSV data…</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-foreground">{fileName}</p>
            <button
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
              onClick={e => { e.stopPropagation(); reset(); }}
            >
              <X className="w-3 h-3" /> Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gold-accent flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-1">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse — supports result CSV with grades
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="w-4 h-4" />
              Program | Department | Sem | Student Name | Reg No | Courses | CGPA | SGPA | Result
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
