import { useState, useRef, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Printer, Search, Package, QrCode, BarcodeIcon, Download,
  Plus, X, RefreshCw, Tag
} from "lucide-react";

/** Individual barcode sticker data */
interface StickerData {
  id: string;
  bundleCode: string;
  modelName: string;
  size: string;
  color: string;
  quantity: number;
  stage: string;
  lineName?: string;
  type: "qr" | "barcode";
}

/** CODE128 barcode patterns (B subset) */
const CODE128_B: Record<string, number[]> = {
  " ": [1,1,0,1,1,0,1,0,0,1,1], "!": [1,1,0,1,1,0,0,1,1,0,1],
  "\"": [1,1,0,1,0,0,1,1,0,1,1], "#": [1,1,0,0,1,1,0,1,1,0,1],
  "$": [1,1,0,1,1,1,0,1,0,0,1], "%": [1,1,0,1,1,1,0,0,1,0,1],
  "&": [1,1,0,0,1,1,1,0,1,0,1], "'": [1,0,1,0,1,1,1,0,1,0,1],
  "(": [1,0,0,1,1,1,0,1,0,0,1], ")": [1,0,0,1,1,0,1,0,0,1,1],
  "*": [1,0,0,1,0,0,1,1,0,1,1], "+": [1,0,1,0,0,1,1,0,0,1,1],
  ",": [1,1,0,1,0,1,1,1,0,0,1], "-": [1,1,0,1,0,0,1,1,1,0,1],
  ".": [1,1,0,0,1,0,1,1,1,0,1], "/": [1,0,1,1,1,0,1,0,0,1,1],
  "0": [1,0,1,1,0,0,1,0,0,1,1], "1": [1,1,0,1,0,1,0,0,1,0,1],
  "2": [1,1,0,1,0,0,1,0,1,0,1], "3": [1,1,0,0,1,0,1,0,1,0,1],
  "4": [1,0,1,1,0,1,0,0,1,0,1], "5": [1,0,1,1,0,0,1,0,1,0,1],
  "6": [1,0,0,1,1,0,1,0,1,0,1], "7": [1,0,1,0,1,0,1,1,0,0,1],
  "8": [1,0,1,0,0,1,1,0,1,0,1], "9": [1,0,0,1,0,1,1,0,1,0,1],
  ":": [1,1,0,1,0,1,1,0,1,0,1], ";": [1,1,0,1,0,1,0,1,1,0,1],
  "<": [1,1,0,1,0,1,0,0,1,1,0], "=": [1,1,0,0,1,0,1,0,1,1,0],
  ">": [1,1,0,0,1,0,1,1,0,1,0], "?": [1,0,1,1,0,1,0,1,0,1,1],
  "@": [1,0,1,1,0,0,1,0,1,1,0], "A": [1,0,1,0,1,0,1,0,1,1,0],
  "B": [1,0,1,0,1,1,0,1,0,0,1], "C": [1,0,1,0,1,1,0,0,1,0,1],
  "D": [1,0,1,0,0,1,1,0,1,0,1], "E": [1,0,1,1,0,1,1,0,1,0,1],
  "F": [1,0,1,1,0,0,1,1,0,1,0], "G": [1,0,0,1,0,1,1,0,1,0,1],
  "H": [1,0,0,1,1,0,1,0,1,0,1], "I": [1,0,0,1,1,0,0,1,0,1,1],
  "J": [1,0,1,0,1,0,0,1,0,1,1], "K": [1,1,0,0,1,0,1,1,0,0,1],
  "L": [1,1,0,0,1,0,0,1,0,1,1], "M": [1,1,0,1,1,0,0,1,0,0,1],
  "N": [1,1,0,0,1,1,0,0,1,0,1], "O": [1,1,0,0,1,0,0,1,1,0,1],
  "P": [1,1,0,1,0,0,1,0,0,1,1], "Q": [1,1,0,0,0,1,0,1,0,0,1],
  "R": [1,0,0,0,1,1,0,1,0,0,1], "S": [1,0,1,0,0,0,1,1,0,0,1],
  "T": [1,0,0,0,1,0,1,1,0,0,1], "U": [1,0,0,0,1,0,0,1,1,0,1],
  "V": [1,0,1,1,0,0,0,1,0,0,1], "W": [1,0,0,1,1,0,0,0,1,0,1],
  "X": [1,0,0,1,0,0,1,0,0,1,1], "Y": [1,0,0,1,0,0,0,1,0,1,1],
  "Z": [1,1,0,1,0,1,0,0,0,1,0], "[": [1,1,0,1,0,0,1,0,0,0,1],
  "\\": [1,1,0,0,1,0,1,0,0,0,1], "]": [1,0,0,1,1,0,1,0,0,0,1],
  "_": [1,0,0,0,1,0,1,0,0,1,1], "a": [1,0,1,0,0,1,1,0,0,0,1],
  "b": [1,0,0,1,0,1,1,0,0,0,1], "c": [1,0,0,1,0,0,1,1,0,0,1],
  "d": [1,0,1,1,0,0,0,1,1,0,1], "e": [1,0,0,1,1,0,0,0,1,1,0],
  "f": [1,0,0,0,1,1,0,0,1,1,0], "g": [1,0,1,0,0,0,1,1,1,0,1],
  "h": [1,0,0,0,1,0,1,1,1,0,1], "i": [1,0,0,0,1,0,0,1,1,1,0],
  "j": [1,0,1,1,1,0,0,1,0,0,1], "k": [1,0,0,1,1,1,0,1,0,0,1],
  "l": [1,0,0,1,1,1,0,0,1,0,1], "m": [1,0,1,1,1,0,1,0,0,0,1],
  "n": [1,0,1,1,1,0,0,0,1,0,1], "o": [1,0,1,1,0,0,0,0,1,1,0],
  "p": [1,0,0,0,0,1,1,0,1,1,0], "q": [1,0,1,0,0,1,1,1,0,0,1],
  "r": [1,0,0,1,0,1,1,1,0,0,1], "s": [1,0,0,1,0,0,1,1,1,0,1],
  "t": [1,1,1,0,1,0,0,0,1,0,1], "u": [1,1,1,0,0,0,1,0,1,0,1],
  "v": [1,1,1,0,0,0,1,0,0,1,0], "w": [1,1,1,0,0,0,0,1,0,1,0],
  "x": [1,1,0,0,0,1,1,0,1,0,1], "y": [1,1,0,0,0,1,0,1,1,0,1],
  "z": [1,1,0,0,0,0,1,1,0,1,0],
};
const START_B = [1,1,0,1,0,0,1,0,0,1,0,0,0,1,0,1,1];
const STOP = [1,1,0,0,0,1,1,1,0,1,0,1,0,0,0,1,0,0];

/** Barcode width pattern */
function getBarWidths(code: string): number[] {
  const result: number[] = [...START_B];
  let checksum = 104;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const pattern = CODE128_B[ch] || CODE128_B[" "];
    result.push(...pattern);
    const val = Object.keys(CODE128_B).indexOf(ch);
    checksum += Math.max(0, val) * (i + 1);
  }
  const modIdx = checksum % 103;
  const allChars = Object.keys(CODE128_B);
  const checkChar = allChars[modIdx] || " ";
  result.push(...(CODE128_B[checkChar] || CODE128_B[" "]));
  result.push(...STOP);
  return result;
}

/** Simple SVG barcode — no external lib needed */
function BarcodeSVG({ code }: { code: string }) {
  const bars = getBarWidths(code);
  const unitW = 1.5;
  const totalW = bars.length * unitW;
  const height = 40;
  let x = 0;
  return (
    <svg width={totalW + 20} height={height + 14} viewBox={`0 0 ${totalW + 20} ${height + 14}`}>
      <rect width="100%" height="100%" fill="white" />
      {bars.map((bit, i) => {
        if (i % 2 === 1) { x += unitW; return null; }
        const w = unitW * bit;
        const el = <rect key={i} x={x + 10} y={2} width={w} height={height} fill="black" />;
        x += w;
        return el;
      })}
      <text x={(totalW + 20) / 2} y={height + 12} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#333">{code}</text>
    </svg>
  );
}

/** Print-ready sticker layout */
function PrintSheet({ stickers }: { stickers: StickerData[] }) {
  const pageRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={pageRef} className="print-sheet grid grid-cols-2 gap-4 p-8">
      {stickers.map((s) => (
        <div
          key={s.id}
          className="sticker border-2 border-dashed border-gray-400 rounded-lg p-4 bg-white flex flex-col items-center gap-2"
          style={{ width: "80mm", height: "50mm", pageBreakInside: "avoid" }}
        >
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.modelName}</p>
            <p className="text-xs font-bold text-gray-800">{s.bundleCode}</p>
          </div>

          {s.type === "qr" ? (
            <QRCodeSVG value={s.bundleCode} size={60} level="H" />
          ) : (
            <BarcodeSVG code={s.bundleCode} />
          )}

          <div className="flex gap-2 text-[9px] text-gray-600">
            <span>Size: {s.size}</span>
            <span>|</span>
            <span>Clr: {s.color}</span>
            <span>|</span>
            <span>Qty: {s.quantity}</span>
          </div>
          <p className="text-[8px] text-gray-400">{s.stage} {s.lineName ? `- ${s.lineName}` : ""}</p>
        </div>
      ))}

      {stickers.length === 0 && (
        <div className="col-span-2 text-center text-gray-400 py-8">
          <Tag size={24} className="mx-auto mb-2" />
          <p>لا توجد ملصقات</p>
        </div>
      )}
    </div>
  );
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function BarcodeGenerator() {
  // ── Data queries ──
  const { data: bundlesList, isLoading: bundlesLoading } = trpc.bundle.list.useQuery();
  const { data: ordersList } = trpc.productionOrder.list.useQuery();
  const { data: linesList } = trpc.productionLine.list.useQuery();

  // ── Search & filter ──
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string>("__all__");
  const [codeType, setCodeType] = useState<"qr" | "barcode">("qr");

  // ── Sticker queue ──
  const [stickerQueue, setStickerQueue] = useState<StickerData[]>([]);

  // ── Quick generate ──
  const [qty, setQty] = useState<number>(1);
  const [genModel, setGenModel] = useState("");
  const [genSize, setGenSize] = useState("");
  const [genColor, setGenColor] = useState("");
  const [genStage, setGenStage] = useState("Cutting");

  // ── Filter bundles ──
  const filteredBundles = (bundlesList ?? []).filter((b: any) => {
    const matchSearch = !search ||
      b.bundleCode?.includes(search) ||
      b.modelName?.includes(search);
    const matchOrder = selectedOrder === "__all__" || String(b.productionOrderId) === selectedOrder;
    return matchSearch && matchOrder;
  });

  // ── Add to sticker queue ──
  const addSticker = useCallback((bundle: any) => {
    const sticker: StickerData = {
      id: `${bundle.id}-${Date.now()}`,
      bundleCode: bundle.bundleCode,
      modelName: bundle.modelName || bundle.model?.name || "Unknown",
      size: bundle.size || "-",
      color: bundle.color || "-",
      quantity: bundle.quantity || 1,
      stage: bundle.currentStage || "Cutting",
      lineName: linesList?.find((l: any) => l.id === bundle.currentLineId)?.name,
      type: codeType,
    };
    setStickerQueue((prev) => [...prev, sticker]);
    toast.success(`تمت إضافة ${bundle.bundleCode} لقائمة الطباعة`);
  }, [codeType, linesList]);

  const removeSticker = useCallback((id: string) => {
    setStickerQueue((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Quick generate stickers ──
  const quickGenerate = useCallback(() => {
    if (!genModel || !genSize || !genColor) {
      toast.error("يرجى ملء الموديل، المقاس، واللون");
      return;
    }
    const newStickers: StickerData[] = Array.from({ length: qty }).map((_, i) => {
      const code = `BN-${Date.now()}-${i}`;
      return {
        id: code,
        bundleCode: code,
        modelName: genModel,
        size: genSize,
        color: genColor,
        quantity: 1,
        stage: genStage,
        type: codeType,
      };
    });
    setStickerQueue((prev) => [...prev, ...newStickers]);
    toast.success(`تم توليد ${qty} ملصق جديد`);
  }, [genModel, genSize, genColor, qty, genStage, codeType]);

  // ── Print ──
  const handlePrint = useCallback(() => {
    if (stickerQueue.length === 0) {
      toast.error("لا توجد ملصقات للطباعة");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
      <head>
        <title>طباعة باركود</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .sheet { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8mm; padding: 10mm; }
          .sticker { 
            border: 1px dashed #999; border-radius: 6px; padding: 4mm;
            background: #fff; display: flex; flex-direction: column;
            align-items: center; gap: 2mm; page-break-inside: avoid;
            width: 80mm; height: 50mm; box-sizing: border-box;
          }
          .sticker-header { text-align: center; }
          .sticker-header .model { font-size: 8px; color: #666; text-transform: uppercase; }
          .sticker-header .code { font-size: 11px; font-weight: bold; color: #000; }
          .sticker-meta { display: flex; gap: 3px; font-size: 8px; color: #555; }
          .sticker-stage { font-size: 7px; color: #999; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="padding: 10px; text-align: center; background: #f0f0f0;">
          <button onclick="window.print()" style="padding: 8px 24px; font-size: 14px;">🖨️ طباعة</button>
        </div>
        <div class="sheet">
          ${stickerQueue.map((s) => {
            const qrSvg = `<svg viewBox="0 0 60 60" width="50" height="50">
              <rect width="60" height="60" fill="white"/>
              <text x="30" y="32" text-anchor="middle" font-size="8">QR: ${escapeHtml(s.bundleCode)}</text>
            </svg>`;
            return `
              <div class="sticker">
                <div class="sticker-header">
                  <div class="model">${escapeHtml(s.modelName)}</div>
                  <div class="code">${escapeHtml(s.bundleCode)}</div>
                </div>
                ${s.type === "qr" ? qrSvg : `<svg class="barcode-svg" data-code="${escapeHtml(s.bundleCode)}" width="120" height="40"></svg>`}
                <div class="sticker-meta">
                  <span>Size: ${escapeHtml(s.size)}</span> |
                  <span>Clr: ${escapeHtml(s.color)}</span> |
                  <span>Qty: ${s.quantity}</span>
                </div>
                <div class="sticker-stage">${escapeHtml(s.stage)}</div>
              </div>
            `;
          }).join("")}
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          document.querySelectorAll('.barcode-svg').forEach(function(el) {
            try { JsBarcode(el, el.dataset.code, { format: "CODE128", width: 1.2, height: 30, displayValue: true, fontSize: 9 }); } catch(e) {}
          });
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }, [stickerQueue]);

  // ── Export CSV ──
  const exportCSV = useCallback(() => {
    if (stickerQueue.length === 0) return;
    const headers = ["Bundle Code", "Model", "Size", "Color", "Qty", "Stage"];
    const rows = stickerQueue.map((s) => [s.bundleCode, s.modelName, s.size, s.color, String(s.quantity), s.stage]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcodes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stickerQueue]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>توليد باركود</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>توليد وطباعة ملصقات QR/Barcode للـ Bundles</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Package size={12} /> {stickerQueue.length} ملصق
          </Badge>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={stickerQueue.length === 0}>
            <Download size={14} className="ml-1" /> تصدير
          </Button>
          <Button size="sm" className="text-white" style={{ background: "var(--accent-color)" }} onClick={handlePrint} disabled={stickerQueue.length === 0}>
            <Printer size={14} className="ml-1" /> طباعة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Quick Generate Panel ── */}
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Plus size={14} /> توليد سريع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">الموديل</Label>
                <Input value={genModel} onChange={(e) => setGenModel(e.target.value)} placeholder="مثال: Shirt-001" className="theme-input text-right text-sm h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">المقاس</Label>
                <Input value={genSize} onChange={(e) => setGenSize(e.target.value)} placeholder="مثال: M, L, XL" className="theme-input text-right text-sm h-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">اللون</Label>
                <Input value={genColor} onChange={(e) => setGenColor(e.target.value)} placeholder="مثال: Red, Navy" className="theme-input text-right text-sm h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">المرحلة</Label>
                <Select value={genStage} onValueChange={setGenStage}>
                  <SelectTrigger className="theme-input text-right text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cutting", "Sewing", "Pressing", "Packing", "QC"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/60">نوع الكود</Label>
                <Select value={codeType} onValueChange={(v) => setCodeType(v as "qr" | "barcode")}>
                  <SelectTrigger className="theme-input text-right text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr"><QrCode size={12} className="inline ml-1" /> QR Code</SelectItem>
                    <SelectItem value="barcode"><BarcodeIcon size={12} className="inline ml-1" /> Barcode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/60">العدد</Label>
                <Input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="theme-input text-right text-sm h-8" />
              </div>
            </div>
            <Button className="w-full text-white text-sm h-9" style={{ background: "var(--accent-color)" }} onClick={quickGenerate}>
              <RefreshCw size={13} className="ml-1" /> توليد {qty} ملصق
            </Button>
          </CardContent>
        </Card>

        {/* ── Existing Bundles ── */}
        <Card className="theme-card lg:col-span-2" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Package size={14} /> Bundles الموجودة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالكود أو الموديل..."
                  className="theme-input text-right text-sm pr-9 h-8"
                />
              </div>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger className="theme-input text-right text-sm h-8 w-48">
                  <SelectValue placeholder="أمر الإنتاج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">الكل</SelectItem>
                  {(ordersList ?? []).map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.orderCode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bundles table */}
            <div className="overflow-auto max-h-[340px] border rounded-lg" style={{ borderColor: "var(--border-color)" }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ background: "var(--bg-card)" }}>
                  <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                    <th className="text-right py-2 px-3 text-xs text-white/60">كود البندل</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">الموديل</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">مقاس/لون</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">الكمية</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">المرحلة</th>
                    <th className="text-center py-2 px-3 text-xs text-white/60">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBundles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-white/40">
                        {bundlesLoading ? "جاري التحميل..." : "لا توجد بيانات"}
                      </td>
                    </tr>
                  )}
                  {filteredBundles.map((b: any) => (
                    <tr key={b.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "var(--border-color)" }}>
                      <td className="py-2 px-3 font-mono text-xs text-white/80">{b.bundleCode}</td>
                      <td className="py-2 px-3 text-xs text-white/70">{b.modelName || b.model?.name || "-"}</td>
                      <td className="py-2 px-3 text-xs text-white/60">{b.size || "-"} / {b.color || "-"}</td>
                      <td className="py-2 px-3 text-xs text-white/60">{b.quantity}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px] h-5">{b.currentStage || "Cutting"}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => addSticker(b)}>
                          <Plus size={14} className="text-green-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sticker Print Queue ── */}
      <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between text-white">
            <span className="flex items-center gap-2"><Printer size={14} /> قائمة الطباعة ({stickerQueue.length})</span>
            {stickerQueue.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-red-400 hover:text-red-300" onClick={() => setStickerQueue([])}>
                <X size={12} className="ml-1" /> إفراغ
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stickerQueue.map((s) => (
              <div key={s.id} className="relative border rounded-lg p-3 bg-white/5 flex flex-col items-center gap-1.5" style={{ width: 120, borderColor: "var(--border-color)" }}>
                <button className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40" onClick={() => removeSticker(s.id)}>
                  <X size={10} />
                </button>
                <p className="text-[9px] text-white/50">{s.modelName}</p>
                <p className="text-[10px] font-mono font-bold text-white/80">{s.bundleCode}</p>
                {s.type === "qr" ? (
                  <QRCodeSVG value={s.bundleCode} size={50} level="H" bgColor="transparent" fgColor="rgba(255,255,255,0.8)" />
                ) : (
                  <div className="h-10 flex items-center"><BarcodeIcon size={40} className="text-white/50" /></div>
                )}
                <div className="flex gap-1 text-[8px] text-white/40">
                  <span>{s.size}</span> <span>{s.color}</span>
                </div>
              </div>
            ))}
            {stickerQueue.length === 0 && (
              <p className="text-sm text-white/40 text-center w-full py-4">أضف Bundles من القائمة أعلاه أو استخدم التوليد السريع</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Print Preview ── */}
      {stickerQueue.length > 0 && (
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">معاينة الطباعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 overflow-auto" style={{ borderColor: "var(--border-color)", background: "#fff" }}>
              <PrintSheet stickers={stickerQueue} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
