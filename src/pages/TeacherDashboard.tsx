import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Users, Briefcase } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const TeacherDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const greeting = getGreeting();
  const navigate = useNavigate();

  const { data: statsRes, isLoading } = useQuery({
    queryKey: ["dashboard", "teacher"],
    queryFn: () => api.getDashboardStats("teacher"),
  });

  const stats = statsRes?.data;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">{greeting}, Prof. {user?.last_name ?? "Teacher"} &#x1F44B;</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your classes and mark attendance</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
          <Briefcase className="w-3.5 h-3.5" /> Teacher
        </span>
        <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard title="My Groups" value={stats?.my_groups ?? 0} icon={<BookOpen className="w-5 h-5" />} delay={0} />
            <StatCard title="Students" value={stats?.my_students ?? 0} icon={<Users className="w-5 h-5" />} delay={0.1} />
            <StatCard title="Today's Absences" value={stats?.today_absences ?? 0} icon={<ClipboardList className="w-5 h-5" />} delay={0.2} />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-8 text-center cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate("/teacher/mark")}
      >
        <ClipboardList className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="font-display font-semibold mb-1">Mark Attendance</h3>
        <p className="text-sm text-muted-foreground mb-4">Select a group and start marking absences</p>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-glow text-primary-foreground text-sm font-medium">
          <ClipboardList className="w-4 h-4" /> Start Marking
        </span>
      </motion.div>
    </div>
  );
};

export default TeacherDashboard;
