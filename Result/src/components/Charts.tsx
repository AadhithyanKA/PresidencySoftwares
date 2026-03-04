import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  ChartOptions
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { StudentRecord, cgpaRange, CGPA_RANGE_ORDER } from "@/lib/csvParser";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  ChartDataLabels
);

// ── Helpers ──────────────────────────────────────────────────────────────────

const isFoundation = (dept: string) => dept.trim().toLowerCase().includes("foundation");

// Modern Color Palette
const COLORS = {
  primary: "#1e293b", // Slate 800
  secondary: "#f59e0b", // Amber 500
  pass: "#10b981", // Emerald 500
  fail: "#ef4444", // Red 500
  dept: [
    "#3b82f6", // Blue 500
    "#f97316", // Orange 500
    "#06b6d4", // Cyan 500
    "#8b5cf6", // Violet 500
    "#ec4899", // Pink 500
    "#84cc16", // Lime 500
    "#14b8a6", // Teal 500
    "#f43f5e", // Rose 500
  ],
  grades: {
    "O":    "#1e40af", // Blue 800
    "A+":   "#2563eb", // Blue 600
    "A":    "#0ea5e9", // Sky 500
    "B+":   "#10b981", // Emerald 500
    "B":    "#f59e0b", // Amber 500
    "C":    "#f97316", // Orange 500
    "D":    "#ef4444", // Red 500 (Pass/Fail border?) Maybe distinct color?
    "F":    "#dc2626", // Red 600
  }
};

// Common Chart Options
const commonOptions: ChartOptions<any> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: "'Inter', sans-serif",
          size: 11
        },
        color: "#64748b"
      }
    },
    title: {
      display: false, // We use custom HTML titles
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1e293b',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      boxPadding: 4,
      usePointStyle: true,
      titleFont: { family: "'Inter', sans-serif", size: 13, weight: 'bold' },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y;
          } else if (context.parsed !== null) {
            label += context.parsed;
          }
          return label;
        }
      }
    },
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold',
        size: 11
      },
      formatter: (value: any, ctx: any) => {
        // Only show if value is significant
        if (typeof value === 'number') {
           const dataset = ctx.chart.data.datasets[0];
           const total = dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
           const percentage = ((value / total) * 100).toFixed(0);
           return percentage + '%';
        }
        return value;
      },
      display: (ctx: any) => {
         const dataset = ctx.chart.data.datasets[0];
         const value = dataset.data[ctx.dataIndex];
         const total = dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
         return (value / total) > 0.05; // Hide if < 5%
      }
    }
  },
  layout: {
    padding: 10
  }
};

// ── Components ───────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) {
  return (
    <div className="chart-card flex flex-col h-full bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className="flex-1 w-full min-h-[300px] relative">
        {children}
      </div>
    </div>
  );
}

// ── Overall CGPA by Program (Doughnut) ───────────────────────────────────────

export function OverallCGPAChart({ students, programs }: { students: StudentRecord[]; programs: string[] }) {
  const dataMap = programs.map((prog, i) => {
    const group = students.filter(s => s.program === prog);
    const avg = group.length ? group.reduce((s, r) => s + r.cgpa, 0) / group.length : 0;
    const dept = group.length ? group[0].department : "";
    return {
      label: prog, // Show only Program
      tooltipLabel: `${prog} (${dept})`, // Show Program (Dept) in tooltip
      value: parseFloat(avg.toFixed(2)),
      count: group.length,
      color: COLORS.dept[i % COLORS.dept.length]
    };
  });

  const data = {
    labels: dataMap.map(d => d.label),
    datasets: [
      {
        data: dataMap.map(d => d.value),
        backgroundColor: dataMap.map(d => d.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      datalabels: {
        ...commonOptions.plugins?.datalabels,
        formatter: (value, ctx) => {
          const item = dataMap[ctx.dataIndex];
          return `${item.value}`;
        },
        color: '#fff',
        display: true // Always show avg CGPA
      },
      tooltip: {
        ...commonOptions.plugins?.tooltip,
        callbacks: {
          title: (context) => {
             const item = dataMap[context[0].dataIndex];
             return item.tooltipLabel;
          },
          label: (context) => {
            const item = dataMap[context.dataIndex];
            return `Avg ${item.value} (${item.count} students)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <ChartCard title="Overall CGPA by Program" subtitle="Average CGPA comparison across programs">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-800">{students.length}</p>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Students</p>
        </div>
      </div>
    </ChartCard>
  );
}

// ── Department-wise Average CGPA (Bar) ───────────────────────────────────────

export function DeptCGPAChart({ students, departments }: { students: StudentRecord[]; departments: string[] }) {
  const sortedData = departments.map((dept, i) => {
    const group = students.filter(s => s.department === dept);
    const useS = isFoundation(dept);
    const avg = group.length
      ? group.reduce((s, r) => s + (useS ? r.sgpa : r.cgpa), 0) / group.length
      : 0;
    const program = group.length ? group[0].program : "";
    return {
      label: `${program} (${dept})`,
      value: parseFloat(avg.toFixed(2)),
      count: group.length,
      color: COLORS.dept[i % COLORS.dept.length],
      metric: useS ? "SGPA" : "CGPA"
    };
  }).sort((a, b) => b.value - a.value);

  const data = {
    labels: sortedData.map(d => d.label),
    datasets: [
      {
        label: 'Average GPA',
        data: sortedData.map(d => d.value),
        backgroundColor: sortedData.map(d => d.color),
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: { family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#64748b',
          maxRotation: 45,
          minRotation: 0,
          autoSkip: false
        }
      }
    },
    plugins: {
      ...commonOptions.plugins,
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#475569',
        font: { weight: 'bold' },
        formatter: (value) => value.toFixed(2),
        display: true
      },
      legend: {
        display: false
      },
      tooltip: {
        ...commonOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const item = sortedData[context.dataIndex];
            return `${item.label}: ${item.value} (${item.metric}) - ${item.count} students`;
          }
        }
      }
    }
  };

  return (
    <ChartCard title="Department Performance" subtitle="Average GPA by department (Foundation uses SGPA)">
      <Bar data={data} options={options} />
    </ChartCard>
  );
}

// ── Department-wise Grade Distribution (Pie) ─────────────────────────────────

export function DeptCGPAPieChart({ students, departments }: { students: StudentRecord[]; departments: string[] }) {
  return (
    <div>
       <div data-pdf-section className="mb-6">
        <h3 className="text-2xl font-bold text-slate-800">Grade Distribution Analysis</h3>
        <p className="text-slate-500">Breakdown of grades per department</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const group = students.filter(s => s.department === dept);
          const useS = isFoundation(dept);
          const programName = group.length > 0 ? group[0].program : dept;
          
          const counts: Record<string, number> = {};
          CGPA_RANGE_ORDER.forEach(r => { counts[r] = 0; });
          group.forEach(s => {
            const score = useS ? s.sgpa : s.cgpa;
            const r = cgpaRange(score);
            counts[r] = (counts[r] || 0) + 1;
          });

          const chartData = {
            labels: CGPA_RANGE_ORDER,
            datasets: [
              {
                data: CGPA_RANGE_ORDER.map(r => counts[r]),
                backgroundColor: CGPA_RANGE_ORDER.map(r => COLORS.grades[r]),
                borderColor: '#ffffff',
                borderWidth: 2,
              }
            ]
          };

          const options: ChartOptions<'pie'> = {
            ...commonOptions,
            plugins: {
              ...commonOptions.plugins,
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: { family: "'Inter', sans-serif", size: 11 }
                }
              }
            }
          };

          return (
            <div key={dept} data-pdf-section className="h-full">
              <ChartCard title={`${programName} (${dept})`} subtitle={`${group.length} students ${useS ? '(SGPA)' : '(CGPA)'}`}>
                <Pie data={chartData} options={options} />
              </ChartCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pass/Fail Charts ─────────────────────────────────────────────────────────

export function DeptPassFailChart({ students, departments }: { students: StudentRecord[]; departments: string[] }) {
  const labels = departments.map(d => {
    const group = students.filter(s => s.department === d);
    const program = group.length ? group[0].program : "";
    return `${program} (${d})`;
  });
  const passData = departments.map(d => students.filter(s => s.department === d && !s.isFail).length);
  const failData = departments.map(d => students.filter(s => s.department === d && s.isFail).length);

  const data = {
    labels,
    datasets: [
      {
        label: 'Pass',
        data: passData,
        backgroundColor: COLORS.pass,
        borderRadius: 4,
      },
      {
        label: 'Fail',
        data: failData,
        backgroundColor: COLORS.fail,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...commonOptions,
    scales: {
      x: { stacked: false, grid: { display: false } },
      y: { stacked: false, grid: { color: '#f1f5f9' } }
    },
    plugins: {
      ...commonOptions.plugins,
      datalabels: {
        display: (ctx) => {
           const val = ctx.dataset.data[ctx.dataIndex] as number;
           return val > 0;
        },
        color: '#fff',
        font: { weight: 'bold', size: 10 },
        formatter: (val) => val
      }
    }
  };

  return (
    <ChartCard title="Pass vs Fail Overview" subtitle="Student count per department">
      <Bar data={data} options={options} />
    </ChartCard>
  );
}

export function DeptPassFailPieChart({ students, departments }: { students: StudentRecord[]; departments: string[] }) {
  return (
    <div>
      <div data-pdf-section className="mb-6 mt-8">
        <h3 className="text-2xl font-bold text-slate-800">Pass/Fail Breakdown</h3>
        <p className="text-slate-500">Detailed pass percentage by department</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {departments.map((dept) => {
          const group = students.filter(s => s.department === dept);
          const pass = group.filter(s => !s.isFail).length;
          const fail = group.filter(s => s.isFail).length;
          const programName = group.length > 0 ? group[0].program : dept;

          const data = {
            labels: ['Pass', 'Fail'],
            datasets: [
              {
                data: [pass, fail],
                backgroundColor: [COLORS.pass, COLORS.fail],
                borderColor: '#ffffff',
                borderWidth: 2,
              }
            ]
          };

          return (
            <div key={dept} data-pdf-section className="h-full">
              <ChartCard title={`${programName} (${dept})`} subtitle={`${group.length} Total`}>
                <Doughnut data={data} options={{
                  ...commonOptions,
                  cutout: '70%',
                  plugins: {
                    ...commonOptions.plugins,
                    legend: {
                      display: true,
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { family: "'Inter', sans-serif", size: 11 }
                      }
                    },
                    datalabels: {
                      color: (ctx) => ctx.dataIndex === 0 ? COLORS.pass : COLORS.fail,
                      anchor: 'center',
                      align: 'center',
                      font: { size: 14, weight: 'bold' },
                      formatter: (val) => {
                        const pct = ((val / group.length) * 100).toFixed(0);
                        return pct + '%';
                      },
                      display: (ctx) => {
                         // Show only the larger slice in the center? No, let's show both if space allows, 
                         // or just rely on legend. Actually let's disable datalabels inside and put text in middle.
                         return false; 
                      }
                    }
                  }
                }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: pass >= fail ? COLORS.pass : COLORS.fail }}>
                      {((pass / group.length) * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Pass Rate</p>
                  </div>
                </div>
              </ChartCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Overall Grade Distribution ───────────────────────────────────────────────

export function CGPADistributionChart({ students }: { students: StudentRecord[] }) {
  const counts: Record<string, number> = {};
  CGPA_RANGE_ORDER.forEach(r => { counts[r] = 0; });
  students.forEach(s => {
    const r = cgpaRange(s.cgpa); // Overall usually implies CGPA
    counts[r] = (counts[r] || 0) + 1;
  });

  const data = {
    labels: CGPA_RANGE_ORDER,
    datasets: [
      {
        data: CGPA_RANGE_ORDER.map(r => counts[r]),
        backgroundColor: CGPA_RANGE_ORDER.map(r => COLORS.grades[r]),
        borderColor: '#ffffff',
        borderWidth: 2,
      }
    ]
  };

  return (
    <ChartCard title="Overall Grade Distribution" subtitle={`Across all ${students.length} students`}>
      <Doughnut data={data} options={{ ...commonOptions, cutout: '60%' }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-800">{students.length}</p>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Students</p>
        </div>
      </div>
    </ChartCard>
  );
}
