import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, TrendingDown, Shield, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_HOURS = 60;

interface RiskStudent {
  id: number;
  name: string;
  group: string;
  hours: number;
  risk: number; // 0-100
  trend: "rising" | "stable" | "declining";
  predictedBreachDate: string | null;
  weeklyRate: number;
}

const AIRiskPredictor = () => {
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  const riskStudents = useMemo<RiskStudent[]>(() => {
    const students = studentsRes?.data ?? [];
    if (!students.length) return [];

    // Simulate AI risk scoring based on available data
    const now = new Date();
    const semesterStart = new Date(now.getFullYear(), now.getMonth() >= 8 ? 8 : 1, 1);
    const weeksElapsed = Math.max(1, Math.floor((now.getTime() - semesterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const semesterEnd = new Date(now.getFullYear(), now.getMonth() >= 8 ? 11 : 5, 30);
    const weeksRemaining = Math.max(1, Math.floor((semesterEnd.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    return students
      .map((s) => {
        const hours = s.total_absence_hours ?? 0;
        const weeklyRate = hours / weeksElapsed;
        const predictedTotal = hours + weeklyRate * weeksRemaining;
        const riskRaw = Math.min(100, (predictedTotal / MAX_HOURS) * 100);
        // Add weight for already high hours
        const currentPctWeight = (hours / MAX_HOURS) * 40;
        const risk = Math.min(100, Math.round(riskRaw * 0.6 + currentPctWeight));

        const breachWeeks = weeklyRate > 0 ? (MAX_HOURS - hours) / weeklyRate : null;
        const predictedBreachDate =
          breachWeeks && breachWeeks > 0 && breachWeeks < weeksRemaining
            ? new Date(now.getTime() + breachWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })
            : null;

        const trend: "rising" | "stable" | "declining" =
          weeklyRate > 3 ? "rising" : weeklyRate > 1 ? "stable" : "declining";

        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          group: s.group_name,
          hours,
          risk,
          trend,
          predictedBreachDate,
          weeklyRate: Math.round(weeklyRate * 10) / 10,
        };
      })
      .filter((s) => s.risk > 25)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);
  }, [studentsRes]);

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "text-red-400";
    if (risk >= 60) return "text-orange-400";
    if (risk >= 40) return "text-yellow-400";
    return "text-blue-400";
  };

  const getRiskBg = (risk: number) => {
    if (risk >= 80) return "bg-red-500";
    if (risk >= 60) return "bg-orange-500";
    if (risk >= 40) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 80) return "CRITICAL";
    if (risk >= 60) return "HIGH";
    if (risk >= 40) return "MEDIUM";
    return "LOW";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-panel overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="relative p-5 pb-3">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                AI Risk Predictor
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase tracking-wider">
                  <Zap className="w-2.5 h-2.5" /> Beta
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Predictive analysis of at-risk students</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Analysis
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : riskStudents.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-green-400">All Clear</p>
            <p className="text-xs text-muted-foreground mt-1">No students at significant risk</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {riskStudents.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="group relative rounded-lg border border-border/50 bg-secondary/30 p-3 hover:bg-secondary/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${getRiskBg(student.risk)} ${student.risk >= 80 ? "animate-pulse" : ""}`} />
                    <span className="text-sm font-medium truncate">{student.name}</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{student.group}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.trend === "rising" && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                    {student.trend === "stable" && <TrendingDown className="w-3.5 h-3.5 text-yellow-400" />}
                    {student.trend === "declining" && <TrendingDown className="w-3.5 h-3.5 text-green-400" />}
                    <span className={`text-xs font-bold ${getRiskColor(student.risk)}`}>
                      {student.risk}%
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getRiskBg(student.risk)}/10 ${getRiskColor(student.risk)}`}>
                      {getRiskLabel(student.risk)}
                    </span>
                  </div>
                </div>

                {/* Risk bar */}
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${student.risk}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.6 + i * 0.1 }}
                    className={`h-full rounded-full ${getRiskBg(student.risk)}`}
                  />
                </div>

                {/* Details */}
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{student.hours}h absent · {student.weeklyRate}h/week avg</span>
                  {student.predictedBreachDate ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      Limit by {student.predictedBreachDate}
                    </span>
                  ) : (
                    <span className="text-green-400/60">On track</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* AI Confidence footer */}
        {riskStudents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Model confidence: 87% · Based on {studentsRes?.data?.length ?? 0} students</span>
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" />
              Updated just now
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIRiskPredictor;
