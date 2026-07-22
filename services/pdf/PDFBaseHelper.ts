// Government slogans reused across BQ and Notis documents.
export const GOVERNMENT_SLOGANS = [
  "“KITASELANGOR MAJU BERSAMA”",
  "“MALAYSIA MADANI”",
  "“BERKHIDMAT UNTUK NEGARA”",
  "“MAMPAN PROGRESIF SEJAHTERA”"
];

export class PDFBaseHelper {
  static getJsPDF(): any {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.jspdf) {
      // @ts-ignore
      return window.jspdf.jsPDF;
    }
    // Fallback if window is not defined
    try {
      const { jsPDF } = require('jspdf');
      return jsPDF;
    } catch {
      return null;
    }
  }

  // Format a number with exactly 2 decimal places, grouping thousands.
  // Replaces the duplicated `fmt`/inline toLocaleString helpers in the
  // LAD, LoC and Notis exporters.
  static formatNumber2dp(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Draw the four government slogans at column `x` starting at `y`, advancing
  // by `step` after each line. The trailing gap (after the last slogan) is
  // `gapAfter` instead of `step`. Returns the new y. Replaces the repeated
  // slogan string literals across the BQ and Notis exporters.
  static drawGovernmentSlogans(doc: any, x: number, y: number, step = 5, gapAfter = 12): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    for (const s of GOVERNMENT_SLOGANS) {
      doc.text(s, x, y);
      y += step;
    }
    return y - step + gapAfter;
  }

  static getBase64ImageFromURL(url: string): Promise<string | null> {
    return new Promise((resolve) => {
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
  }
}
