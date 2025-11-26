import jsPDF from 'jspdf';
import { Project, User } from '../../types';

/**
 * Generate Cover Page PDF matching the coverPage reference format
 * Includes:
 * - Official letterhead (Majlis Perbandaran Selayang)
 * - Date field (from tarikhBuka)
 * - From: Penolong Jurutera, Unit Selenggara Infrastruktur
 * - To: Pengarah Jabatan Kejuruteraan
 * - Project title (CAPSLOCK first letter only)
 * - BP planning block section
 * - Signature areas (PJA name from user data)
 */
export const generateCoverPagePDF = (project: Project, pjaUser?: User) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // ===== OFFICIAL HEADER =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('JABATAN KEJURUTERAAN', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('MAJLIS PERBANDARAN SELAYANG', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Document type
  doc.setFontSize(12);
  doc.text('CADANGAN KERJA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // ===== DATE SECTION =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Format date
  const dateStr = project.tarikhBuka
    ? new Date(project.tarikhBuka).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.text(`Tarikh: ${dateStr}`, 15, yPosition);
  yPosition += 10;

  // ===== FROM SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.text('Daripada:', 15, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  const pjaName = pjaUser?.fullName || 'Penolong Jurutera';
  doc.text(pjaName, 25, yPosition);
  yPosition += 5;
  doc.text('Penolong Jurutera', 25, yPosition);
  yPosition += 5;
  doc.text('Unit Selenggara Infrastruktur', 25, yPosition);
  yPosition += 5;
  doc.text('Jabatan Kejuruteraan', 25, yPosition);
  yPosition += 10;

  // ===== TO SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada:', 15, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  doc.text('Pengarah', 25, yPosition);
  yPosition += 5;
  doc.text('Jabatan Kejuruteraan', 25, yPosition);
  yPosition += 5;
  doc.text('Majlis Perbandaran Selayang', 25, yPosition);
  yPosition += 12;

  // ===== PROJECT TITLE =====
  doc.setFont('helvetica', 'bold');
  doc.text('Perkara:', 15, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');

  // Format title: CAPSLOCK first letter only (as per requirement)
  const titleText = project.namaProjek.charAt(0).toUpperCase() + project.namaProjek.slice(1).toLowerCase();
  const titleLines = doc.splitTextToSize(titleText, pageWidth - 40);

  titleLines.forEach((line: string) => {
    doc.text(line, 25, yPosition);
    yPosition += 5;
  });
  yPosition += 8;

  // ===== PROJECT DETAILS SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.text('BUTIRAN PROJEK', 15, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');

  // No. Fail
  doc.text(`No. Fail: ${project.noFail}`, 20, yPosition);
  yPosition += 6;

  // Lokasi
  const lokasi = project.aduanList && project.aduanList.length > 0
    ? project.aduanList.map(a => a.lokasi).join(', ')
    : (project.lokasi || '-');
  const lokasiLines = doc.splitTextToSize(`Lokasi: ${lokasi}`, pageWidth - 40);
  lokasiLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  yPosition += 1;

  // No. Aduan (if any)
  if (project.aduanList && project.aduanList.length > 0) {
    const aduanNos = project.aduanList.map(a => a.noAduan).join(', ');
    const aduanLines = doc.splitTextToSize(`No. Aduan: ${aduanNos}`, pageWidth - 40);
    aduanLines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
    yPosition += 1;
  }

  // BP (Blok Perancangan)
  doc.text(`BP (Blok Perancangan): ${project.bp || '-'}`, 20, yPosition);
  yPosition += 6;

  // Zon
  if (project.zon) {
    doc.text(`Zon: ${project.zon}`, 20, yPosition);
    yPosition += 6;
  }

  // Kos Projek
  const kosProjek = project.kosProjek || 0;
  doc.text(`Anggaran Kos Projek: RM ${kosProjek.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, yPosition);
  yPosition += 10;

  // ===== BP PLANNING BLOCK =====
  doc.setFont('helvetica', 'bold');
  doc.text('PERANCANGAN', 15, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Blok Perancangan: BP ${project.bp || '-'}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Tarikh Buka: ${dateStr}`, 20, yPosition);
  yPosition += 15;

  // ===== RECOMMENDATION SECTION =====
  doc.setFont('helvetica', 'bold');
  doc.text('SYOR', 15, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  const syorText = 'Adalah disyorkan projek ini dilaksanakan mengikut cadangan kerja yang dikemukakan bagi memastikan infrastruktur awam berada dalam keadaan baik dan selamat untuk kegunaan masyarakat.';
  const syorLines = doc.splitTextToSize(syorText, pageWidth - 40);

  syorLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  yPosition += 15;

  // ===== SIGNATURE SECTION =====
  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.text('Yang menjalankan tugas,', 15, yPosition);
  yPosition += 20;

  // Signature line
  doc.line(15, yPosition, 80, yPosition);
  yPosition += 5;

  // PJA details
  doc.setFont('helvetica', 'bold');
  doc.text(pjaName, 15, yPosition);
  yPosition += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Penolong Jurutera', 15, yPosition);
  yPosition += 5;
  doc.text('Unit Selenggara Infrastruktur', 15, yPosition);
  yPosition += 5;
  doc.text('Jabatan Kejuruteraan', 15, yPosition);
  yPosition += 5;
  doc.text('Majlis Perbandaran Selayang', 15, yPosition);

  // Save the PDF
  const filename = `CoverPage_${project.noFail.replace(/\//g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
