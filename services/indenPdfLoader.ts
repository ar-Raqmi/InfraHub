import { parseIndenDocument, IndenPdfRow } from './indenPdfParser';

// Loaded on demand so pdfjs stays out of the main bundle.
export async function parseIndenFile(file: File): Promise<IndenPdfRow[]> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  try {
    return await parseIndenDocument(await task.promise);
  } finally {
    await task.destroy();
  }
}
