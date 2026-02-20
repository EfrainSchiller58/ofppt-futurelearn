import type { Absence, Student } from "@/types/api";

const escapeCSV = (val: string) => `"${String(val).replace(/"/g, '""')}"`;

export const exportAbsencesCSV = (absences: Absence[], filename = "absences_report") => {
  const headers = ["Student", "Group", "Date", "Start Time", "End Time", "Hours", "Subject", "Teacher", "Status", "Notes"];
  const rows = absences.map((a) => [
    a.student_name, a.group_name, a.date, a.start_time, a.end_time,
    String(a.hours), a.subject, a.teacher_name, a.status, a.notes,
  ]);

  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
};

export const exportStudentsCSV = (students: Student[], filename = "students_report") => {
  const headers = ["First Name", "Last Name", "Email", "CNE", "Group", "Phone", "Absence Hours"];
  const rows = students.map((s) => [
    s.first_name, s.last_name, s.email, s.cne, s.group_name, s.phone, String(s.total_absence_hours),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob(["\uFEFF" + content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
