import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image, Clock, CheckCircle, XCircle, Send, Plus, X } from "lucide-react";
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

const JustificationsPage = () => {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedAbsence, setSelectedAbsence] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: justificationsRes, isLoading: loadingJustifications } = useQuery({
    queryKey: ["justifications"],
    queryFn: () => api.getJustifications(),
  });

  const { data: absencesRes } = useQuery({
    queryKey: ["absences", "unjustified"],
    queryFn: () => api.getAbsences({ status: "pending,unjustified" }),
  });

  const justifications: Justification[] = justificationsRes?.data ?? [];
  const unjustifiedAbsences = absencesRes?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: (formData: FormData) => api.createJustification(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justifications"] });
      setShowUpload(false);
      setReason("");
      setSelectedFile(null);
      setSelectedAbsence(null);
      toast({ title: "Justification Submitted", description: "Your justification is pending review" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
        return;
      }
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Only PDF, JPG, PNG files are accepted", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedAbsence || !reason.trim() || !selectedFile) {
      toast({ title: "Missing fields", description: "Please select an absence, provide a reason, and upload a document", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("absence_id", String(selectedAbsence));
    formData.append("reason", reason);
    formData.append("file", selectedFile);
    submitMutation.mutate(formData);
  };

  if (loadingJustifications) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Justifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit and track your absence justifications</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="btn-glow text-primary-foreground border-0 gap-2">
          <Plus className="w-4 h-4" /> New Justification
        </Button>
      </motion.div>

      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-panel p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Submit Justification</h3>
                <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Select Absence</label>
                  <select value={selectedAbsence || ""} onChange={(e) => setSelectedAbsence(Number(e.target.value))} className="w-full h-10 rounded-md px-3 bg-secondary/50 border border-white/[0.08] text-sm text-foreground">
                    <option value="">Choose an absence...</option>
                    {unjustifiedAbsences.map((a) => (
                      <option key={a.id} value={a.id}>{a.date} — {a.subject} ({a.hours}h)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Upload Document</label>
                  <label className="flex items-center gap-3 h-10 px-3 rounded-md bg-secondary/50 border border-white/[0.08] cursor-pointer hover:border-primary/30 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {selectedFile?.name || "PDF or Image (max 5MB)"}
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Reason / Explanation</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="Explain the reason for your absence..." className="w-full rounded-md p-3 bg-secondary/50 border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
                <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="btn-glow text-primary-foreground border-0 gap-2">
                  {submitMutation.isPending ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Justification</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {justifications.map((j, i) => {
          const StatusIcon = statusConfig[j.status].icon;
          return (
            <motion.div key={j.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel-hover p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${j.file_type === "pdf" ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {j.file_type === "pdf" ? <FileText className="w-5 h-5 text-destructive" /> : <Image className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{j.date} — {j.hours}h absence</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[j.status].className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[j.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{j.reason}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{j.file_name}</span>
                    <span>·</span>
                    <span>Submitted {new Date(j.submitted_at).toLocaleDateString()}</span>
                  </div>
                  {j.review_note && (
                    <p className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${j.status === "approved" ? "bg-success/5 text-success" : "bg-destructive/5 text-destructive"}`}>
                      Review: {j.review_note}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {justifications.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display font-semibold">No justifications yet</p>
            <p className="text-sm text-muted-foreground">Submit a justification for your absences</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JustificationsPage;
