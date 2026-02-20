import { useMemo } from "react";
import { motion } from "framer-motion";
import { Scan, Calendar, AlertCircle, BarChart3, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PatternResult {
  studentId: number;
  studentName: string;
  group: string;
  pattern: string;
  dayIndex: number;
  count: number;
  percentage: number;
  severity: "critical" | "warning" | "info";
}

const SmartPatternDetector = () => {
  const { data: absencesRes, isLoading } = useQuery({
    queryKey: ["absences"],
    queryFn: () => api.getAbsences({ limit: 500 }),
  });

  const patterns = useMemo<PatternResult[]>(() => {
    const absences = absencesRes?.data ?? [];
    if (!absences.length) return [];

    // Group absences by student
    const studentMap = new Map<
      string,
      { name: string; group: string; dates: string[]; id: number }
    >();

    absences.forEach((a) => {
      const key = a.student_name;
      if (!studentMap.has(key)) {
        studentMap.set(key, { name: a.student_name, group: a.group_name, dates: [], id: a.student_id });
      }
      studentMap.get(key)!.dates.push(a.date);
    });

    const results: PatternResult[] = [];

    studentMap.forEach(({ name, group, dates, id }) => {
      if (dates.length < 3) return; // Need at least 3 absences to detect a pattern

      // Count absences per day of week
      const dayCounts = [0, 0, 0, 0, 0, 0]; // Mon-Sat
      dates.forEach((d) => {
        const day = new Date(d).getDay();
        const idx = day === 0 ? 5 : day - 1; // Sun→5, Mon→0, ...
        dayCounts[idx]++;
      });

      const total = dates.length;
      const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
      const maxCount = dayCounts[maxDay];
      const pct = Math.round((maxCount / total) * 100);

      // Only flag if >40% of absences are on the same day and count >= 3
      if (pct >= 40 && maxCount >= 3) {
        const severity: "critical" | "warning" | "info" =
          pct >= 70 ? "critical" : pct >= 55 ? "warning" : "info";

        results.push({
          studentId: id,
          studentName: name,
          group,
          pattern: `${pct}% of absences on ${DAYS_EN[maxDay]}s`,
          dayIndex: maxDay,
          count: maxCount,
          percentage: pct,
          severity,
        });
      }
    });

    return results.sort((a, b) => b.percentage - a.percentage).slice(0, 8);
  }, [absencesRes]);

  const getSeverityColor = (severity: string) => {
    if (severity === "critical") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (severity === "warning") return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  };

  const getSeverityLabel = (severity: string) => {
    if (severity === "critical") return "SUSPICIOUS";
    if (severity === "warning") return "NOTABLE";
    return "PATTERN";
  };

  // Compute global day-of-week distribution
  const globalDayDist = useMemo(() => {
    const absences = absencesRes?.data ?? [];
    const counts = [0, 0, 0, 0, 0, 0];
    absences.forEach((a) => {
      const day = new Date(a.date).getDay();
      const idx = day === 0 ? 5 : day - 1;
      counts[idx]++;
    });
    const max = Math.max(...counts, 1);
    return counts.map((c) => ({ count: c, pct: Math.round((c / max) * 100) }));
  }, [absencesRes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-panel overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-5 pb-3">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/3 via-transparent to-red-500/3" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <Scan className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                Pattern Detector
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 uppercase tracking-wider">
                  <Eye className="w-2.5 h-2.5" /> AI
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Detects students always absent on the same day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Day-of-week distribution chart */}
      <div className="px-5 pb-3">
        <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
          <BarChart3 className="w-3 h-3" /> Global absence distribution by day
        </p>
        <div className="flex items-end gap-1.5 h-12">
          {globalDayDist.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(d.pct, 4)}%` }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                className={`w-full rounded-t ${
                  d.pct > 70
                    ? "bg-red-500"
                    : d.pct > 40
                    ? "bg-orange-500"
                    : "bg-cyan-500/60"
                }`}
                style={{ minHeight: "2px" }}
              />
              <span className="text-[9px] text-muted-foreground">{DAYS_FR[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-green-400">No Patterns Detected</p>
            <p className="text-[10px] text-muted-foreground mt-1">Absences are randomly distributed — no suspicious patterns</p>
          </div>
        ) : (
          <div className="space-y-1.5 mt-2">
            {patterns.map((p, i) => (
              <motion.div
                key={p.studentId}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className={`rounded-lg border p-3 ${getSeverityColor(p.severity)} bg-opacity-50`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium truncate">{p.studentName}</span>
                    <span className="text-[10px] text-muted-foreground">{p.group}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {getSeverityLabel(p.severity)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] opacity-80">{p.pattern}</p>
                  <div className="flex items-center gap-1">
                    {DAYS_FR.map((d, di) => (
                      <span
                        key={d}
                        className={`w-5 h-5 rounded text-[8px] flex items-center justify-center font-bold ${
                          di === p.dayIndex
                            ? p.severity === "critical"
                              ? "bg-red-500 text-white"
                              : p.severity === "warning"
                              ? "bg-orange-500 text-white"
                              : "bg-blue-500 text-white"
                            : "bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        {d[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        {patterns.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{patterns.filter((p) => p.severity === "critical").length} suspicious, {patterns.filter((p) => p.severity === "warning").length} notable patterns</span>
            <span className="flex items-center gap-1">
              <Scan className="w-3 h-3 text-orange-400" />
              Analyzed {absencesRes?.data?.length ?? 0} records
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SmartPatternDetector;
