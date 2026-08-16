import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const ACCENT_COLORS = [
  { color: "#4A2C3F" as const, label: "بنفسجي" },
  { color: "#2563EB" as const, label: "أزرق" },
  { color: "#059669" as const, label: "أخضر" },
  { color: "#D97706" as const, label: "برتقالي" },
  { color: "#DC2626" as const, label: "أحمر" },
  { color: "#7C3AED" as const, label: "بنفسجي فاتح" },
];

export function AppearanceTab() {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();

  const cardBg = { background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" };

  return (
    <Card className="border" style={cardBg}>
      <CardHeader><CardTitle className="text-base text-right">المظهر</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Toggle */}
        <div className="space-y-3 text-right">
          <Label style={{ color: "var(--text-secondary)" }}>السمة</Label>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 gap-2"
              style={theme === "dark" ? { background: "var(--accent-color)", borderColor: "var(--accent-color)", color: "#fff" } : { background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              onClick={() => setTheme("dark")}
            >
              <Moon size={18} /> الوضع الداكن
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 gap-2"
              style={theme === "light" ? { background: "var(--accent-color)", borderColor: "var(--accent-color)", color: "#fff" } : { background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              onClick={() => setTheme("light")}
            >
              <Sun size={18} /> الوضع الفاتح
            </Button>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{theme === "dark" ? "الوضع الداكن مفعل" : "الوضع الفاتح مفعل"}</p>
        </div>

        <Separator style={{ background: "var(--border-color)" }} />

        {/* Accent Color */}
        <div className="space-y-3 text-right">
          <Label style={{ color: "var(--text-secondary)" }}>لون التطبيق الرئيسي</Label>
          <div className="flex gap-3 justify-start">
            {ACCENT_COLORS.map(({ color, label }) => (
              <button key={color} onClick={() => setAccentColor(color)} className="flex flex-col items-center gap-1 transition-all hover:scale-110" title={label}>
                <div className="w-8 h-8 rounded-full border-2 transition-all" style={{ backgroundColor: color, borderColor: accentColor === color ? "#fff" : "transparent" }} />
                <span className="text-[10px] mt-1" style={{ color: accentColor === color ? "var(--accent-color)" : "var(--text-muted)" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
