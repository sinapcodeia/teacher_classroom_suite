export const exportToCSV = async (data: any[], filename: string) => {
  const { downloadRowsAsExcel } = await import("./spreadsheetUtils");
  downloadRowsAsExcel(data, `${filename}.xlsx`, "Exportación IETABA");
};

export const exportToPDF = async (title: string, data: any[]) => {
  const { jsPDF } = await import("jspdf");
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
