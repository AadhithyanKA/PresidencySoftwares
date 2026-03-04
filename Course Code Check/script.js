document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInputFiles = document.getElementById('csvFilesInput');
    const labelFiles = document.getElementById('labelFiles');
    const compareBtn = document.getElementById('compareBtn');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTableBody = document.querySelector('#resultsTable tbody');
    const totalRowsElem = document.getElementById('totalRows');
    const discrepancyCountElem = document.getElementById('discrepancyCount');
    const noDiscrepanciesElem = document.getElementById('noDiscrepancies');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const generatedBySelect = document.getElementById('generatedBy');
    const toast = document.getElementById('toast');

    // State
    let uploadedFiles = []; // Array of { name: string, data: any[] }
    let discrepancies = [];

    // Constants for required columns (normalized to lowercase for checking)
    const REQUIRED_COLUMNS = ['course code', 'course name', 'l', 't', 'p', 'c', 'basket'];

    // Event Listeners
    fileInputFiles.addEventListener('change', handleFileSelect);
    compareBtn.addEventListener('click', compareCSVs);
    exportPdfBtn.addEventListener('click', exportToPdf);
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportCsvBtn.addEventListener('click', exportToCsv);
    downloadTemplateBtn.addEventListener('click', downloadTemplate);

    // Functions
    function handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            labelFiles.textContent = `${files.length} file(s) selected`;
            uploadedFiles = []; // Reset previous
            
            let processedCount = 0;
            let errorCount = 0;

            files.forEach(file => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        uploadedFiles.push({
                            name: file.name,
                            data: results.data
                        });
                        processedCount++;
                        if (processedCount === files.length) {
                            console.log('All CSVs Loaded:', uploadedFiles);
                            // Sort files by name for consistent order
                            uploadedFiles.sort((a, b) => a.name.localeCompare(b.name));
                            showToast(`Loaded ${processedCount} files successfully!`);
                        }
                    },
                    error: function(error) {
                        console.error(`Error parsing ${file.name}:`, error);
                        errorCount++;
                        processedCount++;
                        if (processedCount === files.length) {
                            showToast(`Loaded files with ${errorCount} errors.`, true);
                        }
                    }
                });
            });
        }
    }

    function normalizeKey(key) {
        return key.trim().toLowerCase();
    }

    function findKey(row, target) {
        return Object.keys(row).find(k => normalizeKey(k) === target);
    }

    function compareCSVs() {
        if (uploadedFiles.length < 2) {
            showToast('Please upload at least 2 CSV files to compare!', true);
            return;
        }

        discrepancies = [];
        resultsTableBody.innerHTML = '';
        resultsSection.classList.remove('hidden');

        let discrepanciesFound = 0;
        let totalChecked = 0;

        // Helper to get value (raw, without trimming)
        const getValue = (row, colName) => {
            const key = findKey(row, colName);
            return key ? (row[key] || '').toString() : '';
        };

        // Iterate through all unique pairs
        for (let i = 0; i < uploadedFiles.length; i++) {
            for (let j = i + 1; j < uploadedFiles.length; j++) {
                const fileA = uploadedFiles[i];
                const fileB = uploadedFiles[j];
                const pairName = `${fileA.name} vs ${fileB.name}`;
                
                console.log(`Comparing ${pairName}`);

                // Create Map for File A (Reference for this pair)
                const mapA = new Map();
                
                // Validate structure of File A
                if (fileA.data.length > 0) {
                    const firstRow = fileA.data[0];
                    const missingCols = REQUIRED_COLUMNS.filter(col => !findKey(firstRow, col));
                    if (missingCols.length > 0) {
                        showToast(`${fileA.name} is missing columns: ${missingCols.join(', ')}`, true);
                        continue;
                    }
                }

                // Populate Map A
                fileA.data.forEach(row => {
                    const code = getValue(row, 'course code').trim();
                    if (code) {
                        mapA.set(code.toUpperCase(), row);
                    }
                });

                // Compare File B rows against Map A
                fileB.data.forEach((rowB, index) => {
                    const codeB = getValue(rowB, 'course code');
                    const codeBTrimmed = codeB.trim();
                    
                    // Skip empty rows or rows without course code
                    if (!codeBTrimmed) return;

                    totalChecked++;
                    
                    const rowA = mapA.get(codeBTrimmed.toUpperCase());

                    if (!rowA) {
                        // User requested to ignore missing rows ("not an error")
                        return;
                    }

                    // Check for Course Code case/whitespace mismatch
                    const codeA = getValue(rowA, 'course code');
                    if (codeA !== codeB) {
                        let comment = 'Mismatch in Course Code';
                        if (codeA.trim() === codeB.trim()) {
                            comment = 'Extra whitespace in Course Code';
                        } else if (codeA.toLowerCase() === codeB.toLowerCase()) {
                            comment = 'Case mismatch in Course Code';
                        }
                        addDiscrepancy(pairName, index + 1, codeBTrimmed, 'Course Code', codeA, codeB, comment);
                        discrepanciesFound++;
                    }

                    // Check other fields
                    REQUIRED_COLUMNS.forEach(col => {
                        if (col === 'course code') return; // Already matched/checked above

                        const valA = getValue(rowA, col);
                        const valB = getValue(rowB, col);

                        if (valA !== valB) {
                            let comment = `Mismatch in ${col}`;
                            if (valA.trim() === valB.trim()) {
                                comment = `Extra whitespace in ${col}`;
                            } else if (valA.toLowerCase() === valB.toLowerCase()) {
                                comment = `Case mismatch in ${col}`;
                            }
                            addDiscrepancy(pairName, index + 1, codeBTrimmed, col, valA, valB, comment);
                            discrepanciesFound++;
                        }
                    });
                });
            }
        }

        // Update stats
        totalRowsElem.textContent = totalChecked;
        discrepancyCountElem.textContent = discrepanciesFound;

        if (discrepanciesFound === 0) {
            noDiscrepanciesElem.classList.remove('hidden');
            document.querySelector('.table-container').classList.add('hidden');
        } else {
            noDiscrepanciesElem.classList.add('hidden');
            document.querySelector('.table-container').classList.remove('hidden');
        }
        
        showToast('Comparison complete!');
    }

    function addDiscrepancy(pairName, rowNum, courseCode, field, valA, valB, comment) {
        discrepancies.push({
            pair: pairName,
            row: rowNum,
            courseCode,
            field,
            valA,
            valB,
            comment
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rowNum}</td>
            <td><span class="file-badge">${pairName}</span></td>
            <td><strong>${courseCode}</strong></td>
            <td>${field.toUpperCase()}</td>
            <td>${valA}</td>
            <td class="diff-cell">${valB}</td>
            <td class="comment-cell">${comment}</td>
        `;
        resultsTableBody.appendChild(tr);
    }

    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.style.backgroundColor = isError ? '#ef4444' : '#1e293b';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Export Functions
    function exportToPdf() {
        if (discrepancies.length === 0) {
            showToast('No discrepancies to export!', true);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add Logo if available
        const logoImg = document.querySelector('.logo');
        if (logoImg) {
            try {
                // Create a canvas to get base64
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = logoImg.naturalWidth;
                canvas.height = logoImg.naturalHeight;
                ctx.drawImage(logoImg, 0, 0);
                const logoData = canvas.toDataURL('image/png');
                
                // Add to PDF (x, y, width, height) - scaled to width 40mm
                const aspect = logoImg.naturalHeight / logoImg.naturalWidth;
                doc.addImage(logoData, 'PNG', 14, 10, 40, 40 * aspect);
            } catch (e) {
                console.error('Error adding logo to PDF:', e);
            }
        }

        doc.setFontSize(18);
        doc.text('Course Checker Report', 14, 40); // Adjusted Y position below logo
        
        doc.setFontSize(11);
        const generatedBy = generatedBySelect.value;
        doc.text(`Generated By: ${generatedBy}`, 14, 48);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 54);

        const tableColumn = ["Row", "Comparison Pair", "Course Code", "Field", "Value in File 1", "Value in File 2", "Comment"];
        const tableRows = [];

        discrepancies.forEach(d => {
            const discrepancyData = [
                d.row,
                d.pair,
                d.courseCode,
                d.field,
                d.valA,
                d.valB,
                d.comment
            ];
            tableRows.push(discrepancyData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 60,
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 30 }, // Comparison Pair
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 'auto' }
            }
        });

        doc.save('discrepancies_report.pdf');
    }

    function exportToExcel() {
        if (discrepancies.length === 0) {
            showToast('No discrepancies to export!', true);
            return;
        }

        const wb = XLSX.utils.book_new();
        
        const wsData = [
            ['Row', 'Comparison Pair', 'Course Code', 'Field', 'Value in File 1', 'Value in File 2', 'Comment']
        ];

        discrepancies.forEach(d => {
            wsData.push([
                d.row,
                d.pair,
                d.courseCode,
                d.field,
                d.valA,
                d.valB,
                d.comment
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Discrepancies");
        XLSX.writeFile(wb, 'discrepancies_report.xlsx');
    }

    function exportToCsv() {
        if (discrepancies.length === 0) {
            showToast('No discrepancies to export!', true);
            return;
        }

        const csvData = discrepancies.map(d => ({
            'Row': d.row,
            'Comparison Pair': d.pair,
            'Course Code': d.courseCode,
            'Field': d.field,
            'Value in File 1': d.valA,
            'Value in File 2': d.valB,
            'Comment': d.comment
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'discrepancies_report.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function downloadTemplate() {
        const templateData = [
            ['Course Code', 'Course Name', 'L', 'T', 'P', 'C', 'Basket'],
            ['CS101', 'Introduction to Programming', '3', '0', '2', '4', 'Core'],
            ['MA101', 'Calculus', '3', '1', '0', '4', 'Science']
        ];
        
        const csv = Papa.unparse(templateData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "course_code_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Template downloaded!');
    }
});