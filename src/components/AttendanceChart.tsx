import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const fallbackData = [
  { month: "Sep", attendance: 0, absences: 0, count: 0 },
  { month: "Oct", attendance: 0, absences: 0, count: 0 },
  { month: "Nov", attendance: 0, absences: 0, count: 0 },
  { month: "Dec", attendance: 0, absences: 0, count: 0 },
  { month: "Jan", attendance: 0, absences: 0, count: 0 },
  { month: "Feb", attendance: 0, absences: 0, count: 0 },
];

const AttendanceChart = () => {
  const { data: chartRes, isLoading } = useQuery({
    queryKey: ["dashboard", "chart"],
    queryFn: () => api.getDashboardChart(),
    refetchInterval: 10000,
  });

  const data = chartRes?.data?.length ? chartRes.data : fallbackData;

  if (isLoading) {
    return <Skeleton className="w-full h-[260px] rounded-lg" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="absenceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(260, 70%, 60%)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(260, 70%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
        <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
        <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} unit="h" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(222, 44%, 10%)",
            border: "1px solid hsl(222, 30%, 18%)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => {
            if (name === "absences") return [`${value}h`, "Absence Hours"];
            if (name === "attendance") return [`${value}h`, "Attendance Hours"];
            if (name === "count") return [value, "Absence Count"];
            return [value, name];
          }}
        />
        <Area type="monotone" dataKey="attendance" stroke="hsl(190, 90%, 50%)" fill="url(#attendanceGrad)" strokeWidth={2} name="attendance" />
        <Area type="monotone" dataKey="absences" stroke="hsl(260, 70%, 60%)" fill="url(#absenceGrad)" strokeWidth={2} name="absences" />
        <Line type="monotone" dataKey="count" stroke="hsl(340, 82%, 60%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(340, 82%, 60%)" }} activeDot={{ r: 6 }} name="count" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
