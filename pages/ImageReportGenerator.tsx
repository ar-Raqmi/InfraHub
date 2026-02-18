import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Project, User, Role, ProjectStatus, TemporaryImage } from '../types';
import { supabaseService } from '../services/supabaseService';
import {
  Trash2,
  FileText,
  Map as MapIcon,
  Plus,
  FileDown,
  Undo,
  Square,
  Circle,
  MoveUpRight,
  MousePointer2,
  Crop,
  Check,
  X,
  Minus,
  Search,
  Briefcase,
  AlertTriangle,
  Pencil,
  Columns,
  Rows,
  LayoutTemplate,
  ImageIcon,
  RefreshCw,
  Maximize2,
  Clock,
  Upload,
  Tag,
  History,
  MapPin
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useUsers } from '../hooks/useUsers';
import { useTemporaryGallery } from '../hooks/useTemporaryGallery';

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#000000',
  '#ffffff',
];

interface ComplaintRow {
  id: string;
  location: string;
  description: string;
}

interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
}

type ToolType = 'select' | 'rect' | 'circle' | 'arrow' | 'line' | 'crop';
type LayoutType = 'grid' | 'horizontal' | 'vertical' | 'big-left' | 'big-top';

const splitTextToLines = (doc: any, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  const words = text.split(' ');
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

const truncateText = (doc: any, text: string, maxWidth: number, suffix = '...'): string => {
  if (doc.getTextWidth(text) <= maxWidth) return text;

  let truncated = text;
  while (doc.getTextWidth(truncated + suffix) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }

  return truncated + suffix;
};

const processImageForPdf = (base64: string, widthMm: number, heightMm: number, mode: 'cover' | 'contain' = 'cover'): Promise<string> => {
  return new Promise((resolve) => {
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

const generatePDF = async ({ complaints, mapImageBase64, siteImagesBase64, layout }: {
  complaints: ComplaintRow[];
  mapImageBase64: string | null;
  siteImagesBase64: string[];
  layout: LayoutType;
}) => {
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
};

// --- COMPONENTS ---

interface CanvasMapEditorProps {
  initialImage: string | null;
  isMobile?: boolean;
}

export interface CanvasMapEditorRef {
  exportImage: () => string | null;
}

const CanvasMapEditor = forwardRef<CanvasMapEditorRef, CanvasMapEditorProps>(({ initialImage, isMobile }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [cropRect, setCropRect] = useState<Shape | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = initialImage;
      img.onload = () => {
        setBgImage(img);
        setShapes([]);
      };
    } else {
      setBgImage(null);
      setShapes([]);
    }
  }, [initialImage]);

  const getImagePlacement = () => {
    if (!canvasRef.current || !bgImage) return null;
    const canvas = canvasRef.current;
    const scale = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height);
    const x = (canvas.width / 2) - (bgImage.width / 2) * scale;
    const y = (canvas.height / 2) - (bgImage.height / 2) * scale;
    return { x, y, scale, w: bgImage.width * scale, h: bgImage.height * scale };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage) {
      const placement = getImagePlacement();
      if (placement) {
        ctx.drawImage(bgImage, placement.x, placement.y, placement.w, placement.h);
      }
    }

    const allShapes = currentShape && selectedTool !== 'crop' ? [...shapes, currentShape] : shapes;

    allShapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();

      if (shape.type === 'rect') {
        ctx.strokeRect(shape.x, shape.y, shape.width || 0, shape.height || 0);
      } else if (shape.type === 'circle') {
        const radius = Math.sqrt(Math.pow(shape.width || 0, 2) + Math.pow(shape.height || 0, 2));
        ctx.arc(shape.x, shape.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape.type === 'arrow') {
        const headlen = 15 + (shape.strokeWidth * 1.5);
        const toX = (shape.x + (shape.width || 0));
        const toY = (shape.y + (shape.height || 0));
        const angle = Math.atan2(toY - shape.y, toX - shape.x);

        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (shape.type === 'line') {
        const toX = (shape.x + (shape.width || 0));
        const toY = (shape.y + (shape.height || 0));
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      }
    });

    if (selectedTool === 'crop') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const activeCrop = isDrawing && currentShape ? currentShape : cropRect;

      if (activeCrop) {
        ctx.clearRect(activeCrop.x, activeCrop.y, activeCrop.width || 0, activeCrop.height || 0);
        const placement = getImagePlacement();
        if (placement && bgImage) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(activeCrop.x, activeCrop.y, activeCrop.width || 0, activeCrop.height || 0);
          ctx.clip();
          ctx.drawImage(bgImage, placement.x, placement.y, placement.w, placement.h);
          ctx.restore();
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(activeCrop.x, activeCrop.y, activeCrop.width || 0, activeCrop.height || 0);
        ctx.setLineDash([]);
      }
    }
  };

  useEffect(() => { draw(); }, [shapes, currentShape, bgImage, selectedTool, cropRect]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        draw();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [bgImage]);

  const getMousePos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || selectedTool === 'select' || !bgImage) return;
    const { x, y } = getMousePos(e);
    setIsDrawing(true);
    setCurrentShape({
      id: Date.now().toString(),
      type: selectedTool === 'crop' ? 'rect' : (selectedTool as any),
      x, y, width: 0, height: 0,
      color: selectedColor,
      strokeWidth: strokeWidth
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !isDrawing || !currentShape) return;
    const { x, y } = getMousePos(e);
    setCurrentShape(prev => prev ? ({ ...prev, width: x - prev.x, height: y - prev.y }) : null);
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    if (isDrawing && currentShape) {
      if (Math.abs(currentShape.width || 0) > 5 || Math.abs(currentShape.height || 0) > 5) {
        if (selectedTool === 'crop') setCropRect(currentShape);
        else setShapes(prev => [...prev, currentShape]);
      }
    }
    setIsDrawing(false);
    setCurrentShape(null);
  };

  const applyCrop = () => {
    if (!cropRect || !bgImage || !canvasRef.current) return;
    const placement = getImagePlacement();
    if (!placement) return;

    const cX = cropRect.width! < 0 ? cropRect.x + cropRect.width! : cropRect.x;
    const cY = cropRect.height! < 0 ? cropRect.y + cropRect.height! : cropRect.y;
    const cW = Math.abs(cropRect.width || 0);
    const cH = Math.abs(cropRect.height || 0);

    const sourceX = (cX - placement.x) / placement.scale;
    const sourceY = (cY - placement.y) / placement.scale;
    const sourceW = cW / placement.scale;
    const sourceH = cH / placement.scale;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceW;
    tempCanvas.height = sourceH;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.drawImage(bgImage, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

    const newImg = new Image();
    newImg.src = tempCanvas.toDataURL();
    newImg.onload = () => {
      setBgImage(newImg);
      setShapes([]);
      setCropRect(null);
      setSelectedTool('select');
    };
  };

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const canvas = canvasRef.current;
      if (!canvas || !bgImage) return canvas?.toDataURL('image/png') || null;

      const placement = getImagePlacement();
      if (!placement) return canvas.toDataURL('image/png');

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = bgImage.width;
      exportCanvas.height = bgImage.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return canvas.toDataURL('image/png');

      ctx.drawImage(bgImage, 0, 0);

      const scaleFactor = 1 / placement.scale;

      shapes.forEach(shape => {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.strokeWidth * scaleFactor;
        ctx.lineCap = 'round';
        ctx.beginPath();

        const relX = (shape.x - placement.x) * scaleFactor;
        const relY = (shape.y - placement.y) * scaleFactor;
        const relW = (shape.width || 0) * scaleFactor;
        const relH = (shape.height || 0) * scaleFactor;

        if (shape.type === 'rect') {
          ctx.strokeRect(relX, relY, relW, relH);
        } else if (shape.type === 'circle') {
          const radius = Math.sqrt(Math.pow(relW, 2) + Math.pow(relH, 2));
          ctx.arc(relX, relY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shape.type === 'arrow') {
          const headlen = (15 + (shape.strokeWidth * 1.5)) * scaleFactor;
          const toX = relX + relW;
          const toY = relY + relH;
          const angle = Math.atan2(toY - relY, toX - relX);

          ctx.moveTo(relX, relY);
          ctx.lineTo(toX, toY);
          ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        } else if (shape.type === 'line') {
          const toX = relX + relW;
          const toY = relY + relH;
          ctx.moveTo(relX, relY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
        }
      });

      return exportCanvas.toDataURL('image/png');
    }
  }));

  if (!initialImage) {
    return (
      <div className="w-full h-full min-h-[200px] bg-slate-50  border-2 border-dashed border-slate-200  rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-4">
        <MapIcon size={48} className="opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">Sila Pilih Imej</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white  rounded-3xl overflow-hidden border border-slate-200  shadow-sm relative">
      {!isMobile && (
        <div className="bg-slate-50  p-3 border-b border-slate-200  flex flex-wrap gap-2 items-center justify-between z-10">
          <div className="flex gap-1 items-center">
            <ToolBtn active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} icon={<MousePointer2 size={16} />} title="View" />
            <div className="w-px h-5 bg-slate-300  mx-1" />
            <ToolBtn active={selectedTool === 'crop'} onClick={() => setSelectedTool('crop')} icon={<Crop size={16} />} title="Crop Area" />
            <div className="w-px h-5 bg-slate-300  mx-1" />
            <ToolBtn active={selectedTool === 'rect'} onClick={() => setSelectedTool('rect')} icon={<Square size={16} />} title="Rectangle" />
            <ToolBtn active={selectedTool === 'circle'} onClick={() => setSelectedTool('circle')} icon={<Circle size={16} />} title="Circle" />
            <ToolBtn active={selectedTool === 'line'} onClick={() => setSelectedTool('line')} icon={<Minus size={16} />} title="Line" />
            <ToolBtn active={selectedTool === 'arrow'} onClick={() => setSelectedTool('arrow')} icon={<MoveUpRight size={16} />} title="Arrow" />
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="range" min="1" max="15" value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-25 accent-emerald-500 cursor-pointer"
            />
            <div className="flex gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`w-4 h-4 rounded-full border border-white/20 ${selectedColor === c ? 'ring-2 ring-emerald-500' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>
            <div className="w-px h-5 bg-slate-300  mx-1" />
            <button onClick={() => setShapes(prev => prev.slice(0, -1))} className="p-1.5 hover:bg-slate-200  rounded transition-colors"><Undo size={16} /></button>
            <button onClick={() => setShapes([])} className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>
      )}

      {!isMobile && selectedTool === 'crop' && cropRect && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white  shadow-xl border border-slate-200  p-2 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <button onClick={applyCrop} className="bg-emerald-500 text-white p-1.5 rounded-xl hover:bg-emerald-600 transition-colors"><Check size={18} /></button>
          <button onClick={() => { setCropRect(null); setSelectedTool('select'); }} className="bg-red-500 text-white p-1.5 rounded-xl hover:bg-red-600 transition-colors"><X size={18} /></button>
        </div>
      )}

      <div ref={containerRef} className={`flex-1 relative bg-slate-100  overflow-hidden ${!isMobile ? 'cursor-crosshair' : ''}`}>
        <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="block" />
      </div>
    </div>
  );
});

const ToolBtn = ({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) => (
  <button
    onClick={onClick} title={title}
    className={`p-2 rounded-xl transition-colors ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
  >

    {icon}
  </button>
);

// --- MAIN PAGE ---

const ImageReportGenerator: React.FC<{ projects: Project[], user: User }> = ({ projects, user }) => {
  const { users: allUsers } = useUsers();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus.FASA_DRAF | ProjectStatus.MENUNGGU_LANTIKAN>('ALL');
  const [complaints, setComplaints] = useState<ComplaintRow[]>([{ id: '1', location: '', description: '' }]);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [siteImages, setSiteImages] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- TEMPORARY GALLERY STATE (React Query) ---
  const {
    galleryImages,
    isUploading,
    uploadImage,
    deleteImage
  } = useTemporaryGallery();

  const [gallerySearch, setGallerySearch] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [tagLocation, setTagLocation] = useState('');
  const editorRef = useRef<CanvasMapEditorRef>(null);
  const modalEditorRef = useRef<CanvasMapEditorRef>(null);
  const fileInputMapRef = useRef<HTMLInputElement>(null);
  const fileInputSiteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGalleryDelete = async (img: TemporaryImage) => {
    if (!confirm("Padam gambar ini?")) return;
    try {
      await deleteImage({ id: img.id, imageUrl: img.imageUrl });
    } catch (e) {
      alert("Gagal memadam gambar.");
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage({
        file,
        userId: user.id,
        userFullName: user.fullName,
        projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
        location: tagLocation
      });
      setTagLocation('');
      e.target.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      alert("Gagal memuat naik gambar.");
    }
  };

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const expiry = created + (24 * 60 * 60 * 1000);
    const now = new Date().getTime();
    const diff = expiry - now;

    if (diff <= 0) return "Tamat Tempoh";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours} Jam ${minutes} Minit`;
  };

  const filteredGallery = useMemo(() => {
    return galleryImages.filter(img => {
      // Role filtering
      const isOwner = img.userId === user.id;
      const isAdminType = [Role.ADMIN, Role.JURUTERA].includes(user.role);

      if (!isOwner && !isAdminType) return false;

      // Time filtering (hide if > 24h)
      const created = new Date(img.createdAt).getTime();
      const expiry = created + (24 * 60 * 60 * 1000);
      if (new Date().getTime() > expiry) return false;

      if (!gallerySearch) return true;
      const q = gallerySearch.toLowerCase();
      return (
        img.userFullName.toLowerCase().includes(q) ||
        (img.locationTag?.toLowerCase() || '').includes(q)
      );
    });
  }, [galleryImages, user, gallerySearch]);

  // Helper for processing image results
  const processImageData = (res: string, type: 'map' | 'site') => {
    if (type === 'map') {
      setMapImage(res);
    } else {
      setSiteImages(prev => {
        const next = [...prev, res].slice(0, 4);
        if (next.length === 2) setLayout('horizontal');
        if (next.length === 3) setLayout('big-left');
        return next;
      });
    }
  };

  // Global Paste Listener
  useEffect(() => {
    const globalPasteHandler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (currentStep === 2) processImageData(res, 'map');
              else if (currentStep === 3) processImageData(res, 'site');
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', globalPasteHandler);
    return () => window.removeEventListener('paste', globalPasteHandler);
  }, [currentStep]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (user.role === Role.PJA && p.pjaId !== user.id) return false;

      const allowedStatuses = [
        ProjectStatus.FASA_DRAF,
        ProjectStatus.MENUNGGU_LANTIKAN
      ];
      if (!allowedStatuses.includes(p.status)) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (p.namaProjek?.toLowerCase() || '').includes(q) || (p.noFail?.toLowerCase() || '').includes(q);
    });
  }, [projects, searchQuery, user, statusFilter]);

  const selectProject = (proj: Project) => {
    setSelectedProjectId(proj.id.toString());
    if (proj.projectLocations?.length) {
      setComplaints(proj.projectLocations.map(l => ({
        id: l.id || Math.random().toString(),
        location: l.lokasi,
        description: l.aduan
      })));
    } else {
      setComplaints([{ id: '1', location: proj.lokasi || '', description: proj.aduan || '' }]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'map' | 'site') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        processImageData(res, type);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const processedMap = editorRef.current?.exportImage();
      await generatePDF({
        complaints,
        mapImageBase64: processedMap || mapImage,
        siteImagesBase64: siteImages,
        layout
      });
    } catch (e) {
      alert("Gagal menjana PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const saveEditedImage = () => {
    if (editingImageIndex !== null && modalEditorRef.current) {
      const newImg = modalEditorRef.current.exportImage();
      if (newImg) {
        const newImages = [...siteImages];
        newImages[editingImageIndex] = newImg;
        setSiteImages(newImages);
      }
    }
    setEditingImageIndex(null);
  };

  const saveEditedMap = () => {
    if (isEditingMap && modalEditorRef.current) {
      const newImg = modalEditorRef.current.exportImage();
      if (newImg) {
        setMapImage(newImg);
      }
    }
    setIsEditingMap(false);
  };

  const handleReset = () => {
    if (confirm('Padam semua data dan mula semula?')) {
      setCurrentStep(1);
      setSelectedProjectId('');
      setComplaints([{ id: '1', location: '', description: '' }]);
      setMapImage(null);
      setSiteImages([]);
      setSearchQuery('');
    }
  };

  const handleNextStep2 = () => {
    if (editorRef.current) {
      const processedMap = editorRef.current.exportImage();
      if (processedMap) {
        setMapImage(processedMap);
      }
    }
    setCurrentStep(3);
  };

  const steps = [
    { id: 1, label: 'Maklumat Projek', icon: <Briefcase size={16} /> },
    { id: 2, label: 'Pelan Lokasi', icon: <MapIcon size={16} /> },
    { id: 3, label: 'Gambar Tapak', icon: <ImageIcon size={16} /> },
    { id: 4, label: 'Eksport PDF', icon: <FileDown size={16} /> },
  ];

  return (
    <div className={`flex flex-col gap-4 md:gap-6 animate-fade-in pb-12`}>

      {/* Header & Gallery Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 ">Penjana Laporan Bergambar</h1>
          <p className="text-slate-500 ">Sediakan laporan bergambar dengan mudah dan pantas.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGallery(!showGallery)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${showGallery
              ? 'bg-slate-900 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
          >
            <History size={20} />
            {showGallery ? 'Tutup Galeri' : 'Galeri Sementara'}
            {galleryImages.length > 0 && !showGallery && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                {user.role === Role.PJA
                  ? galleryImages.filter(i => i.userId === user.id).length
                  : galleryImages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Temporary Gallery Section */}
      {showGallery && (
        <div className="bg-white  p-6 rounded-3xl border border-emerald-100  shadow-xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-800 ">
                <Clock className="text-emerald-500" />
                Galeri Sementara (24 Jam)
              </h2>
              <p className="text-sm text-slate-500">Imej akan dipadam secara automatik selepas 24 jam. Gunakan untuk pindah imej dari telefon ke PC.</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Carian pengirim/lokasi..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200  rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Bar */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-6 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
            <div className="relative flex-1 min-w-0">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tag Lokasi (cth: Jalan 1/1, Taman Desa)"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={tagLocation}
                onChange={(e) => setTagLocation(e.target.value)}
              />
            </div>
            {isUploading ? (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm shrink-0">
                <RefreshCw className="animate-spin" size={16} />
                Memuat naik...
              </div>
            ) : (
              <label className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 shrink-0">
                <Upload size={16} />
                Muat Naik
                <input type="file" className="hidden" accept="image/*" onChange={handleGalleryUpload} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredGallery.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                <p>Tiada gambar dalam galeri.</p>
              </div>
            ) : (
              filteredGallery.map((img) => (
                <div key={img.id} className="group relative aspect-square bg-slate-100  rounded-2xl overflow-hidden border border-slate-200  hover:shadow-lg transition-all">
                  <img src={img.imageUrl} alt="Temp" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white flex items-center gap-1 font-medium">
                    <Clock size={10} />
                    {getTimeRemaining(img.createdAt)}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => {
                        if (currentStep === 2) { setMapImage(img.imageUrl); }
                        else if (currentStep === 3) { processImageData(img.imageUrl, 'site'); }
                        else { alert("Sila pilih langkah pertama/kedua dahulu."); }
                      }}
                      className="w-full h-full absolute inset-0 bg-transparent cursor-pointer z-10"
                    >
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGalleryDelete(img); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors z-20 shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {/* Info Bar - Solid Titlebar Style */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-slate-900/95 text-white border-t border-white/10 backdrop-blur-sm">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[11px] font-black uppercase tracking-tight truncate leading-tight text-white/90">
                        {user.role === Role.PJA
                          ? ''
                          : `PJA ${(allUsers.find(u => u.id === img.userId)?.username || img.userFullName || '').toUpperCase()}`}
                      </div>
                      {img.locationTag && (
                        <div className="flex items-start gap-1.5 text-emerald-400 pt-0.5">
                          <MapPin size={14} strokeWidth={3} className="shrink-0 mt-[3px]" />
                          <span className="text-[13px] font-bold leading-tight break-words text-wrap">{img.locationTag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="shrink-0 bg-white  rounded-3xl p-2 shadow-sm border border-slate-100  flex items-center justify-between">
        <div className="flex items-center gap-1 md:gap-4 overflow-x-auto no-scrollbar px-2 py-1">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all shrink-0 ${currentStep === s.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : currentStep > s.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === s.id ? 'bg-white text-emerald-600' : currentStep > s.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {currentStep > s.id ? <Check size={14} strokeWidth={3} /> : s.id}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{s.label}</span>
              </div>
              {idx < steps.length - 1 && <div className={`h-px w-4 md:w-8 ${currentStep > s.id ? 'bg-emerald-200' : 'bg-slate-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2 pr-2">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Undo size={20} />
            </button>
          )}
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Mula Semula"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col min-h-0">

        {/* Step 1: Maklumat Projek */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Project List */}
              <div className="lg:col-span-4 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                    <Search size={16} className="text-emerald-500" /> Pilih Projek
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text" placeholder="Cari Projek / No Fail..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all text-xs font-bold"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setStatusFilter(ProjectStatus.FASA_DRAF)}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === ProjectStatus.FASA_DRAF ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Draf
                      </button>
                      <button
                        onClick={() => setStatusFilter(ProjectStatus.MENUNGGU_LANTIKAN)}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === ProjectStatus.MENUNGGU_LANTIKAN ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Lantikan
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[600px] p-2 custom-scrollbar">
                  <div className="flex flex-col gap-2">
                    {filteredProjects.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiada Projek Ditemui</p>
                      </div>
                    ) : (
                      filteredProjects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => selectProject(p)}
                          className={`p-4 rounded-2xl text-left transition-all border ${selectedProjectId === p.id.toString() ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[13px] font-black px-3 py-1 rounded-md bg-white border border-slate-100 text-slate-500">{p.noFail || 'TIADA NO FAIL'}</span>
                            <div className={`w-3 h-3 rounded-full mt-1 ${p.status === ProjectStatus.FASA_DRAF ? 'bg-slate-300' : 'bg-yellow-400'}`} />
                          </div>
                          <p className={`text-[15px] font-black uppercase leading-tight ${selectedProjectId === p.id.toString() ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {p.namaProjek}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Location Table */}
              <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Senarai Lokasi & Aduan</h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sahkan lokasi dan aduan untuk laporan</p>
                  </div>
                  <button
                    onClick={() => setComplaints([...complaints, { id: Date.now().toString(), location: '', description: '' }])}
                    className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[600px] p-4 custom-scrollbar">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">Bil</th>
                        <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi</th>
                        <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aduan</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {complaints.map((row, idx) => (
                        <tr key={row.id} className="group">
                          <td className="px-4 py-3 text-center text-[10px] font-black text-slate-300">{idx + 1}</td>
                          <td className="px-2 py-3">
                            <input
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                              value={row.location}
                              onChange={e => setComplaints(complaints.map(c => c.id === row.id ? { ...c, location: e.target.value } : c))}
                              placeholder="CONTOH: JALAN 1/1, TAMAN DESA"
                            />
                          </td>
                          <td className="px-2 py-3">
                            <input
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-medium uppercase text-slate-600 focus:ring-2 focus:ring-emerald-500"
                              value={row.description}
                              onChange={e => setComplaints(complaints.map(c => c.id === row.id ? { ...c, description: e.target.value } : c))}
                              placeholder="CONTOH: KERJA-KERJA MENURAP JALAN"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {complaints.length > 1 && (
                              <button onClick={() => setComplaints(complaints.filter(c => c.id !== row.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-[8px] font-black uppercase tracking-widest">
                    <AlertTriangle size={12} /> Data Tidak Akan Simpan
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedProjectId && complaints[0].location === ''}
                    className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    Seterusnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pelan Lokasi */}
        {currentStep === 2 && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Pelan Lokasi</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Muat naik & lukis tanda pada pelan</p>
              </div>
              {!mapImage ? (
                <button
                  onClick={() => fileInputMapRef.current?.click()}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
                >
                  Muat Naik Imej
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingMap(true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100">
                    <Maximize2 size={18} />
                  </button>
                  <button onClick={() => setMapImage(null)} className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-100 transition-all border border-red-100 uppercase tracking-widest">
                    Padam
                  </button>
                </div>
              )}
            </div>
            <div className="h-[600px] p-6 bg-slate-50/30">
              <CanvasMapEditor ref={editorRef} initialImage={mapImage} isMobile={isMobile} />
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setCurrentStep(1)} className="px-8 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Kembali</button>
              <button onClick={handleNextStep2} className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Seterusnya</button>
            </div>
            <input ref={fileInputMapRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'map')} />
          </div>
        )}

        {/* Step 3: Gambar Tapak */}
        {currentStep === 3 && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Gambar Tapak ({siteImages.length}/4)</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pilih sehingga 4 gambar tapak</p>
              </div>

              <div className="flex items-center gap-3">
                {siteImages.length >= 2 && (
                  <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
                    {siteImages.length === 2 && (
                      <>
                        <button onClick={() => setLayout('horizontal')} className={`p-2 rounded-lg ${layout === 'horizontal' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}><Columns size={16} /></button>
                        <button onClick={() => setLayout('vertical')} className={`p-2 rounded-lg ${layout === 'vertical' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}><Rows size={16} /></button>
                      </>
                    )}
                    {siteImages.length === 3 && (
                      <>
                        <button onClick={() => setLayout('big-left')} className={`p-2 rounded-lg ${layout === 'big-left' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}><LayoutTemplate size={16} className="-rotate-90" /></button>
                        <button onClick={() => setLayout('big-top')} className={`p-2 rounded-lg ${layout === 'big-top' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}><LayoutTemplate size={16} /></button>
                      </>
                    )}
                  </div>
                )}
                {siteImages.length < 4 && (
                  <button
                    onClick={() => fileInputSiteRef.current?.click()}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest"
                  >
                    Tambah Gambar
                  </button>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50/30">
              {siteImages.length === 0 ? (
                <div
                  onClick={() => fileInputSiteRef.current?.click()}
                  className="w-full h-96 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 gap-4 hover:bg-white hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <ImageIcon size={40} className="opacity-20 group-hover:text-emerald-500 group-hover:opacity-100 transition-all" />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs">Klik untuk muat naik gambar tapak</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {siteImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-[2rem] overflow-hidden bg-white border-4 border-white shadow-md hover:shadow-xl transition-all">
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                        <button onClick={() => setEditingImageIndex(idx)} className="p-3 bg-white text-emerald-600 rounded-2xl hover:scale-110 transition-transform shadow-xl"><Pencil size={20} /></button>
                        <button onClick={() => setSiteImages(siteImages.filter((_, i) => i !== idx))} className="p-3 bg-white text-red-600 rounded-2xl hover:scale-110 transition-transform shadow-xl"><Trash2 size={20} /></button>
                      </div>
                      <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg">#{idx + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setCurrentStep(2)} className="px-8 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Kembali</button>
              <button onClick={() => setCurrentStep(4)} className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Seterusnya</button>
            </div>
            <input ref={fileInputSiteRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'site')} />
          </div>
        )}

        {/* Step 4: Eksport */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-500 py-8">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-emerald-600 p-12 text-center text-white relative">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                  <FileText className="absolute -top-10 -right-10 w-64 h-64 rotate-12" />
                </div>
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                  <Check size={48} strokeWidth={3} />
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Laporan Sedia Dihasilkan</h3>
                  <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs opacity-80">Sila semak maklumat di bawah sebelum eksport</p>
                </div>
                <div className="p-10 flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Projek</p>
                      <p className="text-sm font-black text-slate-800 uppercase truncate">
                        {projects.find(p => p.id.toString() === selectedProjectId)?.namaProjek || 'TIADA PROJEK DIPILIH'}
                      </p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Lokasi</p>
                      <p className="text-sm font-black text-slate-800">{complaints.length} LOKASI</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mapImage ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <MapIcon size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Pelan Lokasi</p>
                      <p className="text-[10px] font-bold text-emerald-700/60 uppercase">{mapImage ? 'IMEJ SEDIA' : 'TIADA IMEJ'}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${siteImages.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <ImageIcon size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Gambar Tapak</p>
                      <p className="text-[10px] font-bold text-blue-700/60 uppercase">{siteImages.length} IMEJ SEDIA</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-600/40 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-4"
                    >
                      {isExporting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileDown className="w-6 h-6" />}
                      Eksport PDF Laporan
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="w-full py-4 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]"
                    >
                      Kembali Untuk Suntingan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Image Modal */}
      {editingImageIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Gambar Tapak #{editingImageIndex + 1}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gunakan alat suntingan di bawah</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEditingImageIndex(null)} className="px-8 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">Batal</button>
                <button onClick={saveEditedImage} className="px-10 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Simpan</button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-8 overflow-hidden flex items-center justify-center">
              <CanvasMapEditor ref={modalEditorRef} initialImage={siteImages[editingImageIndex]} isMobile={false} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Map Modal */}
      {isEditingMap && mapImage && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900 animate-fade-in">
          <div className="bg-white w-full h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Pelan Lokasi</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Laras semula kedudukan atau tambah penanda</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsEditingMap(false)} className="px-8 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">Batal</button>
                <button onClick={saveEditedMap} className="px-10 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Simpan</button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-8 overflow-hidden">
              <CanvasMapEditor ref={modalEditorRef} initialImage={mapImage} isMobile={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageReportGenerator;