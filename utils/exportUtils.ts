import { HousekeepingTask } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDateLocal = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const exportToExcel = (tasks: HousekeepingTask[], filename: string) => {
  if (!tasks.length) {
    alert("No data to export.");
    return;
  }

  // Create CSV Header
  const headers = ['ID', 'Date', 'Category', 'Area', 'Job Description', 'Assignee', 'Status', 'Remarks', 'Photo Before (Base64)', 'Photo Progress (Base64)', 'Photo After (Base64)'];
  
  // Create CSV Rows
  const rows = tasks.map(task => [
    task.id,
    task.date,
    `"${task.category || ''}"`,
    `"${task.area}"`, 
    `"${task.jobDescription}"`,
    `"${task.assignee}"`,
    task.status,
    `"${task.remarks}"`,
    task.photoBefore ? `"${task.photoBefore}"` : '""',
    task.photoProgress ? `"${task.photoProgress}"` : '""',
    task.photoAfter ? `"${task.photoAfter}"` : '""'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

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

  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(title, 14, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 20);

  // Define Columns
  const tableColumn = ["Before", "Progress", "After", "Date", "Area", "Description", "Staff", "Status"];
  
  // Define Rows
  const tableRows = tasks.map(task => [
    "", // photoBefore
    "", // photoProgress
    "", // photoAfter
    formatDateLocal(task.date),
    task.area,
    task.jobDescription,
    task.assignee,
    task.status
  ]);

  // Generate Table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    theme: 'grid',
    styles: { 
      fontSize: 6, 
      cellPadding: 2,
      valign: 'middle'
    },
    headStyles: { 
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 22, minCellHeight: 18 }, // Before
      1: { cellWidth: 22 }, // Progress
      2: { cellWidth: 22 }, // After
      3: { cellWidth: 18 },
      4: { cellWidth: 25 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 20 },
      7: { cellWidth: 18 }
    },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const task = tasks[data.row.index];
        const padding = 1.2;
        const imgWidth = data.cell.width - (padding * 2);
        const imgHeight = data.cell.height - (padding * 2);

        // Map column indices to photo keys
        const photoMap: { [key: number]: keyof HousekeepingTask } = {
          0: 'photoBefore',
          1: 'photoProgress',
          2: 'photoAfter'
        };

        if (photoMap[data.column.index]) {
            const photoKey = photoMap[data.column.index];
            const photoData = task[photoKey] as string;
            
            if (photoData) {
              try {
                doc.addImage(photoData, 'JPEG', data.cell.x + padding, data.cell.y + padding, imgWidth, imgHeight);
              } catch (e) { doc.text("Err", data.cell.x + 2, data.cell.y + 8); }
            } else {
              doc.setFontSize(5);
              doc.setTextColor(180);
              const label = photoKey.replace('photo', '');
              doc.text(`No ${label}`, data.cell.x + 4, data.cell.y + 8);
            }
        }
      }
    }
  });

  doc.save(`${filename}.pdf`);
};