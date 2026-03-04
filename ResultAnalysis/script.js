// Constants
const REQUIRED_COLUMNS = [
    "Sl. No.", "Course Code", "Course Name", "Semester", "Section", 
    "Roll No.", "Student Name", "Total Marks", "Faculty Name"
];

// State
let analysisData = [];

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dashboard = document.getElementById('dashboard');
const downloadBtn = document.getElementById('downloadBtn');
const analysisTable = document.getElementById('analysisTable').querySelector('tbody');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', handleDrop);
downloadBtn.addEventListener('click', downloadExcel);

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

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (validateData(jsonData)) {
            generateAnalysis(jsonData);
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
    return REQUIRED_COLUMNS.every(col => {
        // Check if exact match or trimmed match exists
        return Object.keys(firstRow).some(k => k.trim() === col.trim());
    });
}

function cleanMarks(val) {
    if (typeof val === 'string') {
        val = val.trim().toUpperCase();
        if (val === 'NP' || val === 'ABSENT' || val === 'AB' || val === '') return 'NP';
        return parseFloat(val);
    }
    return parseFloat(val); // Could be NaN
}

function generateAnalysis(data) {
    // 1. Group by Course Code + Section + Faculty
    const groups = {};
    const courseStats = {}; // To calculate Course Pass % across sections

    data.forEach(row => {
        // Normalize keys
        const cleanRow = {};
        Object.keys(row).forEach(key => cleanRow[key.trim()] = row[key]);

        const courseCode = cleanRow["Course Code"];
        const section = cleanRow["Section"];
        const faculty = cleanRow["Faculty Name"];
        const marksRaw = cleanRow["Total Marks"];
        const semester = cleanRow["Semester"];

        if (!courseCode) return;

        const key = `${courseCode}|${section}|${faculty}`;
        
        if (!groups[key]) {
            groups[key] = {
                courseCode: courseCode,
                courseName: cleanRow["Course Name"],
                section: section,
                faculty: faculty,
                semester: semester,
                marks: []
            };
        }
        groups[key].marks.push(marksRaw);

        // Track course-level stats
        if (!courseStats[courseCode]) {
            courseStats[courseCode] = { appeared: 0, passed: 0 };
        }
    });

    // 2. Process each group
    analysisData = Object.values(groups).map((group) => {
        let totalStrength = 0;
        let studentsAppeared = 0;
        let totalPassed = 0;
        let distinction = 0; // > 75
        let gradeI = 0; // 60-74
        let gradeII = 0; // 50-59
        let gradePass = 0; // 40-49
        let fail = 0; // < 40
        let npAbsent = 0;
        let totalMarksSum = 0;

        group.marks.forEach(m => {
            totalStrength++;
            let val = cleanMarks(m);

            if (val === 'NP' || isNaN(val)) {
                npAbsent++;
            } else {
                studentsAppeared++;
                totalMarksSum += val;

                if (val < 40) {
                    fail++;
                } else {
                    totalPassed++;
                    if (val >= 75) distinction++;
                    else if (val >= 60) gradeI++;
                    else if (val >= 50) gradeII++;
                    else if (val >= 40) gradePass++;
                }
            }
        });

        // Update Course Stats
        courseStats[group.courseCode].appeared += studentsAppeared;
        courseStats[group.courseCode].passed += totalPassed;

        const secPassPct = studentsAppeared > 0 ? (totalPassed / studentsAppeared * 100) : 0;
        const courseAvg = studentsAppeared > 0 ? (totalMarksSum / studentsAppeared) : 0;

        return {
            courseCode: group.courseCode,
            courseName: group.courseName,
            facultyName: group.faculty,
            semester: group.semester,
            section: group.section,
            totalStrength,
            studentsAppeared,
            totalPassed,
            distinction,
            gradeI,
            gradeII,
            gradePass,
            fail,
            npAbsent,
            secPassPct,
            courseAvg
        };
    });

    // 3. Add Course Pass % and Format for Output
    const finalData = analysisData.map((row, index) => {
        const courseTotalAppeared = courseStats[row.courseCode].appeared;
        const courseTotalPassed = courseStats[row.courseCode].passed;
        const coursePassPct = courseTotalAppeared > 0 ? (courseTotalPassed / courseTotalAppeared * 100) : 0;

        return {
            "Sl. No.": index + 1,
            "Course": row.courseCode,
            "Course Name": row.courseName,
            "Faculty Name": row.facultyName,
            "Faculty Emp ID": "", // Placeholder
            "Semester": row.semester,
            "Sec": row.section,
            "Total Strength": row.totalStrength,
            "Students Appeared": row.studentsAppeared,
            "Total Passed": row.totalPassed,
            "Distinction > 75": row.distinction,
            "I 60-74": row.gradeI,
            "II 50-59": row.gradeII,
            "Pass 40-49": row.gradePass,
            "Fail": row.fail,
            "NP / ABSENT": row.npAbsent,
            "Sec Pass %": row.secPassPct.toFixed(2) + '%',
            "Course Pass %": coursePassPct.toFixed(2) + '%',
            "Course Average": row.courseAvg.toFixed(2),
            "Total Pass": row.totalPassed
        };
    });

    renderTable(finalData);
    analysisData = finalData; // Store for export
}

function renderTable(data) {
    analysisTable.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        analysisTable.appendChild(tr);
    });
}

function showDashboard() {
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('fileName').textContent = fileInput.files[0]?.name || "Uploaded File";
    dashboard.classList.remove('hidden');
    dashboard.scrollIntoView({ behavior: 'smooth' });
}

function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(analysisData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Result Analysis");
    XLSX.writeFile(wb, "Result_Analysis_Report.xlsx");
}
