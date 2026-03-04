import { Button } from "@/components/ui/button";
import { FileCode } from "lucide-react";
import { StudentRecord, CGPA_RANGE_ORDER } from "@/lib/csvParser";

interface HTMLExportProps {
  students: StudentRecord[];
  departments: string[];
}

export default function HTMLExport({ students, departments }: HTMLExportProps) {
  const handleExport = () => {
    // 1. Prepare Data
    const serializedStudents = JSON.stringify(students);
    const serializedDepartments = JSON.stringify(departments);
    const serializedRangeOrder = JSON.stringify(CGPA_RANGE_ORDER);

    // 2. HTML Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presidency Result Analysis Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .chart-container { position: relative; height: 100%; width: 100%; }
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 h-screen overflow-hidden flex flex-col">

    <!-- Top Bar -->
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
            <h1 class="text-xl font-bold text-slate-800">Presidency Result Analysis</h1>
            <p class="text-xs text-slate-500">Interactive Report</p>
        </div>
        <div class="flex gap-3">
            <button id="btn-dashboard" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition text-sm">Dashboard View</button>
            <button id="btn-presentation" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Presentation Mode
            </button>
        </div>
    </header>

    <!-- Dashboard View -->
    <main id="dashboard-view" class="flex-1 overflow-y-auto p-6">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8" id="stats-container">
            <!-- Injected by JS -->
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Overall CGPA by Program</h3>
                <div class="h-[300px]"><canvas id="chart-overall-cgpa"></canvas></div>
            </div>
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Department Performance</h3>
                <div class="h-[300px]"><canvas id="chart-dept-cgpa"></canvas></div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
             <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Pass vs Fail Overview</h3>
                <div class="h-[300px]"><canvas id="chart-dept-passfail"></canvas></div>
            </div>
             <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Overall Grade Distribution</h3>
                <div class="h-[300px]"><canvas id="chart-overall-dist"></canvas></div>
            </div>
        </div>

        <h3 class="text-xl font-bold text-slate-800 mb-4 mt-8">Grade Distribution Analysis</h3>
        <div id="dept-charts-container" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <!-- Injected by JS -->
        </div>

        <h3 class="text-xl font-bold text-slate-800 mb-4">Pass/Fail Breakdown</h3>
        <div id="dept-passfail-container" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-12">
            <!-- Injected by JS -->
        </div>

    </main>

    <!-- Presentation View -->
    <div id="presentation-view" class="hidden fixed inset-0 bg-white z-50 flex flex-col">
        <div class="flex-1 relative flex items-center justify-center bg-slate-50 p-12">
            <button id="btn-close-pres" class="absolute top-6 right-6 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            
            <button id="btn-prev" class="absolute left-6 p-4 bg-white rounded-full shadow-lg hover:bg-slate-100 z-40 transition hover:-translate-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            
            <button id="btn-next" class="absolute right-6 p-4 bg-white rounded-full shadow-lg hover:bg-slate-100 z-40 transition hover:translate-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <div id="slides-wrapper" class="w-full h-full max-w-6xl mx-auto flex items-center justify-center">
                <!-- Slides injected here -->
            </div>
        </div>
        <div class="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center">
            <div class="text-sm font-medium text-slate-500" id="slide-counter">Slide 1 / 10</div>
            <div class="flex gap-2">
                 <div class="text-xs text-slate-400">Use Arrow Keys to Navigate</div>
            </div>
        </div>
    </div>

    <script>
        // Data Injection
        const students = ${serializedStudents};
        const departments = ${serializedDepartments};
        const CGPA_RANGE_ORDER = ${serializedRangeOrder};
        
        // --- Helper Functions ---
        const isFoundation = (dept) => dept.trim().toLowerCase().includes("foundation");
        const cgpaRange = (gpa) => {
            if (gpa >= 9) return "O";
            if (gpa >= 8) return "A+";
            if (gpa >= 7) return "A";
            if (gpa >= 6) return "B+";
            if (gpa >= 5.5) return "B";
            if (gpa >= 5.0) return "C";
            if (gpa >= 4.0) return "D";
            return "F";
        };

        // --- Colors ---
        const COLORS = {
            primary: "#1e293b",
            pass: "#10b981",
            fail: "#ef4444",
            dept: ["#3b82f6", "#f97316", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16", "#14b8a6", "#f43f5e"],
            grades: {
                "O": "#1e40af", "A+": "#2563eb", "A": "#0ea5e9",
                "B+": "#10b981", "B": "#f59e0b", "C": "#f97316", "D": "#ef4444", "F": "#dc2626"
            }
        };

        // --- Chart Config Helpers ---
        Chart.register(ChartDataLabels);
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b';
        
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (val, ctx) => {
                        const data = ctx.chart.data.datasets[0].data;
                        const total = data.reduce((a, b) => a + b, 0);
                        const pct = ((val / total) * 100).toFixed(0);
                        return pct > 5 ? pct + '%' : '';
                    }
                }
            }
        };

        // --- Data Processing & Rendering ---
        
        window.chartDataMap = {};

        function init() {
            renderStats();
            renderDashboardCharts();
            initPresentation();
        }

        function renderStats() {
            const total = students.length;
            const passed = students.filter(s => !s.isFail).length;
            const failed = students.filter(s => s.isFail).length;
            const avg = total ? (students.reduce((a,b) => a + b.cgpa, 0) / total).toFixed(2) : 0;
            const passRate = total ? ((passed/total)*100).toFixed(1) : 0;
            
            const stats = [
                { l: "Total Students", v: total, c: "text-blue-600", b: "bg-blue-50" },
                { l: "Average CGPA", v: avg, c: "text-amber-600", b: "bg-amber-50" },
                { l: "Pass Rate", v: passRate + "%", c: "text-emerald-600", b: "bg-emerald-50" },
                { l: "Departments", v: departments.length, c: "text-indigo-600", b: "bg-indigo-50" },
                { l: "Failed", v: failed, c: "text-rose-600", b: "bg-rose-50" }
            ];

            const container = document.getElementById('stats-container');
            container.innerHTML = stats.map(s => \`
                <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-xs font-bold px-2 py-1 rounded-full \${s.b} \${s.c} uppercase">\${s.l}</div>
                    </div>
                    <div class="text-3xl font-bold text-slate-800">\${s.v}</div>
                </div>
            \`).join('');
        }

        function renderDashboardCharts() {
            // 1. Overall CGPA by Program
            const programs = [...new Set(students.map(s => s.program))];
            const progData = programs.map((p, i) => {
                const g = students.filter(s => s.program === p);
                const avg = g.length ? g.reduce((a,b) => a + b.cgpa, 0) / g.length : 0;
                const dept = g.length ? g[0].department : "";
                return { 
                    l: p, // Show only Program
                    tl: \`\${p} (\${dept})\`, // Tooltip label
                    v: parseFloat(avg.toFixed(2)), 
                    c: COLORS.dept[i % COLORS.dept.length],
                    count: g.length
                };
            });

            const config1 = {
                type: 'doughnut',
                data: {
                    labels: progData.map(d => d.l),
                    datasets: [{
                        data: progData.map(d => d.v),
                        backgroundColor: progData.map(d => d.c),
                        borderWidth: 2, borderColor: '#fff'
                    }]
                },
                options: { 
                    ...commonOptions, 
                    cutout: '60%',
                    plugins: {
                        ...commonOptions.plugins,
                        tooltip: {
                            callbacks: {
                                title: (context) => {
                                    const item = progData[context[0].dataIndex];
                                    return item.tl;
                                },
                                label: (context) => {
                                    const item = progData[context.dataIndex];
                                    return \`Avg \${item.v} (\${item.count} students)\`;
                                }
                            }
                        }
                    }
                }
            };
            new Chart(document.getElementById('chart-overall-cgpa'), config1);
            window.chartDataMap['chart-overall-cgpa'] = config1;

            // 2. Dept Performance
            const deptData = departments.map((d, i) => {
                const g = students.filter(s => s.department === d);
                const useS = isFoundation(d);
                const avg = g.length ? g.reduce((a, b) => a + (useS ? b.sgpa : b.cgpa), 0) / g.length : 0;
                const prog = g.length ? g[0].program : "";
                return { l: \`\${prog} (\${d})\`, v: parseFloat(avg.toFixed(2)), c: COLORS.dept[i % COLORS.dept.length] };
            }).sort((a,b) => b.v - a.v);

            const config2 = {
                type: 'bar',
                data: {
                    labels: deptData.map(d => d.l),
                    datasets: [{
                        label: 'Avg GPA',
                        data: deptData.map(d => d.v),
                        backgroundColor: deptData.map(d => d.c),
                        borderRadius: 4
                    }]
                },
                options: {
                    ...commonOptions,
                    plugins: { ...commonOptions.plugins, legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 10 }, x: { grid: { display: false } } }
                }
            };
            new Chart(document.getElementById('chart-dept-cgpa'), config2);
            window.chartDataMap['chart-dept-cgpa'] = config2;

            // 3. Pass/Fail
            const deptLabels = departments.map(d => {
                const g = students.filter(s => s.department === d);
                const p = g.length ? g[0].program : "";
                return \`\${p} (\${d})\`;
            });
            const passData = departments.map(d => students.filter(s => s.department === d && !s.isFail).length);
            const failData = departments.map(d => students.filter(s => s.department === d && s.isFail).length);

            const config3 = {
                type: 'bar',
                data: {
                    labels: deptLabels,
                    datasets: [
                        { label: 'Pass', data: passData, backgroundColor: COLORS.pass, borderRadius: 4 },
                        { label: 'Fail', data: failData, backgroundColor: COLORS.fail, borderRadius: 4 }
                    ]
                },
                options: {
                    ...commonOptions,
                    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
                }
            };
            new Chart(document.getElementById('chart-dept-passfail'), config3);
            window.chartDataMap['chart-dept-passfail'] = config3;

            // 4. Overall Dist
            const counts = {};
            CGPA_RANGE_ORDER.forEach(r => counts[r] = 0);
            students.forEach(s => counts[cgpaRange(s.cgpa)]++);
            
            const config4 = {
                type: 'pie',
                data: {
                    labels: CGPA_RANGE_ORDER,
                    datasets: [{
                        data: CGPA_RANGE_ORDER.map(r => counts[r]),
                        backgroundColor: CGPA_RANGE_ORDER.map(r => COLORS.grades[r]),
                        borderWidth: 2, borderColor: '#fff'
                    }]
                },
                options: commonOptions
            };
            new Chart(document.getElementById('chart-overall-dist'), config4);
            window.chartDataMap['chart-overall-dist'] = config4;

            // 5. Dept Details (Grid)
            const deptContainer = document.getElementById('dept-charts-container');
            departments.forEach((dept, i) => {
                const g = students.filter(s => s.department === dept);
                const programName = g.length > 0 ? g[0].program : dept;
                const id = \`chart-dept-\${i}\`;
                
                const div = document.createElement('div');
                div.className = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm";
                div.innerHTML = \`<h4 class="font-bold text-slate-700 mb-2 text-center">\${programName} (\${dept})</h4><div class="h-[250px]"><canvas id="\${id}"></canvas></div>\`;
                deptContainer.appendChild(div);

                const useS = isFoundation(dept);
                const dCounts = {};
                CGPA_RANGE_ORDER.forEach(r => dCounts[r] = 0);
                g.forEach(s => dCounts[cgpaRange(useS ? s.sgpa : s.cgpa)]++);

                const configDept = {
                    type: 'pie',
                    data: {
                        labels: CGPA_RANGE_ORDER,
                        datasets: [{
                            data: CGPA_RANGE_ORDER.map(r => dCounts[r]),
                            backgroundColor: CGPA_RANGE_ORDER.map(r => COLORS.grades[r]),
                            borderWidth: 2, borderColor: '#fff'
                        }]
                    },
                    options: { 
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
                    } // Force legend display
                };
                new Chart(document.getElementById(id), configDept);
                window.chartDataMap[id] = configDept;
            });

            // 6. Pass/Fail Breakdown
            const pfContainer = document.getElementById('dept-passfail-container');
            departments.forEach((dept, i) => {
                const g = students.filter(s => s.department === dept);
                const programName = g.length > 0 ? g[0].program : dept;
                const id = \`chart-pf-\${i}\`;
                
                const div = document.createElement('div');
                div.className = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm";
                div.innerHTML = \`<h4 class="font-bold text-slate-700 mb-2 text-center">\${programName} (\${dept})</h4><div class="h-[250px] relative"><canvas id="\${id}"></canvas></div>\`;
                pfContainer.appendChild(div);

                const pass = g.filter(s => !s.isFail).length;
                const fail = g.filter(s => s.isFail).length;
                const total = g.length;

                const configPf = {
                    type: 'doughnut',
                    data: {
                        labels: ['Pass', 'Fail'],
                        datasets: [{
                            data: [pass, fail],
                            backgroundColor: [COLORS.pass, COLORS.fail],
                            borderWidth: 2, borderColor: '#fff'
                        }]
                    },
                    options: { 
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
                            datalabels: { display: false }
                        } 
                    }
                };
                
                const centerDiv = document.createElement('div');
                centerDiv.className = "absolute inset-0 flex items-center justify-center pointer-events-none";
                centerDiv.innerHTML = \`
                    <div class="text-center">
                        <p class="text-2xl font-bold" style="color: \${pass >= fail ? COLORS.pass : COLORS.fail}">
                            \${total ? ((pass / total) * 100).toFixed(0) : 0}%
                        </p>
                        <p class="text-[10px] text-slate-400 uppercase font-bold">Pass Rate</p>
                    </div>
                \`;
                div.querySelector('.relative').appendChild(centerDiv);

                new Chart(document.getElementById(id), configPf);
                window.chartDataMap[id] = configPf;
            });
        }

        // --- Presentation Mode ---
        let currentSlide = 0;
        let slides = [];
        const chartConfigs = [];

        function initPresentation() {
            // Build Slides
            const wrapper = document.getElementById('slides-wrapper');
            wrapper.innerHTML = ''; // Clear existing
            
            // 1. Title Slide
            const titleSlide = document.createElement('div');
            titleSlide.className = "slide-container hidden w-full h-full flex-col items-center justify-center text-center";
            titleSlide.innerHTML = \`
                <h1 class="text-5xl font-bold text-slate-800 mb-4">Result Analysis Report</h1>
                <p class="text-xl text-slate-500">Interactive Presentation</p>
                <div class="mt-12 p-6 bg-indigo-50 rounded-2xl">
                    <p class="text-4xl font-bold text-indigo-600">\${students.length}</p>
                    <p class="text-sm uppercase font-bold text-indigo-400 mt-2">Total Students</p>
                </div>
            \`;
            wrapper.appendChild(titleSlide);

            // Helper to add chart slide
            const addSlide = (title, chartIdOriginal, type) => {
                const id = \`pres-\${Math.random().toString(36).substr(2, 9)}\`;
                
                const slide = document.createElement('div');
                slide.className = "slide-container hidden w-full h-full flex-col items-center justify-center";
                slide.innerHTML = \`
                    <h2 class="text-3xl font-bold text-slate-800 mb-8">\${title}</h2>
                    <div class="w-full h-[60vh] relative max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <canvas id="\${id}"></canvas>
                    </div>
                \`;
                wrapper.appendChild(slide);
                
                chartConfigs.push({ id, type, srcId: chartIdOriginal });
            };
            
            // Add chart slides
            addSlide("Overall CGPA by Program", 'chart-overall-cgpa', 'doughnut');
            addSlide("Department Performance", 'chart-dept-cgpa', 'bar');
            addSlide("Pass vs Fail Overview", 'chart-dept-passfail', 'bar');
            addSlide("Overall Grade Distribution", 'chart-overall-dist', 'pie');

            // Dept Slides
            departments.forEach((dept, i) => {
                 const g = students.filter(s => s.department === dept);
                 const programName = g.length > 0 ? g[0].program : dept;
                 addSlide(\`\${programName} (\${dept}) - Grades\`, \`chart-dept-\${i}\`, 'pie');
            });

            // Pass/Fail Breakdown Slides
            departments.forEach((dept, i) => {
                 const g = students.filter(s => s.department === dept);
                 const programName = g.length > 0 ? g[0].program : dept;
                 addSlide(\`\${programName} (\${dept}) - Pass/Fail\`, \`chart-pf-\${i}\`, 'doughnut');
            });

            slides = document.querySelectorAll('.slide-container');
            
            // Re-render charts when slide becomes active
            window.renderSlideChart = (index) => {
                if (index === 0) return; // Title slide
                const config = chartConfigs[index - 1];
                if (!config) return;
                
                // Get original data from global store
                const chartData = window.chartDataMap[config.srcId];
                if (!chartData) {
                    console.warn("Chart data not found:", config.srcId);
                    return;
                }

                const ctx = document.getElementById(config.id);
                if (!ctx) return;
                
                if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy(); // Destroy existing
                
                // Ensure canvas size explicitly
                const parent = ctx.parentElement;
                if (parent) {
                    ctx.width = parent.clientWidth;
                    ctx.height = parent.clientHeight;
                    ctx.style.width = '100%';
                    ctx.style.height = '100%';
                }

                // Small delay to ensure layout is ready
                requestAnimationFrame(() => {
                    new Chart(ctx, {
                        type: config.type,
                        data: chartData.data,
                        options: {
                            ...chartData.options,
                            animation: { duration: 800, easing: 'easeOutQuart' },
                            maintainAspectRatio: false,
                            responsive: true,
                            plugins: {
                                ...chartData.options.plugins,
                                legend: { 
                                    display: true, // Force show legend
                                    position: 'bottom',
                                    labels: { 
                                        usePointStyle: true,
                                        font: { size: 14, family: "'Inter', sans-serif" },
                                        padding: 20,
                                        boxWidth: 12
                                    } 
                                },
                                title: {
                                    display: false // Slide has its own title
                                },
                                datalabels: { 
                                    ...chartData.options.plugins?.datalabels, 
                                    font: { size: 14, weight: 'bold' },
                                    color: '#fff',
                                    display: (context) => {
                                        // Only show if > 5%
                                        const dataset = context.chart.data.datasets[0];
                                        const value = dataset.data[context.dataIndex];
                                        const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                                        return (value / total) > 0.05;
                                    }
                                }
                            }
                        }
                    });
                });
            };

            // Event Listeners
            document.getElementById('btn-presentation').onclick = () => {
                const pView = document.getElementById('presentation-view');
                pView.classList.remove('hidden');
                pView.style.display = 'flex'; // Force flex
                document.getElementById('dashboard-view').classList.add('hidden');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
                showSlide(0);
            };
            
            document.getElementById('btn-dashboard').onclick = closePres;
            document.getElementById('btn-close-pres').onclick = closePres;

            function closePres() {
                const pView = document.getElementById('presentation-view');
                pView.classList.add('hidden');
                pView.style.display = 'none'; // Force hide
                document.getElementById('dashboard-view').classList.remove('hidden');
                document.body.style.overflow = 'auto'; // Restore scrolling
            }

            document.getElementById('btn-next').onclick = () => showSlide(currentSlide + 1);
            document.getElementById('btn-prev').onclick = () => showSlide(currentSlide - 1);
            
            document.addEventListener('keydown', (e) => {
                const pView = document.getElementById('presentation-view');
                if (pView.classList.contains('hidden') || pView.style.display === 'none') return;
                if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
                if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
                if (e.key === 'Escape') closePres();
            });
        }

        function showSlide(index) {
            if (index < 0 || index >= slides.length) return;
            
            // Hide current
            if (slides[currentSlide]) {
                slides[currentSlide].classList.remove('flex');
                slides[currentSlide].classList.add('hidden');
                slides[currentSlide].style.display = 'none'; // Force hide
            }
            
            currentSlide = index;
            
            // Show new
            if (slides[currentSlide]) {
                slides[currentSlide].classList.remove('hidden');
                slides[currentSlide].classList.add('flex');
                slides[currentSlide].style.display = 'flex'; // Force flex
            }
            
            document.getElementById('slide-counter').innerText = \`Slide \${currentSlide + 1} / \${slides.length}\`;
            
            // Trigger animation
            window.renderSlideChart(currentSlide);
        }

        // Init
        window.addEventListener('load', init);

    </script>
</body>
</html>
    `;

    // 3. Download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Presidency_Result_Analysis_Interactive.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
      <FileCode className="h-4 w-4" />
      Export Interactive HTML
    </Button>
  );
}
