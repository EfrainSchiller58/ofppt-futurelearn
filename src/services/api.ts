import type {
  ApiResponse,
  LoginResponse,
  User,
  Student,
  Teacher,
  Group,
  Absence,
  Justification,
  DashboardStats,
  CreateStudentPayload,
  CreateTeacherPayload,
  CreateGroupPayload,
  CreateAbsencePayload,
  AbsenceFilters,
} from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `Request failed (${res.status})`);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────
export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request<void>("/logout", { method: "POST" });
  },

  getMe() {
    return request<User>("/me");
  },

  updateProfile(data: { first_name?: string; last_name?: string; email?: string; phone?: string; profile_image?: File | null }) {
    const formData = new FormData();
    formData.append("_method", "PATCH");
    if (data.first_name !== undefined) formData.append("first_name", data.first_name);
    if (data.last_name !== undefined) formData.append("last_name", data.last_name);
    if (data.email !== undefined) formData.append("email", data.email);
    if (data.phone !== undefined) formData.append("phone", data.phone);
    if (data.profile_image) formData.append("profile_image", data.profile_image);

    return request<{ data: User }>("/me/profile", {
      method: "POST",
      body: formData,
    }).then(res => res.data);
  },

  changePassword(data: { current_password?: string; new_password: string; new_password_confirmation: string }) {
    return request<{ message: string; user: User }>("/me/change-password", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // ─── Dashboard ─────────────────────────────────────
  getDashboardStats(role: string) {
    return request<ApiResponse<DashboardStats>>(`/dashboard/${role}`);
  },

  getDashboardChart() {
    return request<ApiResponse<{ month: string; attendance: number; absences: number }[]>>("/dashboard/chart");
  },

  getDashboardHeatmap() {
    return request<ApiResponse<{ week: string; days: number[] }[]>>("/dashboard/heatmap");
  },

  // ─── Students ──────────────────────────────────────
  getStudents() {
    return request<ApiResponse<Student[]>>("/students");
  },

  createStudent(data: CreateStudentPayload) {
    return request<{ data: Student; credentials?: { email: string; password: string } }>("/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStudent(id: number, data: Partial<CreateStudentPayload>) {
    return request<ApiResponse<Student>>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteStudent(id: number) {
    return request<void>(`/students/${id}`, { method: "DELETE" });
  },

  // ─── Teachers ──────────────────────────────────────
  getTeachers() {
    return request<ApiResponse<Teacher[]>>("/teachers");
  },

  createTeacher(data: CreateTeacherPayload) {
    return request<{ data: Teacher; credentials?: { email: string; password: string } }>("/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTeacher(id: number, data: Partial<CreateTeacherPayload>) {
    return request<ApiResponse<Teacher>>(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTeacher(id: number) {
    return request<void>(`/teachers/${id}`, { method: "DELETE" });
  },

  // ─── Groups ────────────────────────────────────────
  getGroups() {
    return request<ApiResponse<Group[]>>("/groups");
  },

  getGroupStudents(groupId: number) {
    return request<ApiResponse<Student[]>>(`/groups/${groupId}/students`);
  },

  createGroup(data: CreateGroupPayload) {
    return request<ApiResponse<Group>>("/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateGroup(id: number, data: Partial<CreateGroupPayload>) {
    return request<ApiResponse<Group>>(`/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteGroup(id: number) {
    return request<void>(`/groups/${id}`, { method: "DELETE" });
  },

  // ─── Absences ──────────────────────────────────────
  getAbsences(filters?: AbsenceFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "") params.append(key, String(val));
      });
    }
    const qs = params.toString();
    return request<ApiResponse<Absence[]>>(`/absences${qs ? `?${qs}` : ""}`);
  },

  createAbsence(data: CreateAbsencePayload) {
    return request<ApiResponse<Absence[]>>("/absences", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ─── Justifications ────────────────────────────────
  getJustifications() {
    return request<ApiResponse<Justification[]>>("/justifications");
  },

  createJustification(formData: FormData) {
    return request<ApiResponse<Justification>>("/justifications", {
      method: "POST",
      body: formData,
    });
  },

  approveJustification(id: number, reviewNote?: string) {
    return request<ApiResponse<Justification>>(`/justifications/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ review_note: reviewNote }),
    });
  },

  rejectJustification(id: number, reviewNote?: string) {
    return request<ApiResponse<Justification>>(`/justifications/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ review_note: reviewNote }),
    });
  },

  // ─── Notifications ───────────────────────────────
  getNotifications() {
    return request<ApiResponse<{ id: number; title: string; message: string; type: string; read: boolean; createdAt: string }[]>>("/notifications");
  },

  markNotificationRead(id: number) {
    return request<void>(`/notifications/${id}/read`, { method: "PATCH" });
  },

  markAllNotificationsRead() {
    return request<void>("/notifications/read-all", { method: "PATCH" });
  },

  clearNotifications() {
    return request<void>("/notifications/clear", { method: "DELETE" });
  },
};
