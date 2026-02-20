import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  title: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  delay?: number;
  color?: string;
}

const StatCard = ({ title, value, suffix = "", icon, trend, delay = 0, color }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="stat-card group"
      style={color ? { ["--stat-color" as string]: color } : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-display font-bold">{value.toLocaleString()}{suffix}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
