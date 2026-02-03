import { HousekeepingTask } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const exportToExcel = (tasks: HousekeepingTask[], filename: string) => {
  if (!tasks.length) {
    alert("No data to export.");
    return;
  }

  // Create CSV Header
  const headers = ['ID', 'Date', 'Category', 'Area', 'Job Description', 'Assignee', 'Status', 'Remarks', 'Has Photo'];
  
  // Create CSV Rows
  const rows = tasks.map(task => [
    task.id,
    task.date,
    `"${task.category || ''}"`,
    `"${task.area}"`, // Quote strings to handle commas
    `"${task.jobDescription}"`,
    `"${task.assignee}"`,
    task.status,
    `"${task.remarks}"`,
    task.photo ? "Yes" : "No"
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPdf = (tasks: HousekeepingTask[], title: string, filename: string) => {
  if (!tasks.length) {
    alert("No data to export.");
    return;
  }

  const doc = new jsPDF();

  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

  // Define Columns
  const tableColumn = ["Date", "Category", "Area", "Job Description", "Assignee", "Status", "Remarks"];
  
  // Define Rows
  const tableRows = tasks.map(task => [
    formatDate(task.date),
    task.category || '-',
    task.area,
    task.jobDescription,
    task.assignee,
    task.status,
    task.remarks || '-'
  ]);

  // Generate Table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [59, 130, 246], // Blue-500
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 20 }, // Category
      2: { cellWidth: 25 }, // Area
      3: { cellWidth: 'auto' }, // Job Desc
      4: { cellWidth: 20 }, // Assignee
      5: { cellWidth: 20 }, // Status
      6: { cellWidth: 30 }  // Remarks
    }
  });

  doc.save(`${filename}.pdf`);
};