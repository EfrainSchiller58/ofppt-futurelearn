import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  justified: "bg-success/10 text-success",
  unjustified: "bg-destructive/10 text-destructive",
};

const RecentAbsences = () => {
  const { data: res, isLoading } = useQuery({
    queryKey: ["absences", "recent"],
    queryFn: () => api.getAbsences({ limit: 5, sort: "latest" }),
  });

  const absences = res?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-3 font-medium">Student</th>
            <th className="text-left py-3 font-medium">Group</th>
            <th className="text-left py-3 font-medium">Date</th>
            <th className="text-left py-3 font-medium">Hours</th>
            <th className="text-left py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {absences.map((a) => (
            <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-3 font-medium">{a.student_name}</td>
              <td className="py-3 text-muted-foreground">{a.group_name}</td>
              <td className="py-3 text-muted-foreground">{a.date}</td>
              <td className="py-3">{a.hours}h</td>
              <td className="py-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[a.status]}`}>
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
          {absences.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No recent absences</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecentAbsences;
