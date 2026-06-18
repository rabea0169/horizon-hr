import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileUp, Grid3X3, ZoomIn, ZoomOut, RotateCcw, Move,
  Ruler, Layers, Eye, Download, Shapes,
  ArrowUpDown, Maximize2, FileText
} from "lucide-react";

/** Parsed DXF entity */
interface DxfEntity {
  type: "line" | "polyline" | "circle" | "arc" | "text" | "point";
  x1?: number; y1?: number;
  x2?: number; y2?: number;
  cx?: number; cy?: number;
  r?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  layer?: string;
  color?: string;
}

/** Marker piece layout */
interface MarkerPiece {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  quantity: number;
  color: string;
}

export default function CADViewer() {
  // ── State ──
  const [entities, setEntities] = useState<DxfEntity[]>([]);
  const [markerPieces, setMarkerPieces] = useState<MarkerPiece[]>([]);
  const [viewMode, setViewMode] = useState<"dxf" | "marker">("marker");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [fabricWidth, setFabricWidth] = useState(152); // cm
  const [markerLength, setMarkerLength] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [efficiency] = useState(82.5);
  const [layers, setLayers] = useState(25);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Demo marker data ──
  useEffect(() => {
    const demoPieces: MarkerPiece[] = [
      { id: "F-1", name: "Front", width: 52, height: 68, x: 2, y: 2, rotation: 0, quantity: 25, color: "#3B82F6" },
      { id: "B-1", name: "Back", width: 52, height: 70, x: 56, y: 2, rotation: 0, quantity: 25, color: "#EF4444" },
      { id: "S-1", name: "Sleeve-L", width: 22, height: 58, x: 110, y: 2, rotation: 0, quantity: 25, color: "#10B981" },
      { id: "S-2", name: "Sleeve-R", width: 22, height: 58, x: 134, y: 2, rotation: 0, quantity: 25, color: "#10B981" },
      { id: "N-1", name: "Neck", width: 28, height: 8, x: 2, y: 72, rotation: 0, quantity: 25, color: "#F59E0B" },
      { id: "P-1", name: "Pocket", width: 14, height: 16, x: 32, y: 72, rotation: 0, quantity: 25, color: "#8B5CF6" },
      { id: "F-2", name: "Front", width: 52, height: 68, x: 2, y: 84, rotation: 0, quantity: 25, color: "#3B82F6" },
      { id: "B-2", name: "Back", width: 52, height: 70, x: 56, y: 84, rotation: 0, quantity: 25, color: "#EF4444" },
      { id: "S-3", name: "Sleeve-L", width: 22, height: 58, x: 110, y: 84, rotation: 0, quantity: 25, color: "#10B981" },
      { id: "S-4", name: "Sleeve-R", width: 22, height: 58, x: 134, y: 84, rotation: 0, quantity: 25, color: "#10B981" },
    ];
    setMarkerPieces(demoPieces);
    setMarkerLength(158);
    setTotalPieces(demoPieces.reduce((s, p) => s + p.quantity, 0));
  }, []);

  // ── DXF Parser ──
  const parseDXF = useCallback((content: string): DxfEntity[] => {
    const lines = content.split("\n").map((l) => l.trim());
    const parsed: DxfEntity[] = [];
    let i = 0;

    while (i < lines.length) {
      const groupCode = parseInt(lines[i], 10);
      const value = lines[i + 1] || "";

      if (groupCode === 0 && value === "LINE") {
        const entity: DxfEntity = { type: "line" };
        i += 2;
        while (i < lines.length) {
          const gc = parseInt(lines[i], 10);
          const val = lines[i + 1] || "";
          if (gc === 0) break;
          if (gc === 10) entity.x1 = parseFloat(val);
          if (gc === 20) entity.y1 = parseFloat(val);
          if (gc === 11) entity.x2 = parseFloat(val);
          if (gc === 21) entity.y2 = parseFloat(val);
          i += 2;
        }
        if (entity.x1 !== undefined) parsed.push(entity);
      } else if (groupCode === 0 && value === "CIRCLE") {
        const entity: DxfEntity = { type: "circle" };
        i += 2;
        while (i < lines.length) {
          const gc = parseInt(lines[i], 10);
          const val = lines[i + 1] || "";
          if (gc === 0) break;
          if (gc === 10) entity.cx = parseFloat(val);
          if (gc === 20) entity.cy = parseFloat(val);
          if (gc === 40) entity.r = parseFloat(val);
          i += 2;
        }
        if (entity.cx !== undefined) parsed.push(entity);
      } else if (groupCode === 0 && value === "TEXT") {
        const entity: DxfEntity = { type: "text" };
        i += 2;
        while (i < lines.length) {
          const gc = parseInt(lines[i], 10);
          const val = lines[i + 1] || "";
          if (gc === 0) break;
          if (gc === 10) entity.x1 = parseFloat(val);
          if (gc === 20) entity.y1 = parseFloat(val);
          if (gc === 1) entity.text = val;
          i += 2;
        }
        if (entity.x1 !== undefined) parsed.push(entity);
      } else {
        i += 2;
      }
    }
    return parsed;
  }, []);

  // ── File upload ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".dxf")) {
      toast.error("يرجى رفع ملف DXF فقط");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parseDXF(content);
      setEntities(parsed);
      setViewMode("dxf");
      toast.success(`تم استيراد ${parsed.length} كيان من ملف DXF`);
    };
    reader.readAsText(file);
  }, [parseDXF]);

  // ── SVG rendering helpers ──
  const scale = 3 * zoom; // pixels per cm
  const svgWidth = fabricWidth * scale + 40;
  const svgHeight = Math.max(markerLength * scale + 40, 400);

  const toSvg = (x: number, y: number) => ({ sx: x * scale + 20, sy: y * scale + 20 });

  // ── Drag handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // ── Export marker as SVG ──
  const exportSVG = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marker-plan-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير ملف SVG");
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>عارض CAD</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>عرض واستيراد ملفات DXF و Marker Plans</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".dxf" className="hidden" onChange={handleFileUpload} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={14} className="ml-1" /> رفع DXF
          </Button>
          <Button size="sm" variant="outline" onClick={exportSVG}>
            <Download size={14} className="ml-1" /> تصدير SVG
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "عرض القماش", value: `${fabricWidth} cm`, icon: ArrowUpDown },
          { label: "طول الماركر", value: `${markerLength} cm`, icon: Ruler },
          { label: "عدد القطع", value: String(totalPieces), icon: Shapes },
          { label: "الكفاءة", value: `${efficiency}%`, icon: Maximize2, color: "text-green-400" },
        ].map((stat) => (
          <Card key={stat.label} className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <stat.icon size={15} className="text-white/50" />
              </div>
              <div>
                <p className="text-[10px] text-white/40">{stat.label}</p>
                <p className={`text-sm font-bold ${stat.color || "text-white/80"}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Controls Panel ── */}
        <Card className="theme-card lg:col-span-1" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">الإعدادات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View mode */}
            <div className="space-y-1">
              <Label className="text-xs text-white/50">وض العرض</Label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={viewMode === "marker" ? "default" : "outline"}
                  className={`flex-1 text-xs h-8 ${viewMode === "marker" ? "text-white" : ""}`}
                  style={viewMode === "marker" ? { background: "var(--accent-color)" } : {}}
                  onClick={() => setViewMode("marker")}
                >
                  <Layers size={12} className="ml-1" /> Marker
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "dxf" ? "default" : "outline"}
                  className={`flex-1 text-xs h-8 ${viewMode === "dxf" ? "text-white" : ""}`}
                  style={viewMode === "dxf" ? { background: "var(--accent-color)" } : {}}
                  onClick={() => setViewMode("dxf")}
                >
                  <FileText size={12} className="ml-1" /> DXF
                </Button>
              </div>
            </div>

            {/* Fabric width */}
            <div className="space-y-1">
              <Label className="text-xs text-white/50">عرض القماش (cm)</Label>
              <Input
                type="number"
                value={fabricWidth}
                onChange={(e) => setFabricWidth(Number(e.target.value))}
                className="theme-input text-right text-sm h-8"
              />
            </div>

            {/* Layers */}
            <div className="space-y-1">
              <Label className="text-xs text-white/50">عدد الطبقات</Label>
              <Input
                type="number"
                value={layers}
                onChange={(e) => setLayers(Number(e.target.value))}
                className="theme-input text-right text-sm h-8"
              />
            </div>

            {/* Efficiency */}
            <div className="space-y-1">
              <Label className="text-xs text-white/50">كفاءة الاستخدام (%)</Label>
              <div className="h-6 rounded-full overflow-hidden bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${efficiency}%`, background: efficiency > 80 ? "#22c55e" : efficiency > 60 ? "#f59e0b" : "#ef4444" }}
                >
                  <span className="text-[10px] text-white font-bold">{efficiency}%</span>
                </div>
              </div>
            </div>

            {/* Zoom controls */}
            <div className="space-y-1">
              <Label className="text-xs text-white/50">التكبير</Label>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>
                  <ZoomOut size={14} />
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setZoom(1)}>
                  {zoom.toFixed(1)}x
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setZoom((z) => Math.min(5, z + 0.2))}>
                  <ZoomIn size={14} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="grid" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-pink-500" />
              <label htmlFor="grid" className="text-xs text-white/50 flex items-center gap-1">
                <Grid3X3 size={12} /> إظهار الشبكة
              </label>
            </div>

            <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}>
              <RotateCcw size={12} className="ml-1" /> إعادة ضبط العرض
            </Button>

            {/* Piece legend */}
            {viewMode === "marker" && (
              <div className="space-y-1 pt-2">
                <Label className="text-xs text-white/50">القطع</Label>
                <div className="max-h-[200px] overflow-auto space-y-0.5">
                  {Array.from(new Set(markerPieces.map((p) => p.name))).map((name) => {
                    const piece = markerPieces.find((p) => p.name === name);
                    const count = markerPieces.filter((p) => p.name === name).reduce((s, p) => s + p.quantity, 0);
                    return (
                      <button
                        key={name}
                        className={`w-full flex items-center gap-2 py-1 px-2 rounded text-[10px] hover:bg-white/5 transition-colors text-right ${selectedPiece === name ? "bg-white/10" : ""}`}
                        onClick={() => setSelectedPiece(selectedPiece === name ? null : name)}
                      >
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: piece?.color }} />
                        <span className="flex-1 text-white/60">{name}</span>
                        <Badge variant="outline" className="text-[9px] h-4">{count}</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Canvas / SVG Viewer ── */}
        <Card className="theme-card lg:col-span-3" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center justify-between">
              <span>
                {viewMode === "marker" ? "Marker Plan Viewer" : `DXF Viewer (${entities.length} entities)`}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Move size={10} /> اسحب للتنقل
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg overflow-auto cursor-grab active:cursor-grabbing border"
              style={{ borderColor: "var(--border-color)", background: "#0a0a0f", height: "500px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, transformOrigin: "top left" }}>
                <svg ref={svgRef} width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                  <defs>
                    <pattern id="gridPattern" width={scale} height={scale} patternUnits="userSpaceOnUse">
                      <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                    </pattern>
                  </defs>

                  {/* Background */}
                  <rect width={svgWidth} height={svgHeight} fill="#0a0a0f" />

                  {/* Grid */}
                  {showGrid && <rect x={20} y={20} width={fabricWidth * scale} height={Math.max(markerLength, 160) * scale} fill="url(#gridPattern)" />}

                  {/* Fabric outline */}
                  <rect
                    x={20} y={20}
                    width={fabricWidth * scale}
                    height={Math.max(markerLength, viewMode === "marker" ? 160 : 200) * scale}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />

                  {/* ── MARKER MODE ── */}
                  {viewMode === "marker" && markerPieces.map((piece) => {
                    const { sx, sy } = toSvg(piece.x, piece.y);
                    const isSelected = selectedPiece === piece.name;
                    const isDimmed = selectedPiece && !isSelected;
                    return (
                      <g
                        key={piece.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedPiece(isSelected ? null : piece.name)}
                        style={{ opacity: isDimmed ? 0.3 : 1 }}
                      >
                        <rect
                          x={sx} y={sy}
                          width={piece.width * scale}
                          height={piece.height * scale}
                          fill={piece.color}
                          fillOpacity={isSelected ? 0.5 : 0.25}
                          stroke={piece.color}
                          strokeWidth={isSelected ? 2 : 1}
                          rx={2}
                        />
                        {/* Grain line */}
                        <line
                          x1={sx + 4} y1={sy + piece.height * scale / 2}
                          x2={sx + piece.width * scale - 4} y2={sy + piece.height * scale / 2}
                          stroke={piece.color}
                          strokeWidth="0.5"
                          strokeDasharray="3,2"
                        />
                        {/* Label */}
                        <text
                          x={sx + piece.width * scale / 2}
                          y={sy + piece.height * scale / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={Math.max(8, Math.min(11, piece.width * scale / 8))}
                          fontWeight="bold"
                          style={{ pointerEvents: "none" }}
                        >
                          {piece.name}
                        </text>
                        {/* Dimensions */}
                        <text
                          x={sx + piece.width * scale / 2}
                          y={sy + piece.height * scale - 4}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.4)"
                          fontSize="7"
                          style={{ pointerEvents: "none" }}
                        >
                          {piece.width}×{piece.height}
                        </text>
                      </g>
                    );
                  })}

                  {/* ── DXF MODE ── */}
                  {viewMode === "dxf" && entities.map((ent, i) => {
                    if (ent.type === "line" && ent.x1 !== undefined) {
                      const { sx: x1, sy: y1 } = toSvg(ent.x1, ent.y1 || 0);
                      const { sx: x2, sy: y2 } = toSvg(ent.x2 || 0, ent.y2 || 0);
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3B82F6" strokeWidth="0.8" />;
                    }
                    if (ent.type === "circle" && ent.cx !== undefined) {
                      const { sx: cx, sy: cy } = toSvg(ent.cx, ent.cy || 0);
                      const r = (ent.r || 1) * scale;
                      return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#EF4444" strokeWidth="0.8" />;
                    }
                    if (ent.type === "text" && ent.x1 !== undefined) {
                      const { sx, sy } = toSvg(ent.x1, ent.y1 || 0);
                      return <text key={i} x={sx} y={sy} fill="#10B981" fontSize="10">{ent.text}</text>;
                    }
                    return null;
                  })}

                  {/* Rulers */}
                  {/* Top ruler */}
                  {Array.from({ length: Math.ceil(fabricWidth / 10) + 1 }).map((_, i) => (
                    <g key={`rt${i}`}>
                      <line x1={20 + i * 10 * scale} y1={16} x2={20 + i * 10 * scale} y2={20} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                      <text x={20 + i * 10 * scale} y={13} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle">{i * 10}</text>
                    </g>
                  ))}
                  {/* Left ruler */}
                  {Array.from({ length: Math.ceil(Math.max(markerLength, 160) / 10) + 1 }).map((_, i) => (
                    <g key={`rl${i}`}>
                      <line x1={16} y1={20 + i * 10 * scale} x2={20} y2={20 + i * 10 * scale} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                      <text x={12} y={22 + i * 10 * scale} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="end">{i * 10}</text>
                    </g>
                  ))}

                  {/* No data message */}
                  {viewMode === "dxf" && entities.length === 0 && (
                    <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="14">
                      ارفع ملف DXF لعرضه هنا
                    </text>
                  )}
                </svg>
              </div>
            </div>

            {/* Selected piece info */}
            {selectedPiece && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Badge className="gap-1" style={{ background: markerPieces.find((p) => p.name === selectedPiece)?.color }}>
                  <Eye size={10} /> {selectedPiece}
                </Badge>
                <span className="text-xs text-white/40">
                  {markerPieces.filter((p) => p.name === selectedPiece).length} قطعة
                  {" | "}
                  إجمالي: {markerPieces.filter((p) => p.name === selectedPiece).reduce((s, p) => s + p.quantity, 0)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
