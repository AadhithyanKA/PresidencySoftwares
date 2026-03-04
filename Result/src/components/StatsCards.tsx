import { StudentRecord } from "@/lib/csvParser";
import { Users, TrendingUp, GraduationCap, BookOpen, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  students: StudentRecord[];
  departments: string[];
}

export default function StatsCards({ students, departments }: StatsCardsProps) {
  const total = students.length;
  const passed = students.filter(s => !s.isFail).length;
  const failed = students.filter(s => s.isFail).length;
  // Calculate average CGPA correctly
  const avgCGPA = total > 0 
    ? (students.reduce((sum, s) => sum + s.cgpa, 0) / total).toFixed(2) 
    : "—";
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0";

  const stats = [
    { 
      label: "Total Students", 
      value: total, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      desc: "Enrolled in current batch"
    },
    { 
      label: "Average CGPA", 
      value: avgCGPA, 
      icon: TrendingUp, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      desc: "Overall academic performance"
    },
    { 
      label: "Pass Rate", 
      value: `${passRate}%`, 
      icon: GraduationCap, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      desc: `${passed} students passed`
    },
    { 
      label: "Departments", 
      value: departments.length, 
      icon: BookOpen, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50",
      desc: "Across all programs"
    },
    { 
      label: "Failed Students", 
      value: failed, 
      icon: AlertTriangle, 
      color: "text-rose-600", 
      bg: "bg-rose-50",
      desc: "Needs attention"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
             <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.color} uppercase tracking-wider`}>
              {s.label}
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">{s.value}</div>
            <div className="text-xs text-slate-400 font-medium">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
