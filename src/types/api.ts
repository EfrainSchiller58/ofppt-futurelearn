// API response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Auth
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  profile_image?: string | null;
  role: "admin" | "teacher" | "student";
  is_active: boolean;
  must_change_password?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Domain models (matching MySQL schema)
export interface Student {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  cne: string;
  phone: string;
  group_id: number;
  group_name: string;
  total_absence_hours: number;
}

export interface Teacher {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  phone?: string;
  groups_assigned: string[];
}

export interface Group {
  id: number;
  name: string;
  level: string;
  student_count: number;
  teacher_count?: number;
}

export interface Absence {
  id: number;
  student_id: number;
  student_name: string;
  group_name: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  subject: string;
  teacher_name: string;
  notes: string;
  status: "pending" | "justified" | "unjustified";
}

export interface Justification {
  id: number;
  absence_id: number;
  student_name: string;
  date: string;
  hours: number;
  reason: string;
  file_name: string;
  file_type: "pdf" | "image";
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  review_note?: string;
}

export interface DashboardStats {
  total_students?: number;
  total_teachers?: number;
  absence_rate?: number;
  pending_reviews?: number;
  my_groups?: number;
  my_students?: number;
  today_absences?: number;
  absence_hours?: number;
  pending_justifications?: number;
  unjustified_count?: number;
  attendance_rate?: number;
  justified_hours?: number;
  unjustified_hours?: number;
  pending_hours?: number;
}

// Request payloads
export interface CreateStudentPayload {
  first_name: string;
  last_name: string;
  cne: string;
  phone: string;
  group_id: number;
}

export interface CreateTeacherPayload {
  first_name: string;
  last_name: string;
  subject: string;
  phone?: string;
}

export interface CreateGroupPayload {
  name: string;
  level: string;
}

export interface CreateAbsencePayload {
  student_ids: number[];
  group_id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  notes?: string;
}

export interface AbsenceFilters {
  group?: string;
  status?: string;
  date?: string;
  search?: string;
  teacher_id?: string;
  limit?: number;
  sort?: string;
}
