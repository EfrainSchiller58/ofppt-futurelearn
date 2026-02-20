

# Frontend API Integration Plan

## Summary

Replace all mock/hardcoded data with real API calls to `http://localhost:8000/api`, add proper authentication with Laravel Sanctum token storage, and implement loading/error states across all pages.

---

## Files to Create

### 1. `src/services/api.ts` -- Centralized API client
- Axios-like wrapper around `fetch()` with base URL `http://localhost:8000/api`
- Automatically attaches `Authorization: Bearer <token>` header from stored token
- Handles 401 responses by redirecting to `/login`
- Exports typed functions for every endpoint:
  - `login(email, password)`, `logout()`, `getMe()`
  - `getStudents()`, `createStudent()`, `updateStudent()`, `deleteStudent()`
  - `getTeachers()`, `createTeacher()`, `updateTeacher()`, `deleteTeacher()`
  - `getGroups()`, `createGroup()`, `updateGroup()`, `deleteGroup()`
  - `getAbsences(filters?)`, `createAbsence(data)`
  - `getJustifications()`, `createJustification(formData)` (multipart for file upload)
  - `approveJustification(id, note)`, `rejectJustification(id, note)`
  - `getDashboardStats(role)`

### 2. `src/stores/authStore.ts` -- Authentication state (Zustand)
- Stores: `user` (with id, name, email, role), `token`, `isAuthenticated`, `isLoading`
- `login()` calls `POST /api/login`, stores token in `localStorage`, fetches user via `GET /api/me`
- `logout()` calls `POST /api/logout`, clears token and user
- `checkAuth()` on app load -- reads token from localStorage, calls `GET /api/me` to validate
- Token stored as `auth_token` in localStorage (compatible with Laravel Sanctum)

### 3. `src/types/api.ts` -- Shared TypeScript interfaces
- Move and update interfaces from `mockData.ts` to match the MySQL schema response shapes
- Add `ApiResponse<T>`, `PaginatedResponse<T>`, `User`, `Student`, `Teacher`, `Group`, `Absence`, `Justification`, `DashboardStats`

---

## Files to Modify

### 4. `src/App.tsx` -- Auth-aware routing
- Remove hardcoded `ProtectedRoute` that reads from `localStorage.getItem("user")`
- Replace with auth store-based protection: `useAuthStore()` to check `isAuthenticated` and `user.role`
- Add an `AuthProvider` wrapper that calls `checkAuth()` on mount (validates token with backend)
- Show a loading spinner while auth is being verified

### 5. `src/pages/LoginPage.tsx` -- Real authentication
- Remove `DEMO_USERS` object and `quickLogin()` function
- Call `authStore.login(email, password)` which hits `POST /api/login`
- Handle API errors (invalid credentials, network errors) with toast messages
- On success, navigate based on `user.role` from the API response
- Keep the demo quick-login buttons but they just pre-fill the form fields (credentials must still go through API)

### 6. `src/components/DashboardLayout.tsx` -- Real logout
- Replace `localStorage.removeItem("user")` with `authStore.logout()` which calls `POST /api/logout`
- Display actual user name from auth store instead of generic "Admin Panel"

### 7. `src/pages/AdminDashboard.tsx` -- Fetch dashboard stats
- Replace hardcoded stat values (1248, 86, 8.4%, 23) with data from `GET /api/dashboard/admin`
- Add loading skeleton while data loads
- Use `useQuery` from TanStack React Query for caching

### 8. `src/pages/TeacherDashboard.tsx` -- Fetch teacher stats
- Replace hardcoded values (4, 112, 7) with `GET /api/dashboard/teacher`
- Add loading state

### 9. `src/pages/StudentDashboard.tsx` -- Fetch student stats
- Replace hardcoded values (24, 2, 3, 91.6%) with `GET /api/dashboard/student`
- Add loading state

### 10. `src/pages/StudentsPage.tsx` -- Full CRUD via API
- Remove `import { mockStudents, mockGroups } from "@/data/mockData"`
- Fetch students via `useQuery` calling `GET /api/students`
- Fetch groups via `useQuery` calling `GET /api/groups`
- `handleSave()` calls `POST /api/students` or `PUT /api/students/{id}`
- `handleDelete()` calls `DELETE /api/students/{id}`
- Add loading skeletons and error states
- Invalidate query cache after mutations

### 11. `src/pages/TeachersPage.tsx` -- Full CRUD via API
- Remove hardcoded `initialTeachers` array
- Fetch via `GET /api/teachers`, create/update/delete via API
- Add loading and error states

### 12. `src/pages/GroupsPage.tsx` -- Full CRUD via API
- Remove `import { mockStudents }` and `initialGroups`
- Fetch groups via `GET /api/groups` (response includes student_count computed by backend)
- Fetch group students via `GET /api/groups/{id}/students`
- CRUD operations via API

### 13. `src/pages/AdminAbsencesPage.tsx` -- Fetch from API
- Remove `import { mockAbsences, mockGroups }`
- Fetch absences via `GET /api/absences` with query params for filters
- Fetch groups for filter dropdown via `GET /api/groups`

### 14. `src/pages/AdminJustificationsPage.tsx` -- Review via API
- Remove `import { mockJustifications }`
- Fetch via `GET /api/justifications`
- Approve: `PATCH /api/justifications/{id}/approve` with review note
- Reject: `PATCH /api/justifications/{id}/reject` with review note

### 15. `src/pages/MarkAbsencePage.tsx` -- Submit to API
- Remove `import { mockStudents, mockGroups }`
- Fetch groups via `GET /api/groups` (only groups assigned to current teacher)
- Fetch students by group via `GET /api/groups/{id}/students`
- Submit absences via `POST /api/absences` with `student_ids[]`, date, times, subject, notes

### 16. `src/pages/TeacherHistoryPage.tsx` -- Fetch from API
- Remove `import { mockAbsences, mockGroups }`
- Fetch via `GET /api/absences?teacher_id=me` (backend filters by authenticated teacher)

### 17. `src/pages/StudentAbsencesPage.tsx` -- Fetch student's own absences
- Remove `import { mockAbsences }`
- Fetch via `GET /api/absences` (backend filters by authenticated student automatically)

### 18. `src/pages/JustificationsPage.tsx` -- Submit via API
- Remove `import { mockJustifications, mockAbsences }`
- Fetch own justifications via `GET /api/justifications`
- Fetch unjustified absences via `GET /api/absences?status=pending,unjustified`
- Submit justification via `POST /api/justifications` as `multipart/form-data` (real file upload)

### 19. `src/components/RecentAbsences.tsx` -- Fetch from API
- Remove hardcoded `absences` array
- Accept data as props from parent (AdminDashboard) or fetch via `GET /api/absences?limit=5&sort=latest`

### 20. `src/utils/exportUtils.ts` -- Remove mock imports
- Remove `import { mockAbsences, mockStudents }` (these imports are unused -- the functions already accept data as parameters)
- Keep the export functions as-is since they work with passed-in data

### 21. `src/data/mockData.ts` -- DELETE this file
- All interfaces move to `src/types/api.ts`
- All mock data arrays are removed entirely

---

## Technical Details

### Authentication Flow
```text
Login -> POST /api/login -> receive { token, user }
       -> store token in localStorage as "auth_token"
       -> store user in Zustand authStore
       -> redirect to role-based dashboard

App Load -> read "auth_token" from localStorage
         -> GET /api/me with Bearer token
         -> if valid: populate authStore, allow access
         -> if 401: clear token, redirect to /login
```

### API Client Pattern
- Every API function returns typed responses
- All requests include `Authorization: Bearer <token>` and `Accept: application/json`
- 401 responses trigger automatic logout
- Network errors show toast notifications

### Loading States
- Each page that fetches data will show skeleton loaders (using existing Skeleton component) while loading
- Error states show a retry button
- TanStack React Query handles caching, refetching, and stale data

### Expected Laravel API Response Formats
The frontend will expect JSON responses like:
- `GET /api/students` returns `{ data: Student[] }`
- `POST /api/login` returns `{ token: string, user: User }`
- `GET /api/me` returns `{ id, first_name, last_name, email, role }`
- Error responses: `{ message: string, errors?: Record<string, string[]> }`

