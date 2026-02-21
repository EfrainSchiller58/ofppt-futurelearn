import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image, Clock, CheckCircle, XCircle, Search, Filter, MessageSquare, X, Check, Ban, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Justification } from "@/types/api";

const statusConfig = {
  pending: { icon: Clock, label: "Pending", className: "bg-warning/10 text-warning" },
  approved: { icon: CheckCircle, label: "Approved", className: "bg-success/10 text-success" },
  rejected: { icon: XCircle, label: "Rejected", className: "bg-destructive/10 text-destructive" },
};

const AdminJustificationsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: justificationsRes, isLoading } = useQuery({
    queryKey: ["justifications"],
    queryFn: () => api.getJustifications(),
  });

  const justifications: Justification[] = justificationsRes?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => api.approveJustification(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justifications"] });
      setReviewingId(null);
      setReviewNote("");
      toast({ title: "Justification Approved", description: "Decision recorded successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => api.rejectJustification(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justifications"] });
      setReviewingId(null);
      setReviewNote("");
      toast({ title: "Justification Rejected", description: "Decision recorded successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return justifications.filter((j) => {
      const matchSearch = `${j.student_name} ${j.reason} ${j.file_name}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [justifications, search, statusFilter]);

  const pendingCount = justifications.filter((j) => j.status === "pending").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Justification Review</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {pendingCount > 0 ? (
                <span className="text-warning">{pendingCount} pending review{pendingCount > 1 ? "s" : ""}</span>
              ) : (
                "All justifications reviewed"
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", count: justifications.filter((j) => j.status === "pending").length, color: "text-warning bg-warning/10" },
          { label: "Approved", count: justifications.filter((j) => j.status === "approved").length, color: "text-success bg-success/10" },
          { label: "Rejected", count: justifications.filter((j) => j.status === "rejected").length, color: "text-destructive bg-destructive/10" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 text-center">
            <p className={`text-2xl font-display font-bold ${s.color.split(" ")[0]}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student, reason..." className="pl-10 input-glass" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-10 pr-4 h-10 rounded-md bg-secondary/50 border border-white/[0.08] text-sm text-foreground appearance-none cursor-pointer min-w-[140px]">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((j, i) => {
            const StatusIcon = statusConfig[j.status].icon;
            const isReviewing = reviewingId === j.id;

            return (
              <motion.div key={j.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.04 }} className={`glass-panel p-5 transition-all duration-300 ${j.status === "pending" ? "border-warning/20" : ""}`}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      onClick={() => setPreviewingId(j.id)}
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group cursor-pointer transition-all hover:scale-110 ${j.file_type === "pdf" ? "bg-destructive/10 hover:bg-destructive/20" : "bg-primary/10 hover:bg-primary/20"}`}
                      title="Click to view document"
                    >
                      {j.file_type === "pdf" ? <FileText className="w-5 h-5 text-destructive" /> : <Image className="w-5 h-5 text-primary" />}
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
                        <Eye className="w-2.5 h-2.5 text-primary-foreground" />
                      </span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm">{j.student_name}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[j.status].className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[j.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{j.reason}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>{j.date} · {j.hours}h</span>
                        <span>·</span>
                        <button
                          onClick={() => setPreviewingId(j.id)}
                          className="text-primary hover:underline font-medium"
                        >
                          {j.file_name}
                        </button>
                        <span>·</span>
                        <span>Submitted {new Date(j.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {j.status === "pending" && !isReviewing && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" onClick={() => { setReviewingId(j.id); setReviewNote(""); }} className="gap-1.5 bg-secondary hover:bg-secondary/80 text-foreground border-0 h-8">
                          <MessageSquare className="w-3.5 h-3.5" /> Review
                        </Button>
                        <Button size="sm" onClick={() => approveMutation.mutate({ id: j.id, note: "" })} className="gap-1.5 bg-success/10 hover:bg-success/20 text-success border-0 h-8">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" onClick={() => rejectMutation.mutate({ id: j.id, note: "" })} className="gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border-0 h-8">
                          <Ban className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {isReviewing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="p-4 rounded-xl bg-secondary/30 border border-white/[0.05] space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Add Review Note</p>
                            <button onClick={() => setReviewingId(null)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground"><X className="w-4 h-4" /></button>
                          </div>
                          <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note for the student (optional)..." rows={2} maxLength={300} className="w-full rounded-md p-3 bg-secondary/50 border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => approveMutation.mutate({ id: j.id, note: reviewNote })} disabled={approveMutation.isPending} className="gap-1.5 bg-success/10 hover:bg-success/20 text-success border-0">
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button size="sm" onClick={() => rejectMutation.mutate({ id: j.id, note: reviewNote })} disabled={rejectMutation.isPending} className="gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border-0">
                              <Ban className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {j.review_note && j.status !== "pending" && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${j.status === "approved" ? "bg-success/5 text-success" : "bg-destructive/5 text-destructive"}`}>
                      <span className="font-medium">Review Note:</span> {j.review_note}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display font-semibold">No justifications found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewingId(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 max-w-4xl max-h-[90vh] w-full overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Document Preview</h2>
                <button
                  onClick={() => setPreviewingId(null)}
                  className="p-1 hover:bg-secondary rounded-md text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const justification = filtered.find((j) => j.id === previewingId);
                if (!justification?.file_path) {
                  return <p className="text-muted-foreground">File not found</p>;
                }

                if (justification.file_type === "pdf") {
                  return (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{justification.file_name}</p>
                      <iframe
                        src={justification.file_path}
                        className="w-full h-[600px] rounded-lg border border-white/[0.08]"
                        title="PDF Preview"
                      />
                      <a
                        href={justification.file_path}
                        download={justification.file_name}
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        Download PDF
                      </a>
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{justification.file_name}</p>
                      <img
                        src={justification.file_path}
                        alt={justification.file_name}
                        className="max-w-full h-auto rounded-lg border border-white/[0.08]"
                      />
                      <a
                        href={justification.file_path}
                        download={justification.file_name}
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        Download Image
                      </a>
                    </div>
                  );
                }
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminJustificationsPage;
