import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ClipboardList, Calendar, Clock, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportAbsencesCSV } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  justified: "bg-emerald-500/10 text-emerald-400",
  unjustified: "bg-destructive/10 text-destructive",
};

const AdminAbsencesPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: absencesRes, isLoading: loadingAbsences } = useQuery({
    queryKey: ["absences", { group: groupFilter, status: statusFilter, date: dateFilter, search }],
    queryFn: () => api.getAbsences({ group: groupFilter, status: statusFilter, date: dateFilter, search }),
  });

  const { data: groupsRes } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.getGroups(),
  });

  const absences = absencesRes?.data ?? [];
  const groups = groupsRes?.data ?? [];

  const filtered = absences; // Filtering is done server-side
  const totalHours = filtered.reduce((sum, a) => sum + a.hours, 0);

  const statusCounts = useMemo(() => ({
    total: absences.length,
    pending: absences.filter((a) => a.status === "pending").length,
    justified: absences.filter((a) => a.status === "justified").length,
    unjustified: absences.filter((a) => a.status === "unjustified").length,
  }), [absences]);

  if (loadingAbsences) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Absences</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} records · {totalHours}h total</p>
        </div>
        <Button variant="outline" className="gap-2 border-white/[0.08]" onClick={() => { exportAbsencesCSV(filtered as any); toast({ title: "Export Complete", description: `${filtered.length} records exported to CSV` }); }}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: statusCounts.total, color: "text-foreground" },
          { label: "Pending", value: statusCounts.pending, color: "text-warning" },
          { label: "Justified", value: statusCounts.justified, color: "text-emerald-400" },
          { label: "Unjustified", value: statusCounts.unjustified, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="glass-panel p-4 text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, subject, teacher..." className="pl-10 input-glass" />
        </div>
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="h-10 px-3 rounded-md bg-secondary/50 border border-white/[0.08] text-sm text-foreground appearance-none cursor-pointer min-w-[130px]">
          <option value="">All Groups</option>
          {groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-md bg-secondary/50 border border-white/[0.08] text-sm text-foreground appearance-none cursor-pointer min-w-[130px]">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="justified">Justified</option>
          <option value="unjustified">Unjustified</option>
        </select>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-glass w-auto" />
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Group</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Time</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Subject</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Hours</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{a.student_name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{a.group_name} · {a.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{a.group_name}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{a.date}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{a.start_time} – {a.end_time}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{a.subject}</td>
                    <td className="py-3 px-4 font-medium">{a.hours}h</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[a.status]}`}>{a.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No absences found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAbsencesPage;
