import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6" dir="rtl" style={{ color: "var(--text-primary)" }}>
      <h1 className="text-8xl font-bold" style={{ color: "var(--accent-color)" }}>404</h1>
      <p className="text-xl" style={{ color: "var(--text-secondary)" }}>الصفحة غير موجودة</p>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>الصفحة التي تبحث عنها غير متوفرة</p>
      <Link to="/">
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }}>
          <ArrowLeft size={16} /> العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
