import jsPDF from 'jspdf';
import { Project } from '../../types';

/**
 * Generate Aku Janji PDF matching the akuJanji reference format
 * Includes:
 * - Official letterhead
 * - Promise declaration from contractor
 * - 5-day start requirement
 * - Contractor name (from namaSyarikat)
 * - Date fields
 * - Witness and contractor signature areas
 */
export const generateAkuJanjiPDF = (project: Project) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // ===== OFFICIAL HEADER =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('JABATAN KEJURUTERAAN', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('MAJLIS PERBANDARAN SELAYANG', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Document type
  doc.setFontSize(12);
  doc.text('SURAT AKU JANJI', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // ===== PROJECT REFERENCE =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. Fail: ${project.noFail}`, 15, yPosition);
  yPosition += 6;
  doc.text(`No. Vote: ${project.noVote || '-'}`, 15, yPosition);
  yPosition += 10;

  // ===== PROMISE DECLARATION =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AKU JANJI', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Contractor name
  const contractorName = project.namaSyarikat || '______________________________';
  doc.text(`Saya, wakil ${contractorName}`, 15, yPosition);
  yPosition += 8;

  // Promise text
  const promiseText = `dengan sesungguhnya berjanji bahwa saya akan memulakan kerja-kerja bagi projek "${project.namaProjek}" dalam tempoh 5 (lima) hari dari tarikh serah tapak.`;
  const promiseLines = doc.splitTextToSize(promiseText, pageWidth - 30);

  promiseLines.forEach((line: string) => {
    doc.text(line, 15, yPosition);
    yPosition += 5;
  });
  yPosition += 8;

  // Consequences of failure
  doc.setFont('helvetica', 'bold');
  const failureText = 'Sekiranya gagal memulakan kerja dalam tempoh yang ditetapkan, saya faham bahawa:';
  doc.text(failureText, 15, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  const consequences = [
    '1. Tindakan penalti akan diambil mengikut terma dan syarat kontrak.',
    '2. Denda lewat (LAD) akan dikenakan.',
    '3. Kontrak boleh ditamatkan tanpa sebarang notis lanjut.',
  ];

  consequences.forEach((line) => {
    doc.text(line, 20, yPosition);
    yPosition += 6;
  });
  yPosition += 10;

  // Project details section
  doc.setFont('helvetica', 'bold');
  doc.text('BUTIRAN PROJEK:', 15, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');

  // Project name
  const projectLines = doc.splitTextToSize(`Nama Projek: ${project.namaProjek}`, pageWidth - 30);
  projectLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  yPosition += 1;

  // Location
  const lokasi = project.aduanList && project.aduanList.length > 0
    ? project.aduanList.map(a => a.lokasi).join(', ')
    : (project.lokasi || '-');
  const lokasiLines = doc.splitTextToSize(`Lokasi: ${lokasi}`, pageWidth - 30);
  lokasiLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  yPosition += 1;

  // Contract value
  const kosProjek = project.kosProjek || 0;
  doc.text(`Nilai Kontrak: RM ${kosProjek.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, yPosition);
  yPosition += 6;

  // Contract period
  if (project.tempohKontrak) {
    const unitLabel = project.tempohKontrakUnit === 'HARI' ? 'Hari'
      : project.tempohKontrakUnit === 'MINGGU' ? 'Minggu'
      : 'Bulan';
    doc.text(`Tempoh Kontrak: ${project.tempohKontrak} ${unitLabel}`, 20, yPosition);
    yPosition += 6;
  }

  // Appointment date
  if (project.tarikhLantikan) {
    const appointmentDate = new Date(project.tarikhLantikan).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Tarikh Lantikan: ${appointmentDate}`, 20, yPosition);
    yPosition += 6;
  }

  // Site handover date
  if (project.tarikhSerahTapak) {
    const handoverDate = new Date(project.tarikhSerahTapak).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Tarikh Serah Tapak: ${handoverDate}`, 20, yPosition);
    yPosition += 15;
  } else {
    yPosition += 10;
  }

  // ===== SIGNATURE SECTION =====
  // Check if we need a new page
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  // Two columns for signatures
  // Left: Witness
  doc.setFont('helvetica', 'bold');
  doc.text('SAKSI:', 15, yPosition);
  doc.text('KONTRAKTOR:', 110, yPosition);
  yPosition += 15;

  // Signature lines
  doc.setFont('helvetica', 'normal');
  doc.line(15, yPosition, 85, yPosition);
  doc.line(110, yPosition, 180, yPosition);
  yPosition += 5;

  // Names
  doc.text('Nama: ___________________', 15, yPosition);
  doc.text(`Nama: ${contractorName}`, 110, yPosition);
  yPosition += 6;

  // IC/Company registration
  doc.text('No. K/P: _________________', 15, yPosition);
  doc.text('No. Pendaftaran: _________', 110, yPosition);
  yPosition += 6;

  // Dates
  const currentDate = new Date().toLocaleDateString('ms-MY');
  doc.text(`Tarikh: ${currentDate}`, 15, yPosition);
  doc.text(`Tarikh: ${currentDate}`, 110, yPosition);
  yPosition += 15;

  // ===== REFERENCE NUMBERS =====
  doc.setFontSize(8);
  doc.text(`Rujukan: ${project.noFail}`, 15, yPosition);
  doc.text(`No. Vote: ${project.noVote || '-'}`, 110, yPosition);

  // Save the PDF
  const filename = `AkuJanji_${project.noFail.replace(/\//g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
