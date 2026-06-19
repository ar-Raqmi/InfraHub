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
