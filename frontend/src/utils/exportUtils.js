import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export utilities for generating reports and data exports
 */

export const exportToPDF = async (data, type, options = {}) => {
  const {
    title = 'AI-powered Acute Lymphoblastic Leukemia Screening System Report',
    subtitle = '',
    includeCharts = false,
    orientation = 'portrait'
  } = options;

  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, 40, { align: 'center' });
  }

  // Date and time
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 50, { align: 'center' });

  let yPosition = 70;

  switch (type) {
    case 'doctor-activity':
      yPosition = await generateDoctorActivityReport(doc, data, yPosition);
      break;
    
    case 'analysis-summary':
      yPosition = await generateAnalysisSummaryReport(doc, data, yPosition);
      break;
    
    case 'patient-report':
      yPosition = await generatePatientReport(doc, data, yPosition);
      break;
    
    case 'system-analytics':
      yPosition = await generateSystemAnalyticsReport(doc, data, yPosition);
      break;
    
    default:
      doc.text('Report type not supported', 20, yPosition);
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | AI-powered Acute Lymphoblastic Leukemia Screening System | Confidential Medical Data`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
};

const generateDoctorActivityReport = async (doc, doctors, yPosition) => {
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Doctor Activity Report', 20, yPosition);
  yPosition += 20;

  // Summary statistics
  const totalDoctors = doctors.length;
  const totalAnalyses = doctors.reduce((sum, doctor) => sum + (doctor.analysisCount || 0), 0);
  const avgAnalyses = totalDoctors > 0 ? Math.round(totalAnalyses / totalDoctors) : 0;
  const activeToday = doctors.filter(d => {
    if (!d.lastLogin) return false;
    const lastLogin = new Date(d.lastLogin);
    const today = new Date();
    return lastLogin.toDateString() === today.toDateString();
  }).length;

  doc.setFontSize(12);
  doc.text(`Total Doctors: ${totalDoctors}`, 20, yPosition);
  doc.text(`Total Analyses: ${totalAnalyses}`, 120, yPosition);
  yPosition += 15;
  doc.text(`Average per Doctor: ${avgAnalyses}`, 20, yPosition);
  doc.text(`Active Today: ${activeToday}`, 120, yPosition);
  yPosition += 25;

  // Doctor table
  const tableData = doctors.map(doctor => [
    doctor.name,
    doctor.email,
    doctor.analysisCount || 0,
    doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleDateString() : 'Never',
    doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Doctor Name', 'Email', 'Analyses', 'Last Login', 'Joined']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 }
    }
  });

  return doc.lastAutoTable.finalY + 20;
};

const generateAnalysisSummaryReport = async (doc, analyses, yPosition) => {
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Analysis Summary Report', 20, yPosition);
  yPosition += 20;

  // Summary statistics
  const totalAnalyses = analyses.length;
  const positive = analyses.filter(a => a.analysisResults?.prediction === 'positive').length;
  const negative = analyses.filter(a => a.analysisResults?.prediction === 'negative').length;
  const uncertain = analyses.filter(a => a.analysisResults?.prediction === 'uncertain').length;
  const avgConfidence = analyses.reduce((sum, a) => sum + (a.analysisResults?.confidence || 0), 0) / totalAnalyses;

  doc.setFontSize(12);
  doc.text(`Total Analyses: ${totalAnalyses}`, 20, yPosition);
  doc.text(`Positive Results: ${positive} (${((positive/totalAnalyses)*100).toFixed(1)}%)`, 120, yPosition);
  yPosition += 15;
  doc.text(`Negative Results: ${negative} (${((negative/totalAnalyses)*100).toFixed(1)}%)`, 20, yPosition);
  doc.text(`Uncertain Results: ${uncertain} (${((uncertain/totalAnalyses)*100).toFixed(1)}%)`, 120, yPosition);
  yPosition += 15;
  doc.text(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`, 20, yPosition);
  yPosition += 25;

  // Recent analyses table
  const recentAnalyses = analyses.slice(0, 20); // Last 20 analyses
  const tableData = recentAnalyses.map(analysis => [
    analysis.patientId?.patientId || 'N/A',
    analysis.patientId?.name || 'N/A',
    analysis.analysisResults?.prediction || 'N/A',
    analysis.analysisResults?.confidence ? `${(analysis.analysisResults.confidence * 100).toFixed(1)}%` : 'N/A',
    analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Patient ID', 'Patient Name', 'Result', 'Confidence', 'Date']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 }
    }
  });

  return doc.lastAutoTable.finalY + 20;
};

const generatePatientReport = async (doc, patient, yPosition) => {
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Patient Medical Report', 20, yPosition);
  yPosition += 20;

  // Patient information
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Patient Information:', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.text(`Patient ID: ${patient.patientId}`, 30, yPosition);
  doc.text(`Name: ${patient.name}`, 120, yPosition);
  yPosition += 12;
  doc.text(`Age: ${patient.age}`, 30, yPosition);
  doc.text(`Gender: ${patient.gender}`, 120, yPosition);
  yPosition += 12;
  doc.text(`Phone: ${patient.contactInfo?.phone || 'N/A'}`, 30, yPosition);
  doc.text(`Email: ${patient.contactInfo?.email || 'N/A'}`, 120, yPosition);
  yPosition += 20;

  // Medical history
  if (patient.medicalHistory) {
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('Medical History:', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    const splitHistory = doc.splitTextToSize(patient.medicalHistory, 160);
    doc.text(splitHistory, 30, yPosition);
    yPosition += splitHistory.length * 5 + 15;
  }

  // Analysis history
  if (patient.analyses && patient.analyses.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('Analysis History:', 20, yPosition);
    yPosition += 15;

    const analysisData = patient.analyses.map(analysis => [
      analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A',
      analysis.analysisResults?.prediction || 'N/A',
      analysis.analysisResults?.confidence ? `${(analysis.analysisResults.confidence * 100).toFixed(1)}%` : 'N/A',
      analysis.status || 'N/A'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Result', 'Confidence', 'Status']],
      body: analysisData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9 }
    });

    yPosition = doc.lastAutoTable.finalY + 20;
  }

  return yPosition;
};

const generateSystemAnalyticsReport = async (doc, analytics, yPosition) => {
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('System Analytics Report', 20, yPosition);
  yPosition += 20;

  // System overview
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('System Overview:', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.text(`Total Users: ${analytics.totalUsers || 0}`, 30, yPosition);
  doc.text(`Total Patients: ${analytics.totalPatients || 0}`, 120, yPosition);
  yPosition += 12;
  doc.text(`Total Analyses: ${analytics.totalAnalyses || 0}`, 30, yPosition);
  doc.text(`System Uptime: ${analytics.uptime || 'N/A'}`, 120, yPosition);
  yPosition += 20;

  // Performance metrics
  if (analytics.performance) {
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('Performance Metrics:', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.text(`Average Response Time: ${analytics.performance.avgResponseTime || 'N/A'}ms`, 30, yPosition);
    doc.text(`Success Rate: ${analytics.performance.successRate || 'N/A'}%`, 120, yPosition);
    yPosition += 12;
    doc.text(`Error Rate: ${analytics.performance.errorRate || 'N/A'}%`, 30, yPosition);
    doc.text(`Peak Usage: ${analytics.performance.peakUsage || 'N/A'}`, 120, yPosition);
    yPosition += 20;
  }

  return yPosition;
};

export const exportToExcel = (data, type, filename) => {
  let worksheetData = [];
  let worksheetName = 'Data';

  switch (type) {
    case 'doctor-activity':
      worksheetName = 'Doctor Activity';
      worksheetData = data.map(doctor => ({
        'Doctor Name': doctor.name,
        'Email': doctor.email,
        'Total Analyses': doctor.analysisCount || 0,
        'Last Login': doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleDateString() : 'Never',
        'Joined Date': doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A',
        'Status': doctor.isActive ? 'Active' : 'Inactive'
      }));
      break;

    case 'analysis-summary':
      worksheetName = 'Analysis Summary';
      worksheetData = data.map(analysis => ({
        'Patient ID': analysis.patientId?.patientId || 'N/A',
        'Patient Name': analysis.patientId?.name || 'N/A',
        'Result': analysis.analysisResults?.prediction || 'N/A',
        'Confidence': analysis.analysisResults?.confidence ? `${(analysis.analysisResults.confidence * 100).toFixed(1)}%` : 'N/A',
        'Status': analysis.status || 'N/A',
        'Date': analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A',
        'Processed By': analysis.processedBy?.name || 'N/A'
      }));
      break;

    case 'patient-list':
      worksheetName = 'Patients';
      worksheetData = data.map(patient => ({
        'Patient ID': patient.patientId,
        'Name': patient.name,
        'Age': patient.age,
        'Gender': patient.gender,
        'Phone': patient.contactInfo?.phone || 'N/A',
        'Email': patient.contactInfo?.email || 'N/A',
        'Total Analyses': patient.analyses?.length || 0,
        'Created Date': patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'
      }));
      break;

    default:
      worksheetData = data;
  }

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

  // Auto-size columns
  const colWidths = [];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        const cellLength = cell.v.toString().length;
        if (cellLength > maxWidth) {
          maxWidth = cellLength;
        }
      }
    }
    colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
  }
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename || `${worksheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (data, type, filename) => {
  let csvData = [];
  let headers = [];

  switch (type) {
    case 'doctor-activity':
      headers = ['Doctor Name', 'Email', 'Total Analyses', 'Last Login', 'Joined Date', 'Status'];
      csvData = data.map(doctor => [
        doctor.name,
        doctor.email,
        doctor.analysisCount || 0,
        doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleDateString() : 'Never',
        doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A',
        doctor.isActive ? 'Active' : 'Inactive'
      ]);
      break;

    case 'analysis-summary':
      headers = ['Patient ID', 'Patient Name', 'Result', 'Confidence', 'Status', 'Date', 'Processed By'];
      csvData = data.map(analysis => [
        analysis.patientId?.patientId || 'N/A',
        analysis.patientId?.name || 'N/A',
        analysis.analysisResults?.prediction || 'N/A',
        analysis.analysisResults?.confidence ? `${(analysis.analysisResults.confidence * 100).toFixed(1)}%` : 'N/A',
        analysis.status || 'N/A',
        analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A',
        analysis.processedBy?.name || 'N/A'
      ]);
      break;

    default:
      // Generic CSV export
      if (data.length > 0) {
        headers = Object.keys(data[0]);
        csvData = data.map(item => headers.map(header => item[header] || ''));
      }
  }

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};