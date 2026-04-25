import { jsPDF } from "jspdf";
import Papa from "papaparse";

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (title: string, data: any[]) => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  let y = 30;
  data.forEach((item, index) => {
    const name = `${item.primerNombre || ''} ${item.primerApellido || ''}`.trim() || 'Estudiante';
    doc.text(`${index + 1}. ${name} - Promedio: ${item.avgGrade || 0} - Asistencia: ${item.attendance || '0%'}`, 20, y);
    y += 10;
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};
