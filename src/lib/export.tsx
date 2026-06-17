import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

// ─── Export to PDF ───
export function exportToPDF(title: string, headers: string[], rows: any[][], filename?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 14, 28);

  let y = 40;
  const colWidth = 250 / headers.length;

  // Header
  doc.setFillColor(74, 44, 63);
  doc.rect(14, y - 5, 250, 8, "F");
  doc.setTextColor(255, 255, 255);
  headers.forEach((h, i) => doc.text(h, 16 + i * colWidth, y));

  // Rows
  doc.setTextColor(0, 0, 0);
  rows.forEach((row, ri) => {
    y += 8;
    if (y > 180) { doc.addPage(); y = 20; }
    if (ri % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(14, y - 5, 250, 8, "F"); }
    row.forEach((cell, ci) => doc.text(String(cell || ""), 16 + ci * colWidth, y));
  });

  doc.save(`${filename || title.replace(/\s+/g, "_")}.pdf`);
}

// ─── Export to CSV ───
export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent = [headers.join(","), ...rows.map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename || "export"}.csv`;
  link.click();
}

// ─── Export to Excel ───
export function exportToExcel(sheetName: string, headers: string[], rows: any[][], filename?: string) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename || sheetName}.xlsx`);
}

// ─── Export helper for reports ───
export function exportReport(reportType: string, data: any) {
  switch (reportType) {
    case "payroll": {
      const headers = ["Employee", "Base Salary", "Piece Rate", "Bonus", "Deductions", "Overtime", "Net Salary"];
      const rows = data.map((r: any) => [r.name, r.base, r.piece, r.bonus, r.deductions, r.overtime, r.net]);
      exportToPDF("Payroll Report", headers, rows, "payroll_report");
      break;
    }
    case "production": {
      const headers = ["Date", "Line", "Model", "Produced", "Defected", "Efficiency %"];
      const rows = data.map((r: any) => [r.date, r.line, r.model, r.produced, r.defected, r.efficiency]);
      exportToPDF("Production Report", headers, rows, "production_report");
      break;
    }
    case "quality": {
      const headers = ["Date", "Model", "AQL %", "Sample Size", "Defects", "Result"];
      const rows = data.map((r: any) => [r.date, r.model, r.aql, r.sample, r.defects, r.result]);
      exportToPDF("Quality Report", headers, rows, "quality_report");
      break;
    }
    default:
      exportToPDF("Report", ["Data"], [[JSON.stringify(data)]], "report");
  }
}

// ─── Quick export buttons ───
export function ExportButtons({ onPDF, onExcel }: { onPDF?: () => void; onExcel?: () => void }) {
  return (
    <div className="flex gap-2">
      {onPDF && <Button size="sm" variant="outline" className="gap-1 text-red-400 border-red-400/30" onClick={onPDF}>📄 PDF</Button>}
      {onExcel && <Button size="sm" variant="outline" className="gap-1 text-emerald-400 border-emerald-400/30" onClick={onExcel}>📊 Excel</Button>}
    </div>
  );
}
