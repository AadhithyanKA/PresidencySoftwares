// Constants
const REQUIRED_COLUMNS = [
    "Roll No.", "Student Name", "Department", "Semester", "Course Code",
    "Hours Conducted", "Hours Attended", "Physical Attendance %"
];

// State
let studentReportData = [];
let summaryReportData = [];
let chartInstance = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dashboard = document.getElementById('dashboard');
const downloadBtn = document.getElementById('downloadBtn');
const studentTable = document.getElementById('studentTable');
const summaryTable = document.getElementById('summaryTable');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', handleDrop);
downloadBtn.addEventListener('click', downloadExcel);

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    processFile(file);
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    processFile(file);
}

function processFile(file) {
    if (!file) return;

    // Show loading state could be added here
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileInfo').style.display = 'flex';

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (validateData(jsonData)) {
            generateReports(jsonData);
            showDashboard();
        } else {
            alert("Missing required columns! Please check your file format.");
        }
    };
    reader.readAsArrayBuffer(file);
}

function validateData(data) {
    if (data.length === 0) return false;
    const firstRow = data[0];
    // Check if critical columns exist (flexible matching)
    const critical = ["Roll No.", "Student Name", "Department", "Semester", "Course Code", "Hours Conducted", "Hours Attended"];
    return critical.every(col => {
        // Check if exact match or trimmed match exists
        return Object.keys(firstRow).some(k => k.trim() === col);
    });
}

function cleanPercentage(val) {
    if (typeof val === 'string') {
        return parseFloat(val.replace('%', ''));
    }
    return parseFloat(val) || 0;
}

function generateReports(data) {
    // 1. Group by Student
    const students = {};

    data.forEach(row => {
        // Normalize keys (trim spaces)
        const cleanRow = {};
        Object.keys(row).forEach(key => cleanRow[key.trim()] = row[key]);

        const rollNo = cleanRow["Roll No."];
        if (!rollNo) return;

        if (!students[rollNo]) {
            students[rollNo] = {
                "Roll No.": rollNo,
                "Student Name": cleanRow["Student Name"],
                "Department": cleanRow["Department"] || "Unknown",
                "Semester": cleanRow["Semester"] || "Unknown",
                "School": cleanRow["School"] || "",
                "Program": cleanRow["Program"] || "",
                "Batch": cleanRow["Batch"] || "",
                "Courses": [],
                "Total Conducted": 0,
                "Total Attended": 0,
            };
        }

        const conducted = parseFloat(cleanRow["Hours Conducted"]) || 0;
        const attended = parseFloat(cleanRow["Hours Attended"]) || 0;
        const pct = cleanPercentage(cleanRow["Physical Attendance %"]);

        students[rollNo]["Total Conducted"] += conducted;
        students[rollNo]["Total Attended"] += attended;
        
        students[rollNo]["Courses"].push({
            "Course Code": cleanRow["Course Code"],
            "pct": pct
        });
    });

    // 2. Create Student Report Array
    studentReportData = Object.values(students).map((s, index) => {
        const overallPct = s["Total Conducted"] > 0 
            ? (s["Total Attended"] / s["Total Conducted"] * 100).toFixed(2) 
            : 0;
        
        const below75Count = s.Courses.filter(c => c.pct < 75).length;
        const above75Count = s.Courses.filter(c => c.pct >= 75).length;

        return {
            "S No.": index + 1,
            "Roll No.": s["Roll No."],
            "Student Name": s["Student Name"],
            "School": s["School"],
            "Department": s["Department"],
            "Program": s["Program"],
            "Semester": s["Semester"],
            "Batch": s["Batch"],
            "Overall %": parseFloat(overallPct),
            "No. of Courses < 75%": below75Count,
            "No. of Courses >= 75%": above75Count
        };
    });

    // 3. Generate Summary Report
    // Group by Dept/Sem
    const deptSemGroups = {};

    Object.values(students).forEach(student => {
        const key = `${student.Department}|${student.Semester}`;
        if (!deptSemGroups[key]) {
            deptSemGroups[key] = {
                dept: student.Department,
                sem: student.Semester,
                students: []
            };
        }
        deptSemGroups[key].students.push(student);
    });

    summaryReportData = Object.values(deptSemGroups).map((group, index) => {
        const totalStudents = group.students.length;
        
        // Logic from Python:
        // all_above_75: Are all their courses >= 75%?
        // any_below_75: Do they have >= 1 course < 75%?
        // all_below_75: Are all their courses < 75%?

        let above75AllCount = 0;
        let below75OnePlusCount = 0;
        let below75AllCount = 0;

        group.students.forEach(s => {
            const allAbove = s.Courses.every(c => c.pct >= 75);
            const anyBelow = s.Courses.some(c => c.pct < 75);
            const allBelow = s.Courses.every(c => c.pct < 75) && s.Courses.length > 0;

            if (allAbove) above75AllCount++;
            if (anyBelow) below75OnePlusCount++;
            if (allBelow) below75AllCount++;
        });

        const above75Pct = (above75AllCount / totalStudents * 100).toFixed(0) + "%";
        const below75Pct = (100 - (above75AllCount / totalStudents * 100)).toFixed(0) + "%";
        const below75OnePlusPct = (below75OnePlusCount / totalStudents * 100).toFixed(0) + "%";
        const below75AllPct = (below75AllCount / totalStudents * 100).toFixed(0) + "%";

        return {
            "Department": group.dept,
            "Semester": group.sem,
            "Student Strength": totalStudents,
            "Above 75% in All Courses": above75AllCount,
            "Above 75%": above75Pct,
            "Below 75%": below75Pct,
            "Less than 75% (1+ Courses)": below75OnePlusCount,
            "Less than 75% 1+ Courses (%)": below75OnePlusPct,
            "Less than 75% (All Courses)": below75AllCount,
            "% of <75% (All Courses)": below75AllPct
        };
    });

    updateUI();
}

function updateUI() {
    // Update Metrics
    const totalStudents = studentReportData.length;
    const avgAtt = studentReportData.reduce((acc, s) => acc + s["Overall %"], 0) / totalStudents;
    
    // For dashboard metric "Below 75%", let's use students who have Overall % < 75
    const below75Overall = studentReportData.filter(s => s["Overall %"] < 75).length;

    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('avgAttendance').textContent = (avgAtt || 0).toFixed(2) + "%";
    document.getElementById('below75Count').textContent = below75Overall;

    // Render Tables
    renderTable(studentTable, studentReportData);
    renderTable(summaryTable, summaryReportData);

    // Render Chart
    renderChart();
}

function renderTable(tableElement, data) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    
    // Header
    const thead = tableElement.querySelector('thead');
    thead.innerHTML = '';
    const trHead = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Body
    const tbody = tableElement.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Limit rows for performance if too large? 
    // For now render all, but maybe limit to 100 for preview
    const displayData = data; 

    displayData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = row[h];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = summaryReportData.map(s => `${s.Department} - ${s.Semester}`);
    // Parse "Above 75%" string "XX%" to number
    const dataAbove = summaryReportData.map(s => parseFloat(s["Above 75%"].replace('%', '')));
    const dataBelow = summaryReportData.map(s => parseFloat(s["Below 75%"].replace('%', '')));

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Above 75%',
                    data: dataAbove,
                    backgroundColor: '#4caf50'
                },
                {
                    label: 'Below 75%',
                    data: dataBelow,
                    backgroundColor: '#f44336'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, max: 100 }
            }
        }
    });
}

function showDashboard() {
    dashboard.classList.remove('hidden');
    // Scroll to dashboard
    dashboard.scrollIntoView({ behavior: 'smooth' });
}

function downloadExcel() {
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(studentReportData);
    XLSX.utils.book_append_sheet(wb, ws1, "Student Wise Report");
    
    const ws2 = XLSX.utils.json_to_sheet(summaryReportData);
    XLSX.utils.book_append_sheet(wb, ws2, "Summary Report");

    XLSX.writeFile(wb, "SemWise_Attendance_Report.xlsx");
}
