import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Project, User, Role, ProjectStatus } from '../types';
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
  RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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

const processImageForPdf = (base64: string, widthMm: number, heightMm: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const density = 8; 
      const reqW = Math.floor(widthMm * density);
      const reqH = Math.floor(heightMm * density);
      
      const canvas = document.createElement('canvas');
      canvas.width = reqW;
      canvas.height = reqH;
      const ctx = canvas.getContext('2d');
      if(!ctx) { resolve(base64); return; }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, reqW, reqH);

      const imgRatio = img.width / img.height;
      const reqRatio = reqW / reqH;
      
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

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN BERGAMBAR', pageWidth / 2, 15, { align: 'center' });

  let currentY = 18;
  const col1Width = 10;
  const col2Width = 80;
  const col3Width = contentWidth - col1Width - col2Width;

  doc.setFontSize(8);
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
  const rowHeight = 5;
  
  complaints.forEach((row, index) => {
    doc.rect(margin, currentY, col1Width, rowHeight, 'S');
    doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'S');
    doc.rect(margin + col1Width + col2Width, currentY, col3Width, rowHeight, 'S');

    doc.text((index + 1).toString(), margin + 2, currentY + 3.2);
    doc.text(row.location.toUpperCase(), margin + col1Width + 2, currentY + 3.2);
    doc.text(row.description.toUpperCase(), margin + col1Width + col2Width + 2, currentY + 3.2);

    currentY += rowHeight;
  });

  currentY += 5;

  const bottomMargin = 10;
  const availableHeight = pageHeight - currentY - bottomMargin;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PELAN LOKASI', margin, currentY + 4);
  
  const mapBoxY = currentY + 6;
  const mapBoxHeight = availableHeight - 6;
  const mapBoxWidth = (contentWidth / 2) - 2;

  doc.setDrawColor(0);
  doc.rect(margin, mapBoxY, mapBoxWidth, mapBoxHeight);

  if (mapImageBase64) {
    try {
      const processedMap = await processImageForPdf(mapImageBase64, mapBoxWidth, mapBoxHeight);
      doc.addImage(processedMap, 'JPEG', margin, mapBoxY, mapBoxWidth, mapBoxHeight);
    } catch (e) {
      console.error("Map image error", e);
    }
  }

  const rightStartX = margin + mapBoxWidth + 4;
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('GAMBAR TAPAK', rightStartX, currentY + 4);

  const gridBoxY = mapBoxY;
  const gridBoxWidth = mapBoxWidth;
  const gridBoxHeight = mapBoxHeight;

  interface ImageBox { x: number, y: number, w: number, h: number, img: string }
  const tasks: ImageBox[] = [];
  const count = siteImagesBase64.length;
  const gap = 2;

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
        const processedImg = await processImageForPdf(t.img, t.w, t.h);
        doc.addImage(processedImg, 'JPEG', t.x, t.y, t.w, t.h);
    } catch(e) {
        console.error("Err", e);
    }
  }

  doc.save(`Laporan_Bergambar_${new Date().toISOString().split('T')[0]}.pdf`);
};

// --- COMPONENTS ---

interface CanvasMapEditorProps {
  initialImage: string | null;
}

export interface CanvasMapEditorRef {
  exportImage: () => string | null;
}

const CanvasMapEditor = forwardRef<CanvasMapEditorRef, CanvasMapEditorProps>(({ initialImage }, ref) => {
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
      img.src = initialImage;
      img.onload = () => setBgImage(img);
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
    if (selectedTool === 'select' || !bgImage) return;
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
    if (!isDrawing || !currentShape) return;
    const { x, y } = getMousePos(e);
    setCurrentShape(prev => prev ? ({ ...prev, width: x - prev.x, height: y - prev.y }) : null);
  };

  const handleMouseUp = () => {
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
    exportImage: () => canvasRef.current?.toDataURL('image/png') || null
  }));

  if (!initialImage) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-4">
        <MapIcon size={48} className="opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">Sila Pilih Imej</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center justify-between z-10">
        <div className="flex gap-1 items-center">
          <ToolBtn active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} icon={<MousePointer2 size={16} />} title="View" />
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />
          <ToolBtn active={selectedTool === 'crop'} onClick={() => setSelectedTool('crop')} icon={<Crop size={16} />} title="Crop Area" />
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />
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
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />
          <button onClick={() => setShapes(prev => prev.slice(0, -1))} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"><Undo size={16}/></button>
          <button onClick={() => setShapes([])} className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded transition-colors"><Trash2 size={16}/></button>
        </div>
      </div>

      {selectedTool === 'crop' && cropRect && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-2 rounded-2xl animate-in fade-in slide-in-from-top-2">
           <button onClick={applyCrop} className="bg-emerald-500 text-white p-1.5 rounded-xl hover:bg-emerald-600 transition-colors"><Check size={18}/></button>
           <button onClick={() => { setCropRect(null); setSelectedTool('select'); }} className="bg-red-500 text-white p-1.5 rounded-xl hover:bg-red-600 transition-colors"><X size={18}/></button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-crosshair">
        <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="block" />
      </div>
    </div>
  );
});

const ToolBtn = ({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) => (
  <button
    onClick={onClick} title={title}
    className={`p-2 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'}`}
  >
    {icon}
  </button>
);

// --- MAIN PAGE ---

const ImageReportGenerator: React.FC<{ projects: Project[], user: User }> = ({ projects, user }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState<ComplaintRow[]>([{ id: '1', location: '', description: '' }]);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [siteImages, setSiteImages] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const editorRef = useRef<CanvasMapEditorRef>(null);
  const modalEditorRef = useRef<CanvasMapEditorRef>(null);
  const fileInputMapRef = useRef<HTMLInputElement>(null);
  const fileInputSiteRef = useRef<HTMLInputElement>(null);

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

  // Global Paste Listener for convenience (Hidden Feature: Ctrl+V)
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
              // Logic: If map is empty, go to map. Otherwise go to site images.
              if (!mapImage) processImageData(res, 'map');
              else processImageData(res, 'site');
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', globalPasteHandler);
    return () => window.removeEventListener('paste', globalPasteHandler);
  }, [mapImage]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (user.role === Role.PJA && p.pjaId !== user.id) return false;
      const excludedStatuses = [
        ProjectStatus.PEMERIKSAAN_TAPAK,
        ProjectStatus.TUNTUTAN_BAYARAN,
        ProjectStatus.SIAP
      ];
      if (excludedStatuses.includes(p.status)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (p.namaProjek?.toLowerCase() || '').includes(q) || (p.noFail?.toLowerCase() || '').includes(q);
    });
  }, [projects, searchQuery, user]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    
    const proj = projects.find(p => p.id.toString() === projectId);
    if (proj) {
      if (proj.projectLocations?.length) {
        setComplaints(proj.projectLocations.map(l => ({
          id: l.id || Math.random().toString(),
          location: l.lokasi,
          description: l.aduan
        })));
      } else {
        setComplaints([{ id: '1', location: proj.lokasi || '', description: proj.aduan || '' }]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'map' | 'site') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (type === 'map') setMapImage(res);
        else setSiteImages(prev => {
           const next = [...prev, res].slice(0, 4);
           if (next.length === 2) setLayout('horizontal');
           if (next.length === 3) setLayout('big-left');
           return next;
        });
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

  return (
    <div className="flex flex-col h-full gap-8 animate-fade-in-up custom-scrollbar overflow-y-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Briefcase className="w-10 h-10 text-emerald-600" />
            Laporan Bergambar
          </h1>
          <p className="text-slate-500 font-medium mt-1 ml-14 uppercase tracking-widest text-[10px]">Lampiran Cadangan Kerja</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => confirm('Padam semua data dan mula semula?') && window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
           >
            <RefreshCw className="w-4 h-4" /> Reset
           </button>
           <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
             Eksport PDF
           </button>
        </div>
      </div>

      {/* Project Section (Table & Details) */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
             <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
               <Briefcase size={24} />
             </div>
             <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Maklumat Projek & Lokasi</h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Projek Untuk Import Data Secara Automatik</p>
             </div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4 flex-1 max-w-4xl justify-end">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" placeholder="Cari..."
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm dark:text-white shadow-inner border border-slate-100 dark:border-slate-700"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="w-full md:w-96 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs appearance-none cursor-pointer dark:text-white font-bold shadow-sm border border-slate-100 dark:border-slate-700 truncate"
                value={selectedProjectId} onChange={handleProjectChange}
              >
                <option value="">-- PILIH PROJEK --</option>
                {filteredProjects.map(p => (
                  <option key={p.id} value={p.id}>
                     {p.noFail ? `[${p.noFail}] ` : ''}{p.namaProjek}
                  </option>
                ))}
              </select>
           </div>
        </div>

        <div className="p-8">
           <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">Bil</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Lokasi</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aduan</th>
                      <th className="px-6 py-4 w-20"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {complaints.map((row, idx) => (
                      <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-center font-black text-slate-300 dark:text-slate-600">{idx + 1}</td>
                        <td className="px-4 py-4">
                           <input 
                              placeholder="TAIP LOKASI..."
                              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 uppercase dark:text-white"
                              value={row.location}
                              onChange={e => setComplaints(complaints.map(c => c.id === row.id ? { ...c, location: e.target.value } : c))}
                           />
                        </td>
                        <td className="px-4 py-4">
                           <input 
                              placeholder="TAIP ADUAN..."
                              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 uppercase dark:text-white text-slate-600 dark:text-slate-300"
                              value={row.description}
                              onChange={e => setComplaints(complaints.map(c => c.id === row.id ? { ...c, description: e.target.value } : c))}
                           />
                        </td>
                        <td className="px-6 py-4 text-right">
                           {complaints.length > 1 && (
                              <button 
                                onClick={() => setComplaints(complaints.filter(c => c.id !== row.id))}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                              >
                                 <Trash2 size={16} />
                              </button>
                           )}
                        </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
           <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={() => setComplaints([...complaints, { id: Date.now().toString(), location: '', description: '' }])}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-widest"
              >
                <Plus size={16} /> Tambah
              </button>
              
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-500 rounded-2xl text-[10px] border border-amber-100 dark:border-amber-900/30 font-black uppercase tracking-widest">
                 <AlertTriangle size={14} />
                 Data Tidak Akan Simpan
              </div>
           </div>
        </div>
      </section>

      {/* Editor Section (Map & Site Images) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[1200px]">
        
        {/* Map Editor */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-tight">
               <MapIcon className="text-emerald-500" size={20} />
               Pelan Lokasi
            </h2>
            {!mapImage ? (
              <button 
                onClick={() => fileInputMapRef.current?.click()} 
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
              >
                Muat Naik
              </button>
            ) : (
              <button onClick={() => setMapImage(null)} className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100 uppercase tracking-widest">Padam</button>
            )}
          </div>
          <div className="flex-1 p-6">
             <CanvasMapEditor ref={editorRef} initialImage={mapImage} />
          </div>
          <input ref={fileInputMapRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'map')}/>
        </section>

        {/* Site Images */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <h2 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-tight">
                   <ImageIcon className="text-blue-500" size={20} />
                   Gambar Tapak
                </h2>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest">{siteImages.length} / 4</span>
              </div>
              
              <div className="flex items-center gap-3">
                {siteImages.length === 2 && (
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                     <button onClick={() => setLayout('horizontal')} className={`p-2 rounded-lg ${layout === 'horizontal' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-400'}`} title="Side by Side"><Columns size={16}/></button>
                     <button onClick={() => setLayout('vertical')} className={`p-2 rounded-lg ${layout === 'vertical' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-400'}`} title="Stacked"><Rows size={16}/></button>
                   </div>
                )}
                {siteImages.length === 3 && (
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                     <button onClick={() => setLayout('big-left')} className={`p-2 rounded-lg ${layout === 'big-left' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-400'}`} title="Large Left"><LayoutTemplate size={16} className="-rotate-90"/></button>
                     <button onClick={() => setLayout('big-top')} className={`p-2 rounded-lg ${layout === 'big-top' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-400'}`} title="Large Top"><LayoutTemplate size={16}/></button>
                   </div>
                )}
                {siteImages.length < 4 && (
                  <button 
                    onClick={() => fileInputSiteRef.current?.click()} 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest"
                  >
                    Tambah Foto
                  </button>
                )}
              </div>
           </div>

           <div className="flex-1 p-8">
              {siteImages.length === 0 ? (
                <div className="w-full h-full min-h-[400px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-4">
                  <ImageIcon size={64} className="opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Sila Pilih Imej Tapak</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 h-fit">
                   {siteImages.map((img, idx) => (
                     <div key={idx} className="relative group aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-sm">
                        <img src={img} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-sm">
                           <button onClick={() => setEditingImageIndex(idx)} className="p-4 bg-white text-blue-600 rounded-[1.25rem] hover:scale-110 transition-transform shadow-xl"><Pencil size={24} /></button>
                           <button onClick={() => setSiteImages(siteImages.filter((_, i) => i !== idx))} className="p-4 bg-white text-red-600 rounded-[1.25rem] hover:scale-110 transition-transform shadow-xl"><Trash2 size={24} /></button>
                        </div>
                        <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-black px-3 py-1.5 rounded-xl">#{idx + 1}</div>
                     </div>
                   ))}
                </div>
              )}
           </div>
           <input ref={fileInputSiteRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'site')} />
        </section>
      </div>

      {/* Edit Image Modal */}
      {editingImageIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Gambar Tapak #{editingImageIndex + 1}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gunakan Alat Crop & Anotasi Di Bawah</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEditingImageIndex(null)} className="px-8 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-xs">Batal</button>
                <button onClick={saveEditedImage} className="px-10 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">Simpan Perubahan</button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 overflow-hidden flex items-center justify-center">
               <CanvasMapEditor ref={modalEditorRef} initialImage={siteImages[editingImageIndex]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageReportGenerator;