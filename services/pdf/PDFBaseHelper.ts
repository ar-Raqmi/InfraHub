import { DEFAULT_PROFILE } from '../../components/org/orgDefaults';
import type { OrgDocs } from '../../components/org/orgDocs';

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

  // Draw the organisation's slogans (Tetapan Organisasi -> Profil) at column `x` starting at `y`, advancing
  // by `step` after each line. The trailing gap (after the last slogan) is `gapAfter` instead of `step`.
  // Returns the new y.
  static drawGovernmentSlogans(doc: any, x: number, y: number, step = 5, gapAfter = 12, slogans: string[] = DEFAULT_PROFILE.slogans): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    for (const s of slogans) {
      doc.text(s, x, y);
      y += step;
    }
    return y - step + gapAfter;
  }

  // Optional printed letterhead (logo + name + address) for PBTs without pre-printed paper. It fits inside the
  // 50 mm headroom the letters already leave, so the body layout does not move.
  static async drawLetterhead(doc: any, org: OrgDocs): Promise<void> {
    if (!org.profile.printLetterhead) return;
    const pageWidth = doc.internal.pageSize.getWidth();
    const logo = org.logo ? await PDFBaseHelper.getBase64ImageFromURL(org.logo.src) : null;
    if (logo) doc.addImage(logo, 'PNG', pageWidth / 2 - 11, 10, 22, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(org.profile.name.toUpperCase(), pageWidth / 2, 38, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const contact = [org.profile.phone && `Tel: ${org.profile.phone}`, org.profile.email, org.profile.website].filter(Boolean).join('   ');
    doc.text(org.profile.addressLines.join(' '), pageWidth / 2, 42.5, { align: 'center' });
    if (contact) doc.text(contact, pageWidth / 2, 46.5, { align: 'center' });
    doc.setLineWidth(0.4);
    doc.line(20, 49, pageWidth - 20, 49);
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
