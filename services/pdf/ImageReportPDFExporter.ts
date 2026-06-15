import { jsPDF } from 'jspdf';

type LayoutType = 'vertical' | 'horizontal' | 'big-top' | 'big-left';

interface ComplaintRow {
  id: string;
  location: string;
  description: string;
}

const splitTextToLines = (doc: any, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const processImageForPdf = (base64: string, widthMm: number, heightMm: number, mode: 'cover' | 'contain' = 'cover'): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const density = 8;
      const reqW = Math.floor(widthMm * density);
      const reqH = Math.floor(heightMm * density);

      const canvas = document.createElement('canvas');
      canvas.width = reqW;
      canvas.height = reqH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64); return; }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, reqW, reqH);

      const imgRatio = img.width / img.height;
      const reqRatio = reqW / reqH;

      if (mode === 'cover') {
        let sX, sY, sW, sH;
        if (imgRatio > reqRatio) {
          sH = img.height;
          sW = img.height * reqRatio;
          sX = (img.width - sW) / 2;
          sY = 0;
        } else {
          sW = img.width;
          sH = img.width / reqRatio;
          sX = 0;
          sY = (img.height - sH) / 2;
        }
        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, reqW, reqH);
      } else {
        // contain / fit
        let dW, dH, dX, dY;
        if (imgRatio > reqRatio) {
          dW = reqW;
          dH = reqW / imgRatio;
          dX = 0;
          dY = (reqH - dH) / 2;
        } else {
          dH = reqH;
          dW = reqH * imgRatio;
          dX = (reqW - dW) / 2;
          dY = 0;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height, dX, dY, dW, dH);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.90));
    };
    img.onerror = () => resolve(base64);
  });
};

export class ImageReportPDFExporter {
    static async export(options: {
        complaints: ComplaintRow[];
        mapImageBase64: string | null;
        siteImagesBase64: string[];
        layout: LayoutType;
    }): Promise<void> {
        const { complaints, mapImageBase64, siteImagesBase64, layout } = options;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 10;
        const contentWidth = pageWidth - margin * 2;

        let scaleFactor = 1.0;
        let fontScaleFactor = 1.0;
        let titleFontSize = 10;
        let currentFontSize = 8;

        doc.setFontSize(titleFontSize * fontScaleFactor);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN BERGAMBAR', pageWidth / 2, 15, { align: 'center' });

        let currentY = 18;
        const col1Width = 10;
        const col2Width = 80;
        const col3Width = contentWidth - col1Width - col2Width;

        doc.setFontSize(currentFontSize * fontScaleFactor);
        doc.setFillColor(240, 240, 240);
        doc.setDrawColor(0);
        doc.rect(margin, currentY, col1Width, 5, 'FD');
        doc.rect(margin + col1Width, currentY, col2Width, 5, 'FD');
        doc.rect(margin + col1Width + col2Width, currentY, col3Width, 5, 'FD');

        doc.setTextColor(0);
        doc.text('Bil', margin + 2, currentY + 3.2);
        doc.text('Lokasi', margin + col1Width + 2, currentY + 3.2);
        doc.text('Aduan', margin + col1Width + col2Width + 2, currentY + 3.2);

        currentY += 5;

        doc.setFont('helvetica', 'normal');
        const minRowHeight = 5;
        const col1Pad = 2;
        const col2Pad = 2;
        const col3Pad = 2;
        const col2MaxWidth = col2Width - (col2Pad * 2);
        const col3MaxWidth = col3Width - (col3Pad * 2);

        complaints.forEach((row, index) => {
            const bil = (index + 1).toString();
            const locationLines = splitTextToLines(doc, row.location.toUpperCase(), col2MaxWidth);
            const descLines = splitTextToLines(doc, row.description.toUpperCase(), col3MaxWidth);
            const maxLines = Math.max(locationLines.length, descLines.length);
            const rowHeight = minRowHeight + ((maxLines - 1) * 3);

            doc.rect(margin, currentY, col1Width, rowHeight, 'S');
            doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'S');
            doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'S');

            doc.text(bil, margin + col1Pad, currentY + 3.2);
            locationLines.forEach((line, i) => {
                doc.text(line, margin + col1Width + col2Pad, currentY + 3.2 + (i * 3));
            });
            descLines.forEach((line, i) => {
                doc.text(line, margin + col1Width + col2Width + col3Pad, currentY + 3.2 + (i * 3));
            });

            currentY += rowHeight;
        });

        const gapAfterTable = 5;
        const minimumImageSectionHeight = 60;
        const requiredForImages = gapAfterTable + 6 + minimumImageSectionHeight;
        const spaceRemainingForImages = pageHeight - currentY - 10;

        if (spaceRemainingForImages < requiredForImages) {
            scaleFactor = spaceRemainingForImages / requiredForImages;

            if (scaleFactor < 0.5) {
                scaleFactor = 0.5;
                fontScaleFactor = 0.8;
            }
        }

        currentY += 5;

        const bottomMargin = 10;
        const availableHeight = (pageHeight - currentY - bottomMargin) * scaleFactor;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(titleFontSize * fontScaleFactor);
        doc.text('PELAN LOKASI', margin, currentY + 4);

        const mapBoxY = currentY + (6 * scaleFactor);
        const mapBoxHeight = (availableHeight - 6) * scaleFactor;
        const mapBoxWidth = ((contentWidth / 2) - 2) * scaleFactor;

        doc.setDrawColor(0);
        doc.rect(margin, mapBoxY, mapBoxWidth, mapBoxHeight);

        if (mapImageBase64) {
            try {
                const processedMap = await processImageForPdf(mapImageBase64, mapBoxWidth, mapBoxHeight, 'contain');
                doc.addImage(processedMap, 'JPEG', margin, mapBoxY, mapBoxWidth, mapBoxHeight);
            } catch (e) {
                console.error("Map image error", e);
            }
        }

        const rightStartX = margin + (mapBoxWidth + 4);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(titleFontSize * fontScaleFactor);
        doc.text('GAMBAR TAPAK', rightStartX, currentY + 4);

        const gridBoxY = mapBoxY;
        const gridBoxWidth = mapBoxWidth;
        const gridBoxHeight = mapBoxHeight;

        interface ImageBox { x: number, y: number, w: number, h: number, img: string }
        const tasks: ImageBox[] = [];
        const count = siteImagesBase64.length;
        const gap = 2 * scaleFactor;

        if (count === 1) {
            tasks.push({ x: rightStartX, y: gridBoxY, w: gridBoxWidth, h: gridBoxHeight, img: siteImagesBase64[0] });
        } else if (count === 2) {
            if (layout === 'vertical') {
                const h = (gridBoxHeight - gap) / 2;
                tasks.push({ x: rightStartX, y: gridBoxY, w: gridBoxWidth, h, img: siteImagesBase64[0] });
                tasks.push({ x: rightStartX, y: gridBoxY + h + gap, w: gridBoxWidth, h, img: siteImagesBase64[1] });
            } else {
                const w = (gridBoxWidth - gap) / 2;
                tasks.push({ x: rightStartX, y: gridBoxY, w, h: gridBoxHeight, img: siteImagesBase64[0] });
                tasks.push({ x: rightStartX + w + gap, y: gridBoxY, w, h: gridBoxHeight, img: siteImagesBase64[1] });
            }
        } else if (count === 3) {
            if (layout === 'big-top') {
                const h1 = (gridBoxHeight - gap) / 2;
                const w2 = (gridBoxWidth - gap) / 2;
                tasks.push({ x: rightStartX, y: gridBoxY, w: gridBoxWidth, h: h1, img: siteImagesBase64[0] });
                tasks.push({ x: rightStartX, y: gridBoxY + h1 + gap, w: w2, h: h1, img: siteImagesBase64[1] });
                tasks.push({ x: rightStartX + w2 + gap, y: gridBoxY + h1 + gap, w: w2, h: h1, img: siteImagesBase64[2] });
            } else {
                const w1 = (gridBoxWidth - gap) / 2;
                const h2 = (gridBoxHeight - gap) / 2;
                tasks.push({ x: rightStartX, y: gridBoxY, w: w1, h: gridBoxHeight, img: siteImagesBase64[0] });
                tasks.push({ x: rightStartX + w1 + gap, y: gridBoxY, w: w1, h: h2, img: siteImagesBase64[1] });
                tasks.push({ x: rightStartX + w1 + gap, y: gridBoxY + h2 + gap, w: w1, h: h2, img: siteImagesBase64[2] });
            }
        } else if (count >= 4) {
            const w = (gridBoxWidth - gap) / 2;
            const h = (gridBoxHeight - gap) / 2;
            tasks.push({ x: rightStartX, y: gridBoxY, w, h, img: siteImagesBase64[0] });
            tasks.push({ x: rightStartX + w + gap, y: gridBoxY, w, h, img: siteImagesBase64[1] });
            tasks.push({ x: rightStartX, y: gridBoxY + h + gap, w, h, img: siteImagesBase64[2] });
            tasks.push({ x: rightStartX + w + gap, y: gridBoxY + h + gap, w, h, img: siteImagesBase64[3] });
        }

        for (const t of tasks) {
            doc.setDrawColor(200);
            doc.rect(t.x, t.y, t.w, t.h);
            try {
                const processedImg = await processImageForPdf(t.img, t.w, t.h, 'cover');
                doc.addImage(processedImg, 'JPEG', t.x, t.y, t.w, t.h);
            } catch (e) {
                console.error("Err", e);
            }
        }

        doc.save(`Laporan_Bergambar_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}
