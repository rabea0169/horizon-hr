import { useState } from "react";
import { usePerformanceReviews, useEmployees } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Plus, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "badge-pending",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "badge-approved",
};

const statusLabels: Record<string, string> = {
  pending: "معلقة",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
};

export default function Performance() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<number | null>(null);

  const [formData, setFormData] = useState({ employeeId: "", reviewerName: "", period: "" });
  const [reviewForm, setReviewForm] = useState({ overallRating: 3, communication: 3, teamwork: 3, productivity: 3, punctuality: 3, goals: "", comments: "", status: "in_progress" as "pending" | "in_progress" | "completed" });

  const { data: reviews, total, create, update } = usePerformanceReviews();
  const { data: employees } = useEmployees();

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedReviews = reviews.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const inProgressCount = reviews.filter((r) => r.status === "in_progress").length;
  const completedCount = reviews.filter((r) => r.status === "completed").length;

  const selectedReviewData = reviews.find((r) => r.id === selectedReview);

  const handleOpenDetail = (review: (typeof reviews)[0]) => {
    setSelectedReview(review.id);
    setReviewForm({
      overallRating: review.overallRating || 3,
      communication: review.communication || 3,
      teamwork: review.teamwork || 3,
      productivity: review.productivity || 3,
      punctuality: review.punctuality || 3,
      goals: review.goals || "",
      comments: review.comments || "",
      status: review.status as "pending" | "in_progress" | "completed",
    });
    setDetailDialog(true);
  };

  const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange?.(star)} className={onChange ? "cursor-pointer" : "cursor-default"} disabled={!onChange}>
          <Star size={16} className={star <= value ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
        </button>
      ))}
    </div>
  );

  const handleCreate = () => {
    const emp = employees.find((e) => e.id === Number(formData.employeeId));
    if (!emp) return;
    create({
      employeeId: Number(formData.employeeId),
      employeeName: emp.fullName,
      reviewerName: formData.reviewerName,
      period: formData.period,
      status: "pending",
    });
    setIsDialogOpen(false);
    setFormData({ employeeId: "", reviewerName: "", period: "" });
  };

  const handleUpdate = () => {
    if (!selectedReview) return;
    update(selectedReview, {
      overallRating: reviewForm.overallRating,
      communication: reviewForm.communication,
      teamwork: reviewForm.teamwork,
      productivity: reviewForm.productivity,
      punctuality: reviewForm.punctuality,
      goals: reviewForm.goals,
      comments: reviewForm.comments,
      status: reviewForm.status,
    });
    setDetailDialog(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>تقييم الأداء</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تقييم أداء الموظفين</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}>
            <Plus size={16} className="ml-1.5" />
            بدء دورة تقييم
          </Button>
          <DialogContent className="theme-card text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-right">بدء تقييم أداء</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 text-right">
              <div className="space-y-2">
                <Label className="text-white/70">الموظف</Label>
                <Select value={formData.employeeId} onValueChange={(v) => setFormData({ ...formData, employeeId: v })}>
                  <SelectTrigger className="theme-input text-right">
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent className="theme-input">
                    {employees.filter((e) => e.status === "active").map((e) => (
                      <SelectItem key={e.id} value={String(e.id)} className="text-white text-right">{e.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">المراجع</Label>
                <Select value={formData.reviewerName} onValueChange={(v) => setFormData({ ...formData, reviewerName: v })}>
                  <SelectTrigger className="theme-input text-right">
                    <SelectValue placeholder="اختر المراجع" />
                  </SelectTrigger>
                  <SelectContent className="theme-input">
                    {employees.filter((e) => e.status === "active").map((e) => (
                      <SelectItem key={e.id} value={e.fullName} className="text-white text-right">{e.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">الفترة</Label>
                <Input value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="theme-input text-right" placeholder="مثال: الربع الثاني 2026" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!formData.employeeId || !formData.reviewerName || !formData.period} onClick={handleCreate}>بدء التقييم</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "معلقة", value: pendingCount, color: "text-yellow-400" },
          { label: "قيد التنفيذ", value: inProgressCount, color: "text-blue-400" },
          { label: "مكتملة", value: completedCount, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <p className="text-xs text-white/45 uppercase">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الموظف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">المراجع</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الفترة</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">التقييم</TableHead>
                  <TableHead className="text-white/50 font-medium text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-white/40">
                      <TrendingUp size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد تقييمات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReviews.map((review) => (
                    <TableRow key={review.id} className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer" onClick={() => handleOpenDetail(review)}>
                      <TableCell>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{review.employeeName || "—"}</p>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{review.reviewerName || "—"}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{review.period}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[review.status]}>{statusLabels[review.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        {review.overallRating ? <StarRating value={review.overallRating} /> : <span className="text-xs text-white/30">لم يتم التقييم</span>}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-[#E85D4A] hover:bg-[#E85D4A]/10">عرض/تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08]">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>صفحة {page} من {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronRight size={14} /></Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronLeft size={14} /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedReviewData && (
        <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
          <DialogContent className="theme-card text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-right">تقييم: {selectedReviewData.employeeName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-4 text-right">
              <div className="flex items-center gap-4 text-sm text-white/60 justify-end">
                <span>المراجع: {selectedReviewData.reviewerName}</span>
                <span>الفترة: {selectedReviewData.period}</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "التقييم العام", field: "overallRating" },
                  { label: "التواصل", field: "communication" },
                  { label: "العمل الجماعي", field: "teamwork" },
                  { label: "الإنتاجية", field: "productivity" },
                  { label: "الانضباط", field: "punctuality" },
                ].map((item) => (
                  <div key={item.field} className="flex items-center justify-between">
                    <Label className="text-white/70 text-sm">{item.label}</Label>
                    <StarRating value={reviewForm[item.field as keyof typeof reviewForm] as number} onChange={(v) => setReviewForm({ ...reviewForm, [item.field]: v })} />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">الأهداف</Label>
                <Input value={reviewForm.goals} onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })} className="theme-input text-right" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">التعليقات</Label>
                <Input value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} className="theme-input text-right" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">الحالة</Label>
                <Select value={reviewForm.status} onValueChange={(v) => setReviewForm({ ...reviewForm, status: v as typeof reviewForm.status })}>
                  <SelectTrigger className="theme-input text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="theme-input">
                    <SelectItem value="pending" className="text-white text-right">معلقة</SelectItem>
                    <SelectItem value="in_progress" className="text-white text-right">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed" className="text-white text-right">مكتملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setDetailDialog(false)}>إغلاق</Button>
                <Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" onClick={handleUpdate}>حفظ التقييم</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
