import { Project, formatCurrency, formatDate } from '../../types';

const getBase64ImageFromURL = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
        // @ts-ignore
        if (typeof window === 'undefined') {
            resolve(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } else {
                resolve(null);
            }
        };
        img.onerror = () => {
            resolve(null);
        };
        img.src = url;
    });
};

export class PrestasiPDFExporter {
    static async export(project: Project, localScores: number[], localSkop: string | null, companyDetails?: any): Promise<void> {
        const totalScore = localScores.reduce((a, b) => a + b, 0);
        const percentage = Math.ceil((totalScore / 60) * 100);

        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 15;

        const sealLogo = await getBase64ImageFromURL("https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png");

        if (sealLogo) {
            doc.addImage(sealLogo, 'PNG', pageWidth / 2 - 12, currentY, 24, 20);
            currentY += 25;
        } else {
            currentY += 5;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("BORANG PRESTASI KONTRAKTOR / PEMBEKAL", pageWidth / 2, currentY, { align: "center" });
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 55, currentY + 1, pageWidth / 2 + 55, currentY + 1);
        currentY += 10;

        doc.setFontSize(10);
        doc.text("A. MAKLUMAT AM", margin, currentY);
        currentY += 3;

        const tableABody = [
            ["Nama Pembekal/Kontraktor :", { content: project.namaSyarikat?.toUpperCase() || '', styles: { fontStyle: 'bold' } }],
            ["Nombor Pembekal / Kontraktor :", companyDetails?.registrationNumber || ''],
            ["Skop Pembekal/Kontraktor :", { content: `${localSkop}`, styles: { fontStyle: 'bold' } }],
            ["Tajuk Tawaran:", { content: project.namaProjek?.toUpperCase() || '', styles: { fontStyle: 'bold' } }]
        ];

        // @ts-ignore
        doc.autoTable({
            startY: currentY,
            body: tableABody,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: 0,
                textColor: 0
            },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: margin, right: margin }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY;

        const tableA2Body = [
            [
                "No. Pesanan Rasmi :",
                project.noInden || '-',
                "Kos (RM) :",
                project.kosSebenar ? formatCurrency(project.kosSebenar).replace('RM', '').trim() : ''
            ],
            [
                "Tarikh Mula Kerja /Pesanan :",
                project.tarikhMulaKerja ? formatDate(project.tarikhMulaKerja) : '-',
                "Tarikh siap kerja / Terima Pesanan :",
                project.tarikhSiapSebenar ? formatDate(project.tarikhSiapSebenar) : '-'
            ],
            [
                "Lanjutan Masa (Sehingga) :",
                "-",
                "No. Inbois :",
                project.noInbois || ''
            ]
        ];

        // @ts-ignore
        doc.autoTable({
            startY: currentY,
            body: tableA2Body,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: 0,
                textColor: 0
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 40, fontStyle: 'bold' },
                2: { cellWidth: 50 },
                3: { cellWidth: 40, fontStyle: 'bold' }
            },
            margin: { left: margin, right: margin }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "bold");
        doc.text("B. MAKLUMAT PENILAIAN PRESTASI", margin, currentY);
        currentY += 5;

        const drawRatingGrid = (y: number, selectedScore: number) => {
            const startX = margin + 10;
            const boxWidth = 160;
            const boxHeight = 12;
            const sections = 5;
            const secWidth = boxWidth / sections;

            doc.setDrawColor(0);
            doc.setLineWidth(0.1);
            doc.rect(startX, y, boxWidth, boxHeight);

            const labels = ["Amat Lemah", "Lemah", "Sederhana", "Baik", "Amat Baik"];
            const values = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]];

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");

            for (let i = 0; i < sections; i++) {
                const x = startX + (i * secWidth);

                doc.setTextColor(0, 0, 0);
                doc.setDrawColor(0);

                if (i > 0) doc.line(x, y, x, y + boxHeight);

                doc.line(x, y + 6, x + secWidth, y + 6);

                doc.text(labels[i], x + (secWidth / 2), y + 4, { align: "center" });

                const val1 = values[i][0];
                const val2 = values[i][1];
                const subWidth = secWidth / 2;

                doc.line(x + subWidth, y + 6, x + subWidth, y + boxHeight);

                if (val1 === selectedScore) {
                    doc.setFillColor(0, 0, 0);
                    doc.rect(x, y + 6, subWidth, 6, 'F');
                    doc.setTextColor(255, 255, 255);
                } else {
                    doc.setTextColor(0, 0, 0);
                }
                doc.text(val1.toString(), x + (subWidth / 2), y + 10, { align: "center" });

                if (val2 === selectedScore) {
                    doc.setFillColor(0, 0, 0);
                    doc.rect(x + subWidth, y + 6, subWidth, 6, 'F');
                    doc.setTextColor(255, 255, 255);
                } else {
                    doc.setTextColor(0, 0, 0);
                }
                doc.text(val2.toString(), x + subWidth + (subWidth / 2), y + 10, { align: "center" });

                doc.setTextColor(0, 0, 0);
            }

            return y + boxHeight + 8;
        };

        const questions = [
            "Keupayaan kontraktor/ pembekal memenuhi permintaan dari segi harga berbanding kontraktor/ pembekal lain.",
            "Keupayaan kontraktor/ pembekal untuk membekalkan barangan /perkhidmatan/kerja mengikut spesifikasi yang ditetapkan.",
            "Keupayaan kontraktor/ pembekal untuk membekalkan barangan/ perkhidmatan dalam jangkamasa yang ditetapkan.",
            "Keupayaan kontraktor/ pembekal untuk membuat tindakan pembetulan sekiranya barangan/ perkhidmatan yang dibekalkan tidak memenuhi spesifikasi yang ditetapkan.",
            "Penilaian terhadap kontraktor/pembekal dari segi sikap dan kerjasama yang ditunjukkan oleh kontraktor/pembekal.",
            "Kekemasan dan kebersihan semasa dan selepas melaksanakan kerja / penghantaran bekalan."
        ];

        for (let i = 0; i < 4; i++) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const qText = `${i + 1}. ${questions[i]}`;
            const splitText = doc.splitTextToSize(qText, pageWidth - (margin * 2));
            doc.text(splitText, margin, currentY);
            currentY += (splitText.length * 4) + 2;

            currentY = drawRatingGrid(currentY, localScores[i]);
        }

        doc.addPage();
        currentY = 20;

        for (let i = 4; i < 6; i++) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const qText = `${i + 1}. ${questions[i]}`;
            const splitText = doc.splitTextToSize(qText, pageWidth - (margin * 2));
            doc.text(splitText, margin, currentY);
            currentY += (splitText.length * 4) + 2;

            currentY = drawRatingGrid(currentY, localScores[i]);
        }

        doc.setLineWidth(0.1);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("C. MARKAH PRESTASI KONTRAKTOR DAN PEMBEKAL", margin, currentY);
        currentY += 5;

        const cBoxY = currentY;
        const cBoxHeight = 45;
        doc.rect(margin, cBoxY, pageWidth - (margin * 2), cBoxHeight);

        doc.setFontSize(9);
        doc.text("Purata Prestasi Kontraktor/Pembekal", margin + 5, cBoxY + 10);

        const eqY = cBoxY + 25;
        doc.setFontSize(11);

        let cursorX = margin + 5;
        doc.text("=", cursorX, eqY); cursorX += 5;

        doc.text(totalScore.toString(), cursorX + 3, eqY - 3);
        doc.line(cursorX, eqY, cursorX + 10, eqY);
        doc.text("60", cursorX + 3, eqY + 4);
        cursorX += 15;

        doc.text("X 100% =", cursorX, eqY); cursorX += 20;
        doc.setFont("helvetica", "bold");
        doc.text(`${percentage}`, cursorX, eqY);
        doc.setLineWidth(0.3);
        doc.line(cursorX, eqY + 1, cursorX + (percentage.toString().length * 3), eqY + 1);
        cursorX += 10;
        doc.text("%", cursorX, eqY);

        doc.setLineWidth(0.1);
        doc.line(pageWidth / 2, cBoxY, pageWidth / 2, cBoxY + cBoxHeight);

        const rightX = pageWidth / 2 + 5;
        let scaleY = cBoxY + 8;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Skala Penilaian:-", rightX, scaleY);
        scaleY += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const scales = [
            "0 - 20%  =  Amat Lemah",
            "21 - 40%  =  Lemah",
            "41 - 60%  =  Sederhana",
            "61 - 80%  =  Baik",
            "81 - 100% =  Amat Baik"
        ];
        scales.forEach(s => {
            doc.text(s, rightX, scaleY);
            scaleY += 5;
        });

        currentY += cBoxHeight + 15;

        const titles = [
            "PENGESAHAN PEGAWAI PENYELIA TAPAK / PENERIMA BEKALAN",
            "PENGESAHAN PEGAWAI / JURUTERA",
            "PERAKUAN PENGARAH JABATAN - Maklumat telah dikemaskini di dalam sistem."
        ];

        for (const title of titles) {
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
            doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'S');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);

            if (title.includes("-")) {
                const parts = title.split("-");
                const boldPart = parts[0].trim();
                const normalPart = parts[1].trim();
                doc.text(boldPart, margin + 2, currentY + 5);
                doc.setFont("helvetica", "italic");
                doc.text(`- ${normalPart}`, margin + 5 + doc.getTextWidth(boldPart), currentY + 5);
            } else {
                doc.text(title, pageWidth / 2, currentY + 5, { align: "center" });
            }

            currentY += 8;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text("Tandatangan:", margin + 5, currentY + 10);
            doc.text("Tarikh:", margin + 5, currentY + 20);

            currentY += 25;
        }

        const footerY = 285;
        doc.setLineWidth(0.5);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text("Sila hantar salinan borang ini ke :    Bahagian Perolehan, Majlis Perbandaran Selayang", margin, footerY + 4);

        doc.save(`Borang_Prestasi_${project.noFail || 'Draft'}.pdf`);
    }
}
