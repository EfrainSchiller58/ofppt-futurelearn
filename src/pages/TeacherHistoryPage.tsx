import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Clock, BookOpen, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  justified: "bg-emerald-500/10 text-emerald-400",
  unjustified: "bg-destructive/10 text-destructive",
};

const TeacherHistoryPage = () => {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: absencesRes, isLoading } = useQuery({
    queryKey: ["absences", "teacher-history"],
    queryFn: () => api.getAbsences(),
  });

  const myAbsences = absencesRes?.data ?? [];

  const filtered = useMemo(() => {
    return myAbsences.filter((a) => {
      const matchSearch = `${a.student_name} ${a.subject}`.toLowerCase().includes(search.toLowerCase());
      const matchGroup = !groupFilter || a.group_name === groupFilter;
      const matchDate = !dateFilter || a.date === dateFilter;
      return matchSearch && matchGroup && matchDate;
    });
  }, [myAbsences, search, groupFilter, dateFilter]);

  const myGroups = [...new Set(myAbsences.map((a) => a.group_name))];
  const totalHours = filtered.reduce((sum, a) => sum + a.hours, 0);

  const groupedByDate = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Attendance History</h1>
        <p className="text-muted-foreground text-sm mt-1">{filtered.length} records · {totalHours}h total absences marked</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{myGroups.length}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Groups</p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-2xl font-display font-bold">{myAbsences.length}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Users className="w-3.5 h-3.5" /> Records</p>
        </div>
        <div className="glass-panel p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-display font-bold text-warning">{totalHours}h</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> Total Hours</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or subject..." className="pl-10 input-glass" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="pl-10 pr-4 h-10 rounded-md bg-secondary/50 border border-white/[0.08] text-sm text-foreground appearance-none cursor-pointer min-w-[130px]">
            <option value="">All Groups</option>
            {myGroups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-glass w-auto" />
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {groupedByDate.map(([date, absences], di) => (
            <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.05 }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">{new Date(date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground">{absences.length} absence(s) · {absences.reduce((s, a) => s + a.hours, 0)}h</p>
                </div>
              </div>

              <div className="ml-4 border-l-2 border-border/50 pl-6 space-y-3">
                {absences.map((a) => (
                  <div key={a.id} className="glass-panel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{a.student_name}</p>
                        <p className="text-xs text-muted-foreground">{a.subject} · {a.group_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.start_time} – {a.end_time}</span>
                          <span>{a.hours}h</span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${statusColors[a.status]}`}>{a.status}</span>
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{a.notes}"</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {groupedByDate.length === 0 && (
          <div className="glass-panel text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No records found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherHistoryPage;
