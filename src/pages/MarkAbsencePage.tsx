import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Clock, BookOpen, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuccessNotification } from "@/components/SuccessNotification";
import QRSessionCode from "@/components/QRSessionCode";

const MarkAbsencePage = () => {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("10:30");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [absentIds, setAbsentIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { showSuccess, NotificationComponent } = useSuccessNotification();

  const { data: groupsRes, isLoading: loadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.getGroups(),
  });

  const groups = groupsRes?.data ?? [];

  const { data: studentsRes, isLoading: loadingStudents } = useQuery({
    queryKey: ["group-students", selectedGroup],
    queryFn: () => api.getGroupStudents(selectedGroup!),
    enabled: !!selectedGroup,
  });

  const groupStudents = studentsRes?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: () => api.createAbsence({
      student_ids: Array.from(absentIds),
      group_id: selectedGroup!,
      date,
      start_time: startTime,
      end_time: endTime,
      subject,
      notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      queryClient.invalidateQueries({ queryKey: ["absences", "teacher-history"] });
      const group = groups.find((g) => g.id === selectedGroup);
      showSuccess({
        title: "Absences Recorded",
        description: `${absentIds.size} absence(s) marked for ${group?.name}`,
        icon: "send",
        accentColor: "#3b82f6",
      });
      setAbsentIds(new Set());
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleStudent = (id: number) => {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (absentIds.size === groupStudents.length) {
      setAbsentIds(new Set());
    } else {
      setAbsentIds(new Set(groupStudents.map((s) => s.id)));
    }
  };

  const handleSubmit = () => {
    if (!selectedGroup || !subject.trim() || absentIds.size === 0) {
      toast({ title: "Validation Error", description: "Select a group, subject, and at least one absent student", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const hours = (() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  })();

  return (
    <>
    {NotificationComponent}
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Mark Absences</h1>
        <p className="text-muted-foreground text-sm mt-1">Record student absences for your session</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-1.5">
          <label className="text-sm text-muted-foreground flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Group</label>
          {loadingGroups ? <Skeleton className="h-10 w-full" /> : (
            <select
              value={selectedGroup || ""}
              onChange={(e) => { setSelectedGroup(Number(e.target.value)); setAbsentIds(new Set()); }}
              className="w-full h-10 rounded-md px-3 bg-secondary/50 border border-white/[0.08] text-sm text-foreground"
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.student_count} students)</option>
              ))}
            </select>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-glass" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-1.5">
          <label className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time Range</label>
          <div className="flex items-center gap-2">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-glass" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-glass" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Subject</label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. JavaScript" className="input-glass" />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Notes (optional)</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." className="input-glass" />
      </motion.div>

      {/* QR Session Code */}
      {selectedGroup && subject.trim() && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <QRSessionCode
            groupName={groups.find((g) => g.id === selectedGroup)?.name ?? ""}
            groupId={selectedGroup}
            date={date}
            startTime={startTime}
            endTime={endTime}
            subject={subject}
          />
        </motion.div>
      )}

      {selectedGroup ? (
        loadingStudents ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-display font-semibold text-sm">Student Roster</h3>
                  <p className="text-xs text-muted-foreground">{absentIds.size} absent of {groupStudents.length} students · {hours}h session</p>
                </div>
              </div>
              <button onClick={toggleAll} className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                {absentIds.size === groupStudents.length ? "Uncheck All" : "Check All"}
              </button>
            </div>

            <div className="divide-y divide-border/50">
              {groupStudents.map((s) => {
                const isAbsent = absentIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all duration-200 ${
                      isAbsent ? "bg-destructive/5" : "hover:bg-secondary/20"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isAbsent ? "bg-destructive border-destructive" : "border-muted-foreground/30"
                    }`}>
                      {isAbsent && <Check className="w-3 h-3 text-destructive-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isAbsent ? "text-destructive" : ""}`}>
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.cne} · Total: {s.total_absence_hours}h absent</p>
                    </div>
                    {isAbsent && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                        Absent
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-border flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={absentIds.size === 0 || submitMutation.isPending}
                className="btn-glow text-primary-foreground border-0 gap-2"
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit ({absentIds.size} absent)
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-display font-semibold mb-1">Select a Group</h3>
          <p className="text-sm text-muted-foreground">Choose a group above to view and mark student absences</p>
        </motion.div>
      )}
    </div>
    </>
  );
};

export default MarkAbsencePage;
