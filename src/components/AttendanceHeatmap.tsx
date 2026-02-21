import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const getColor = (val: number) => {
  if (val === 0) return "bg-secondary/40";
  if (val <= 2) return "bg-cyan-500/20";
  if (val <= 4) return "bg-cyan-500/40";
  if (val <= 6) return "bg-cyan-500/60";
  return "bg-cyan-500/80";
};

const AttendanceHeatmap = () => {
  const { data: heatRes, isLoading } = useQuery({
    queryKey: ["dashboard", "heatmap"],
    queryFn: () => api.getDashboardHeatmap(),
    refetchInterval: 10000,
  });

  const weeks = heatRes?.data ?? [];

  if (isLoading) {
    return <Skeleton className="w-full h-[120px] rounded-lg" />;
  }

  if (!weeks.length) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">No heatmap data yet</div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Day labels */}
      <div className="flex gap-1.5 pl-8">
        {days.map((d) => (
          <div key={d} className="flex-1 text-[10px] text-muted-foreground text-center">{d}</div>
        ))}
      </div>
      {/* Grid */}
      {weeks.map((weekRow) => (
        <div key={weekRow.week} className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-6">{weekRow.week}</span>
          {weekRow.days.map((val, di) => (
            <div
              key={di}
              className={`flex-1 aspect-square rounded-md ${getColor(val)} transition-all duration-200 hover:scale-110 cursor-pointer flex items-center justify-center`}
              title={`${days[di]}: ${val}h absences`}
            >
              {val > 0 && <span className="text-[9px] font-bold text-foreground">{val}</span>}
            </div>
          ))}
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 pt-2">
        <span className="text-[10px] text-muted-foreground">0h</span>
        <div className="w-3 h-3 rounded-sm bg-secondary/40" />
        <div className="w-3 h-3 rounded-sm bg-cyan-500/20" />
        <div className="w-3 h-3 rounded-sm bg-cyan-500/40" />
        <div className="w-3 h-3 rounded-sm bg-cyan-500/60" />
        <div className="w-3 h-3 rounded-sm bg-cyan-500/80" />
        <span className="text-[10px] text-muted-foreground">8h+</span>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;
