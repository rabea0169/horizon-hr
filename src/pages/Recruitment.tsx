import { useState } from "react";
import { useJobPostings, useCandidates, useDepartments, type Candidate } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Plus, Users, ArrowRight, Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const jobStatusStyles: Record<string, string> = { open: "badge-active", paused: "badge-pending", closed: "badge-inactive" };
const jobStatusLabels: Record<string, string> = { open: "مفتوحة", paused: "متوقفة", closed: "مغلقة" };

const candidateStageLabels: Record<string, string> = { applied: "متقدم", screening: "فحص", interview: "مقابلة", offer: "عرض", hired: "تم التعيين", rejected: "مرفوض" };
const stageColors: Record<string, string> = { applied: "bg-white/[0.04] text-white/60", screening: "bg-blue-500/20 text-blue-400", interview: "bg-purple-500/20 text-purple-400", offer: "bg-yellow-500/20 text-yellow-400", hired: "bg-green-500/20 text-green-400", rejected: "bg-red-500/20 text-red-400" };

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isCandidateDialogOpen, setIsCandidateDialogOpen] = useState(false);

  const [jobForm, setJobForm] = useState({ title: "", departmentName: "", description: "", requirements: "", salaryRange: "", location: "", employmentType: "full_time" as "full_time" | "part_time" | "contract" | "intern" });
  const [candidateForm, setCandidateForm] = useState({ fullName: "", email: "", phone: "", resumeUrl: "", notes: "" });

  const { data: jobs, create: createJob } = useJobPostings();
  const { data: departments } = useDepartments();
  const { data: candidates, create: createCandidate, update: updateCandidate } = useCandidates();

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const paginatedJobs = jobs.slice((page - 1) * pageSize, page * pageSize);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const jobCandidates = candidates.filter((c) => c.jobPostingId === selectedJobId);

  const handleCreateJob = () => {
    createJob({
      title: jobForm.title,
      departmentName: jobForm.departmentName || departments[0]?.name || "",
      description: jobForm.description,
      requirements: jobForm.requirements,
      salaryRange: jobForm.salaryRange,
      location: jobForm.location,
      employmentType: jobForm.employmentType,
      status: "open",
    });
    setIsJobDialogOpen(false);
    setJobForm({ title: "", departmentName: "", description: "", requirements: "", salaryRange: "", location: "", employmentType: "full_time" });
  };

  const handleCreateCandidate = () => {
    if (!selectedJobId) return;
    createCandidate({
      jobPostingId: selectedJobId,
      fullName: candidateForm.fullName,
      email: candidateForm.email,
      phone: candidateForm.phone || undefined,
      stage: "applied",
    });
    setIsCandidateDialogOpen(false);
    setCandidateForm({ fullName: "", email: "", phone: "", resumeUrl: "", notes: "" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>التعيين</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة الوظائف والمتقدمين</p>
        </div>
        {activeTab === "jobs" && (
          <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
            <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsJobDialogOpen(true)}>
              <Plus size={16} className="ml-1.5" />
              إضافة وظيفة
            </Button>
            <DialogContent className="theme-card text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white text-right">وظيفة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 text-right">
                <div className="space-y-2">
                  <Label className="text-white/70">العنوان</Label>
                  <Input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className="theme-input text-right" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">القسم</Label>
                    <Select value={jobForm.departmentName} onValueChange={(v) => setJobForm({ ...jobForm, departmentName: v })}>
                      <SelectTrigger className="theme-input text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="theme-input">
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.name} className="text-white text-right">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">نوع التوظيف</Label>
                    <Select value={jobForm.employmentType} onValueChange={(v) => setJobForm({ ...jobForm, employmentType: v as typeof jobForm.employmentType })}>
                      <SelectTrigger className="theme-input text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="theme-input">
                        <SelectItem value="full_time" className="text-white text-right">دوام كامل</SelectItem>
                        <SelectItem value="part_time" className="text-white text-right">دوام جزئي</SelectItem>
                        <SelectItem value="contract" className="text-white text-right">عقد</SelectItem>
                        <SelectItem value="intern" className="text-white text-right">متدرب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">الراتب</Label>
                    <Input value={jobForm.salaryRange} onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })} className="theme-input text-right" placeholder="مثال: $50k-$70k" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">الموقع</Label>
                    <Input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className="theme-input text-right" placeholder="مثال: عن بعد" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">الوصف</Label>
                  <Input value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className="theme-input text-right" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">المتطلبات</Label>
                  <Input value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} className="theme-input text-right" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsJobDialogOpen(false)}>إلغاء</Button>
                  <Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!jobForm.title} onClick={handleCreateJob}>نشر</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1C1C1E] border border-white/[0.08]">
          <TabsTrigger value="jobs" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">الوظائف</TabsTrigger>
          <TabsTrigger value="candidates" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50" disabled={!selectedJobId}>
            المتقدمون {selectedJobId && `(${selectedJob?.title || ""})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-transparent">
                      <TableHead className="text-white/50 font-medium text-right">العنوان</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">القسم</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الموقع</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">المتقدمون</TableHead>
                      <TableHead className="text-white/50 font-medium text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-white/40">
                          <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
                          <p>لا توجد وظائف</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedJobs.map((job) => (
                        <TableRow key={job.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                          <TableCell>
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{job.employmentType === "full_time" ? "دوام كامل" : job.employmentType === "part_time" ? "دوام جزئي" : job.employmentType === "contract" ? "عقد" : "متدرب"}</p>
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{job.departmentName || "—"}</TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {job.location || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={jobStatusStyles[job.status]}>{jobStatusLabels[job.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="flex items-center gap-1"><Users size={12} /> {job.candidateCount || 0}</span>
                          </TableCell>
                          <TableCell className="text-left">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-[#E85D4A] hover:bg-[#E85D4A]/10" onClick={() => { setSelectedJobId(job.id); setActiveTab("candidates"); }}>
                              عرض <ArrowRight size={12} className="mr-1" />
                            </Button>
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
        </TabsContent>

        <TabsContent value="candidates" className="mt-4">
          {selectedJobId && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Object.entries(candidateStageLabels).map(([key, label]) => {
                  const count = jobCandidates.filter((c) => c.stage === key).length;
                  return <div key={key} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${stageColors[key]}`}>{label} ({count})</div>;
                })}
              </div>
              <Dialog open={isCandidateDialogOpen} onOpenChange={setIsCandidateDialogOpen}>
                <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsCandidateDialogOpen(true)}>
                  <Plus size={16} className="ml-1.5" /> إضافة متقدم
                </Button>
                <DialogContent className="theme-card text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white text-right">إضافة متقدم: {selectedJob?.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4 text-right">
                    <div className="space-y-2">
                      <Label className="text-white/70">الاسم الكامل</Label>
                      <Input value={candidateForm.fullName} onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })} className="theme-input text-right" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">البريد الإلكتروني</Label>
                      <Input type="email" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} className="theme-input text-right" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">رقم الهاتف</Label>
                      <Input value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} className="theme-input text-right" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsCandidateDialogOpen(false)}>إلغاء</Button>
                      <Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!candidateForm.fullName || !candidateForm.email} onClick={handleCreateCandidate}>إضافة متقدم</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/[0.08] hover:bg-transparent">
                          <TableHead className="text-white/50 font-medium text-right">الاسم</TableHead>
                          <TableHead className="text-white/50 font-medium text-right">البريد</TableHead>
                          <TableHead className="text-white/50 font-medium text-right">المرحلة</TableHead>
                          <TableHead className="text-white/50 font-medium text-right">التقييم</TableHead>
                          <TableHead className="text-white/50 font-medium text-right">تاريخ التقديم</TableHead>
                          <TableHead className="text-white/50 font-medium text-left">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobCandidates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-white/40">
                              <Users size={32} className="mx-auto mb-3 opacity-50" />
                              <p>لا يوجد متقدمون بعد</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          jobCandidates.map((candidate) => (
                            <TableRow key={candidate.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                              <TableCell>
                                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{candidate.fullName}</p>
                                {candidate.phone && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{candidate.phone}</p>}
                              </TableCell>
                              <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{candidate.email}</TableCell>
                              <TableCell>
                                <Select value={candidate.stage} onValueChange={(v) => updateCandidate(candidate.id, { stage: v as Candidate["stage"] })}>
                                  <SelectTrigger className="w-32 h-7 text-xs bg-transparent border-white/[0.08] text-white text-right">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="theme-input">
                                    {Object.entries(candidateStageLabels).map(([k, l]) => (
                                      <SelectItem key={k} value={k} className="text-white text-right">{l}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={12} className={s <= (candidate.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm" style={{ color: "var(--text-muted)" }}>{candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString("ar-EG") : "—"}</TableCell>
                              <TableCell className="text-left">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white" onClick={() => { const rating = prompt("تقييم المتقدم (1-5):", String(candidate.rating || 3)); if (rating) updateCandidate(candidate.id, { rating: Number(rating) }); }}>
                                  <Star size={14} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
