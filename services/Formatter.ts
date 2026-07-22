export class Formatter {
  // Title-case Malay month names (shared by Notis/AkuJangi documents).
  static readonly MALAY_MONTHS_TITLE = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

  static formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '-';
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  }

  static formatDate(dateString?: string): string {
    if (!dateString) return '-';

    const cleanDate = dateString.split('T')[0];
    const parts = cleanDate.split('-');

    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }

    return dateString;
  }

  static formatDateMalay(dateString?: string): string {
    if (!dateString) return '-';
    const months = ["JANUARI", "FEBRUARI", "MAC", "APRIL", "MEI", "JUN", "JULAI", "OGOS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DISEMBER"];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  // Title-case Malay long date, e.g. "23 Julai 2026". Used by formal letters
  // (Notis/AkuJanji). `fallback` is returned for empty/invalid input.
  static formatDateMalayTitleCase(dateString?: string, fallback = '.............'): string {
    if (!dateString) return fallback;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallback;
    return `${d.getDate()} ${Formatter.MALAY_MONTHS_TITLE[d.getMonth()]} ${d.getFullYear()}`;
  }

  static getCurrentDate(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
  }
}
