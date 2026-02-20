# Laravel Backend Guide — OFPPT Smart Attendance

> This guide provides **copy-paste ready** code for building the Laravel API that matches the React frontend.

---

## 1. Project Setup

```bash
composer create-project laravel/laravel ofppt-attendance
cd ofppt-attendance

# Install Sanctum for API token auth
php artisan install:api

# Configure .env
# DB_CONNECTION=mysql
# DB_DATABASE=ofppt_attendance
# DB_USERNAME=root
# DB_PASSWORD=
# SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

---

## 2. Migration Files

Run: `php artisan make:migration create_xxxxx_table` for each, then paste the content.

### `create_groups_table.php`
```php
public function up(): void
{
    Schema::create('groups', function (Blueprint $table) {
        $table->id();
        $table->string('name', 50)->unique();
        $table->string('level', 50);
        $table->timestamps();

        $table->index('level');
    });
}
```

### `create_students_table.php`
```php
public function up(): void
{
    Schema::create('students', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
        $table->string('cne', 20)->unique();
        $table->string('phone', 20)->nullable();
        $table->foreignId('group_id')->constrained()->restrictOnDelete();
        $table->timestamps();

        $table->index('group_id');
        $table->index('cne');
    });
}
```

### `create_teachers_table.php`
```php
public function up(): void
{
    Schema::create('teachers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
        $table->string('subject', 100);
        $table->timestamps();
    });
}
```

### `create_teacher_groups_table.php`
```php
public function up(): void
{
    Schema::create('teacher_groups', function (Blueprint $table) {
        $table->id();
        $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
        $table->foreignId('group_id')->constrained()->cascadeOnDelete();
        $table->unique(['teacher_id', 'group_id']);
    });
}
```

### `create_absences_table.php`
```php
public function up(): void
{
    Schema::create('absences', function (Blueprint $table) {
        $table->id();
        $table->foreignId('student_id')->constrained()->cascadeOnDelete();
        $table->foreignId('teacher_id')->constrained()->restrictOnDelete();
        $table->foreignId('group_id')->constrained()->restrictOnDelete();
        $table->date('date');
        $table->time('start_time');
        $table->time('end_time');
        $table->decimal('hours', 4, 2)->storedAs(
            "TIMESTAMPDIFF(MINUTE, CONCAT(date, ' ', start_time), CONCAT(date, ' ', end_time)) / 60"
        );
        $table->string('subject', 100);
        $table->text('notes')->nullable();
        $table->enum('status', ['pending', 'justified', 'unjustified'])->default('pending');
        $table->timestamps();

        $table->index('student_id');
        $table->index('teacher_id');
        $table->index('group_id');
        $table->index('date');
        $table->index('status');
        $table->index(['student_id', 'date']);
    });
}
```

### `create_justifications_table.php`
```php
public function up(): void
{
    Schema::create('justifications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('absence_id')->constrained()->cascadeOnDelete();
        $table->text('reason');
        $table->string('file_name', 255);
        $table->string('file_path', 500);
        $table->enum('file_type', ['pdf', 'image']);
        $table->unsignedInteger('file_size')->nullable();
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
        $table->text('review_note')->nullable();
        $table->timestamp('reviewed_at')->nullable();
        $table->timestamp('submitted_at')->useCurrent();
        $table->timestamps();

        $table->index('absence_id');
        $table->index('status');
        $table->index('reviewed_by');
    });
}
```

### Update `create_users_table.php`
```php
public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('first_name', 100);
        $table->string('last_name', 100);
        $table->string('email')->unique();
        $table->string('password');
        $table->enum('role', ['admin', 'teacher', 'student']);
        $table->boolean('is_active')->default(true);
        $table->rememberToken();
        $table->timestamps();

        $table->index('role');
        $table->index('email');
    });
}
```

---

## 3. Models

### `app/Models/User.php`
```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'password', 'role', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function teacher()
    {
        return $this->hasOne(Teacher::class);
    }
}
```

### `app/Models/Group.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $fillable = ['name', 'level'];

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'teacher_groups');
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }
}
```

### `app/Models/Student.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = ['user_id', 'cne', 'phone', 'group_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }
}
```

### `app/Models/Teacher.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $fillable = ['user_id', 'subject'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'teacher_groups');
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }
}
```

### `app/Models/Absence.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    protected $fillable = [
        'student_id', 'teacher_id', 'group_id',
        'date', 'start_time', 'end_time',
        'subject', 'notes', 'status',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function justification()
    {
        return $this->hasOne(Justification::class);
    }
}
```

### `app/Models/Justification.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Justification extends Model
{
    protected $fillable = [
        'absence_id', 'reason', 'file_name', 'file_path',
        'file_type', 'file_size', 'status',
        'reviewed_by', 'review_note', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function absence()
    {
        return $this->belongsTo(Absence::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
```

---

## 4. API Resource Classes

Generate with: `php artisan make:resource XxxxxResource`

### `app/Http/Resources/UserResource.php`
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'first_name' => $this->first_name,
            'last_name'  => $this->last_name,
            'email'      => $this->email,
            'role'       => $this->role,
            'is_active'  => $this->is_active,
        ];
    }
}
```

### `app/Http/Resources/StudentResource.php`
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'user_id'              => $this->user_id,
            'first_name'           => $this->user->first_name,
            'last_name'            => $this->user->last_name,
            'email'                => $this->user->email,
            'cne'                  => $this->cne,
            'phone'                => $this->phone ?? '',
            'group_id'             => $this->group_id,
            'group_name'           => $this->group->name,
            'total_absence_hours'  => (float) $this->absences()->sum('hours'),
        ];
    }
}
```

### `app/Http/Resources/TeacherResource.php`
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'first_name'      => $this->user->first_name,
            'last_name'       => $this->user->last_name,
            'email'           => $this->user->email,
            'subject'         => $this->subject,
            'groups_assigned' => $this->groups->pluck('name')->toArray(),
        ];
    }
}
```

### `app/Http/Resources/GroupResource.php`
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'level'         => $this->level,
            'student_count' => $this->students_count ?? $this->students()->count(),
            'teacher_count' => $this->teachers_count ?? $this->teachers()->count(),
        ];
    }
}
```

### `app/Http/Resources/AbsenceResource.php`
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AbsenceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'student_id'   => $this->student_id,
            'student_name' => $this->student->user->first_name . ' ' . $this->student->user->last_name,
            'group_name'   => $this->group->name,
            'date'         => $this->date,
            'start_time'   => $this->start_time,
            'end_time'     => $this->end_time,
            'hours'        => (float) $this->hours,
            'subject'      => $this->subject,
            'teacher_name' => $this->teacher->user->first_name . ' ' . $this->teacher->user->last_name,
            'notes'        => $this->notes ?? '',
            'status'       => $this->status,
        ];
    }
}
```

### `app/Http/Resources/JustificationResource.php`
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class JustificationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'absence_id'   => $this->absence_id,
            'student_name' => $this->absence->student->user->first_name . ' ' . $this->absence->student->user->last_name,
            'date'         => $this->absence->date,
            'hours'        => (float) $this->absence->hours,
            'reason'       => $this->reason,
            'file_name'    => $this->file_name,
            'file_type'    => $this->file_type,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'status'       => $this->status,
            'review_note'  => $this->review_note,
        ];
    }
}
```

---

## 5. Controllers

Generate with: `php artisan make:controller Api/XxxxxController`

### `app/Http/Controllers/Api/AuthController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /api/login */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Ce compte est désactivé.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => new UserResource($user),
        ]);
    }

    /** POST /api/logout */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }

    /** GET /api/me */
    public function me(Request $request)
    {
        return new UserResource($request->user());
    }
}
```

### `app/Http/Controllers/Api/DashboardController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Absence;
use App\Models\Justification;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** GET /api/dashboard/admin */
    public function admin()
    {
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();
        $totalAbsenceHours = Absence::sum('hours');
        $totalPossibleHours = $totalStudents * 40; // approximate
        $absenceRate = $totalPossibleHours > 0
            ? round(($totalAbsenceHours / $totalPossibleHours) * 100, 1)
            : 0;

        return response()->json([
            'data' => [
                'total_students'  => $totalStudents,
                'total_teachers'  => $totalTeachers,
                'absence_rate'    => $absenceRate,
                'pending_reviews' => Justification::where('status', 'pending')->count(),
            ],
        ]);
    }

    /** GET /api/dashboard/teacher */
    public function teacher(Request $request)
    {
        $teacher = $request->user()->teacher;

        return response()->json([
            'data' => [
                'my_groups'       => $teacher->groups()->count(),
                'my_students'     => Student::whereIn('group_id', $teacher->groups()->pluck('groups.id'))->count(),
                'today_absences'  => Absence::where('teacher_id', $teacher->id)
                                        ->whereDate('date', today())->count(),
            ],
        ]);
    }

    /** GET /api/dashboard/student */
    public function student(Request $request)
    {
        $student = $request->user()->student;
        $absences = $student->absences;

        $totalHours = $absences->sum('hours');
        $justifiedHours = $absences->where('status', 'justified')->sum('hours');
        $unjustifiedHours = $absences->where('status', 'unjustified')->sum('hours');
        $pendingHours = $absences->where('status', 'pending')->sum('hours');

        // Approximate attendance rate (assuming 600 total hours per year)
        $totalPossible = 600;
        $attendanceRate = $totalPossible > 0
            ? round((1 - $totalHours / $totalPossible) * 100, 1)
            : 100;

        return response()->json([
            'data' => [
                'absence_hours'         => (float) $totalHours,
                'justified_hours'       => (float) $justifiedHours,
                'unjustified_hours'     => (float) $unjustifiedHours,
                'pending_hours'         => (float) $pendingHours,
                'pending_justifications'=> Justification::whereIn('absence_id', $absences->pluck('id'))
                                              ->where('status', 'pending')->count(),
                'unjustified_count'     => $absences->where('status', 'unjustified')->count(),
                'attendance_rate'       => $attendanceRate,
            ],
        ]);
    }
}
```

### `app/Http/Controllers/Api/StudentController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    /** GET /api/students */
    public function index()
    {
        $students = Student::with(['user', 'group'])->get();
        return StudentResource::collection($students);
    }

    /** POST /api/students */
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'cne'        => 'required|string|max:20|unique:students,cne',
            'phone'      => 'nullable|string|max:20',
            'group_id'   => 'required|exists:groups,id',
        ]);

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name'  => $data['last_name'],
                'email'      => $data['email'],
                'password'   => Hash::make('password123'), // default password
                'role'       => 'student',
            ]);

            $student = Student::create([
                'user_id'  => $user->id,
                'cne'      => $data['cne'],
                'phone'    => $data['phone'] ?? null,
                'group_id' => $data['group_id'],
            ]);

            $student->load(['user', 'group']);
            return new StudentResource($student);
        });
    }

    /** PUT /api/students/{id} */
    public function update(Request $request, Student $student)
    {
        $data = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name'  => 'sometimes|string|max:100',
            'email'      => 'sometimes|email|unique:users,email,' . $student->user_id,
            'cne'        => 'sometimes|string|max:20|unique:students,cne,' . $student->id,
            'phone'      => 'nullable|string|max:20',
            'group_id'   => 'sometimes|exists:groups,id',
        ]);

        DB::transaction(function () use ($student, $data) {
            $student->user->update(collect($data)->only(['first_name', 'last_name', 'email'])->toArray());
            $student->update(collect($data)->only(['cne', 'phone', 'group_id'])->toArray());
        });

        $student->load(['user', 'group']);
        return new StudentResource($student);
    }

    /** DELETE /api/students/{id} */
    public function destroy(Student $student)
    {
        $student->user->delete(); // cascades to student
        return response()->noContent();
    }
}
```

### `app/Http/Controllers/Api/TeacherController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherResource;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    /** GET /api/teachers */
    public function index()
    {
        $teachers = Teacher::with(['user', 'groups'])->get();
        return TeacherResource::collection($teachers);
    }

    /** POST /api/teachers */
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'subject'    => 'required|string|max:100',
        ]);

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name'  => $data['last_name'],
                'email'      => $data['email'],
                'password'   => Hash::make('password123'),
                'role'       => 'teacher',
            ]);

            $teacher = Teacher::create([
                'user_id' => $user->id,
                'subject' => $data['subject'],
            ]);

            $teacher->load(['user', 'groups']);
            return new TeacherResource($teacher);
        });
    }

    /** PUT /api/teachers/{id} */
    public function update(Request $request, Teacher $teacher)
    {
        $data = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name'  => 'sometimes|string|max:100',
            'email'      => 'sometimes|email|unique:users,email,' . $teacher->user_id,
            'subject'    => 'sometimes|string|max:100',
        ]);

        DB::transaction(function () use ($teacher, $data) {
            $teacher->user->update(collect($data)->only(['first_name', 'last_name', 'email'])->toArray());
            $teacher->update(collect($data)->only(['subject'])->toArray());
        });

        $teacher->load(['user', 'groups']);
        return new TeacherResource($teacher);
    }

    /** DELETE /api/teachers/{id} */
    public function destroy(Teacher $teacher)
    {
        $teacher->user->delete();
        return response()->noContent();
    }
}
```

### `app/Http/Controllers/Api/GroupController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Http\Resources\StudentResource;
use App\Models\Group;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    /** GET /api/groups */
    public function index()
    {
        $groups = Group::withCount(['students', 'teachers'])->get();
        return GroupResource::collection($groups);
    }

    /** POST /api/groups */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:50|unique:groups,name',
            'level' => 'required|string|max:50',
        ]);

        $group = Group::create($data);
        return new GroupResource($group);
    }

    /** PUT /api/groups/{id} */
    public function update(Request $request, Group $group)
    {
        $data = $request->validate([
            'name'  => 'sometimes|string|max:50|unique:groups,name,' . $group->id,
            'level' => 'sometimes|string|max:50',
        ]);

        $group->update($data);
        return new GroupResource($group);
    }

    /** DELETE /api/groups/{id} */
    public function destroy(Group $group)
    {
        $group->delete();
        return response()->noContent();
    }

    /** GET /api/groups/{id}/students */
    public function students(Group $group)
    {
        $students = $group->students()->with(['user', 'group'])->get();
        return StudentResource::collection($students);
    }
}
```

### `app/Http/Controllers/Api/AbsenceController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use Illuminate\Http\Request;

class AbsenceController extends Controller
{
    /** GET /api/absences */
    public function index(Request $request)
    {
        $query = Absence::with(['student.user', 'teacher.user', 'group']);

        $user = $request->user();

        // Auto-filter by role
        if ($user->role === 'student') {
            $query->where('student_id', $user->student->id);
        } elseif ($user->role === 'teacher') {
            $query->where('teacher_id', $user->teacher->id);
        }

        // Optional filters
        if ($request->filled('group')) {
            $query->whereHas('group', fn ($q) => $q->where('name', $request->group));
        }
        if ($request->filled('status')) {
            $statuses = explode(',', $request->status);
            $query->whereIn('status', $statuses);
        }
        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student.user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sort = $request->get('sort', 'latest');
        $query->orderBy('date', $sort === 'latest' ? 'desc' : 'asc');

        // Limit
        if ($request->filled('limit')) {
            $query->limit((int) $request->limit);
        }

        return AbsenceResource::collection($query->get());
    }

    /** POST /api/absences */
    public function store(Request $request)
    {
        $data = $request->validate([
            'student_ids'   => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'group_id'      => 'required|exists:groups,id',
            'date'          => 'required|date',
            'start_time'    => 'required|date_format:H:i',
            'end_time'      => 'required|date_format:H:i|after:start_time',
            'subject'       => 'required|string|max:100',
            'notes'         => 'nullable|string',
        ]);

        $teacher = $request->user()->teacher;

        $absences = collect($data['student_ids'])->map(function ($studentId) use ($data, $teacher) {
            return Absence::create([
                'student_id' => $studentId,
                'teacher_id' => $teacher->id,
                'group_id'   => $data['group_id'],
                'date'       => $data['date'],
                'start_time' => $data['start_time'],
                'end_time'   => $data['end_time'],
                'subject'    => $data['subject'],
                'notes'      => $data['notes'] ?? null,
            ]);
        });

        $absences->load(['student.user', 'teacher.user', 'group']);
        return AbsenceResource::collection($absences);
    }
}
```

### `app/Http/Controllers/Api/JustificationController.php`
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JustificationResource;
use App\Models\Justification;
use Illuminate\Http\Request;

class JustificationController extends Controller
{
    /** GET /api/justifications */
    public function index(Request $request)
    {
        $query = Justification::with(['absence.student.user', 'absence.group']);

        $user = $request->user();
        if ($user->role === 'student') {
            $query->whereHas('absence', fn ($q) =>
                $q->where('student_id', $user->student->id)
            );
        }

        return JustificationResource::collection(
            $query->orderByDesc('submitted_at')->get()
        );
    }

    /** POST /api/justifications (multipart/form-data) */
    public function store(Request $request)
    {
        $data = $request->validate([
            'absence_id' => 'required|exists:absences,id',
            'reason'     => 'required|string',
            'file'       => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $file = $request->file('file');
        $path = $file->store('justifications', 'public');

        $ext = strtolower($file->getClientOriginalExtension());
        $fileType = $ext === 'pdf' ? 'pdf' : 'image';

        $justification = Justification::create([
            'absence_id' => $data['absence_id'],
            'reason'     => $data['reason'],
            'file_name'  => $file->getClientOriginalName(),
            'file_path'  => $path,
            'file_type'  => $fileType,
            'file_size'  => $file->getSize(),
        ]);

        $justification->load(['absence.student.user']);
        return new JustificationResource($justification);
    }

    /** PATCH /api/justifications/{id}/approve */
    public function approve(Request $request, Justification $justification)
    {
        $justification->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'review_note' => $request->input('review_note'),
            'reviewed_at' => now(),
        ]);

        // Also update the absence status
        $justification->absence->update(['status' => 'justified']);

        $justification->load(['absence.student.user']);
        return new JustificationResource($justification);
    }

    /** PATCH /api/justifications/{id}/reject */
    public function reject(Request $request, Justification $justification)
    {
        $justification->update([
            'status'      => 'rejected',
            'reviewed_by' => $request->user()->id,
            'review_note' => $request->input('review_note'),
            'reviewed_at' => now(),
        ]);

        $justification->absence->update(['status' => 'unjustified']);

        $justification->load(['absence.student.user']);
        return new JustificationResource($justification);
    }
}
```

---

## 6. API Routes

### `routes/api.php`
```php
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\JustificationController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/login', [AuthController::class, 'login']);

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/admin', [DashboardController::class, 'admin']);
    Route::get('/dashboard/teacher', [DashboardController::class, 'teacher']);
    Route::get('/dashboard/student', [DashboardController::class, 'student']);

    // CRUD resources
    Route::apiResource('students', StudentController::class);
    Route::apiResource('teachers', TeacherController::class);
    Route::apiResource('groups', GroupController::class);
    Route::get('/groups/{group}/students', [GroupController::class, 'students']);

    // Absences
    Route::get('/absences', [AbsenceController::class, 'index']);
    Route::post('/absences', [AbsenceController::class, 'store']);

    // Justifications
    Route::get('/justifications', [JustificationController::class, 'index']);
    Route::post('/justifications', [JustificationController::class, 'store']);
    Route::patch('/justifications/{justification}/approve', [JustificationController::class, 'approve']);
    Route::patch('/justifications/{justification}/reject', [JustificationController::class, 'reject']);
});
```

---

## 7. CORS Configuration

### `config/cors.php`
```php
return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => ['http://localhost:5173', 'http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];
```

---

## 8. Database Seeder

### `database/seeders/DatabaseSeeder.php`
```php
<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Group;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::create([
            'first_name' => 'Admin',
            'last_name'  => 'OFPPT',
            'email'      => 'admin@ofppt.ma',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
        ]);

        // Groups
        $g1 = Group::create(['name' => 'DEV101', 'level' => '1ère année']);
        $g2 = Group::create(['name' => 'DEV201', 'level' => '2ème année']);

        // Teacher
        $teacherUser = User::create([
            'first_name' => 'Mohammed',
            'last_name'  => 'Alami',
            'email'      => 'teacher@ofppt.ma',
            'password'   => Hash::make('password'),
            'role'       => 'teacher',
        ]);
        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'subject' => 'Développement Web',
        ]);
        $teacher->groups()->attach([$g1->id, $g2->id]);

        // Students
        $students = [
            ['first_name' => 'Youssef', 'last_name' => 'Bennani', 'email' => 'student@ofppt.ma', 'cne' => 'R130001', 'group' => $g1],
            ['first_name' => 'Fatima', 'last_name' => 'Zahra', 'email' => 'fatima@ofppt.ma', 'cne' => 'R130002', 'group' => $g1],
            ['first_name' => 'Ahmed', 'last_name' => 'Tazi', 'email' => 'ahmed@ofppt.ma', 'cne' => 'R130003', 'group' => $g2],
        ];

        foreach ($students as $s) {
            $user = User::create([
                'first_name' => $s['first_name'],
                'last_name'  => $s['last_name'],
                'email'      => $s['email'],
                'password'   => Hash::make('password'),
                'role'       => 'student',
            ]);
            Student::create([
                'user_id'  => $user->id,
                'cne'      => $s['cne'],
                'group_id' => $s['group']->id,
            ]);
        }
    }
}
```

---

## 9. Quick Start Commands

```bash
# 1. Create project
composer create-project laravel/laravel ofppt-attendance
cd ofppt-attendance

# 2. Install Sanctum
php artisan install:api

# 3. Configure .env with your MySQL credentials

# 4. Create all migration files and paste the code above

# 5. Run migrations & seed
php artisan migrate --seed

# 6. Create storage link (for justification file uploads)
php artisan storage:link

# 7. Start the server
php artisan serve
# → Running at http://localhost:8000

# 8. Test credentials:
#    admin@ofppt.ma    / password
#    teacher@ofppt.ma  / password
#    student@ofppt.ma  / password
```

---

## 10. Endpoint ↔ Frontend Mapping

| Frontend Call | Laravel Route | Controller Method |
|---|---|---|
| `api.login(email, pw)` | `POST /api/login` | `AuthController@login` |
| `api.logout()` | `POST /api/logout` | `AuthController@logout` |
| `api.getMe()` | `GET /api/me` | `AuthController@me` |
| `api.getDashboardStats('admin')` | `GET /api/dashboard/admin` | `DashboardController@admin` |
| `api.getDashboardStats('teacher')` | `GET /api/dashboard/teacher` | `DashboardController@teacher` |
| `api.getDashboardStats('student')` | `GET /api/dashboard/student` | `DashboardController@student` |
| `api.getStudents()` | `GET /api/students` | `StudentController@index` |
| `api.createStudent(data)` | `POST /api/students` | `StudentController@store` |
| `api.updateStudent(id, data)` | `PUT /api/students/{id}` | `StudentController@update` |
| `api.deleteStudent(id)` | `DELETE /api/students/{id}` | `StudentController@destroy` |
| `api.getTeachers()` | `GET /api/teachers` | `TeacherController@index` |
| `api.createTeacher(data)` | `POST /api/teachers` | `TeacherController@store` |
| `api.updateTeacher(id, data)` | `PUT /api/teachers/{id}` | `TeacherController@update` |
| `api.deleteTeacher(id)` | `DELETE /api/teachers/{id}` | `TeacherController@destroy` |
| `api.getGroups()` | `GET /api/groups` | `GroupController@index` |
| `api.createGroup(data)` | `POST /api/groups` | `GroupController@store` |
| `api.updateGroup(id, data)` | `PUT /api/groups/{id}` | `GroupController@update` |
| `api.deleteGroup(id)` | `DELETE /api/groups/{id}` | `GroupController@destroy` |
| `api.getGroupStudents(id)` | `GET /api/groups/{id}/students` | `GroupController@students` |
| `api.getAbsences(filters)` | `GET /api/absences` | `AbsenceController@index` |
| `api.createAbsence(data)` | `POST /api/absences` | `AbsenceController@store` |
| `api.getJustifications()` | `GET /api/justifications` | `JustificationController@index` |
| `api.createJustification(fd)` | `POST /api/justifications` | `JustificationController@store` |
| `api.approveJustification(id)` | `PATCH /api/justifications/{id}/approve` | `JustificationController@approve` |
| `api.rejectJustification(id)` | `PATCH /api/justifications/{id}/reject` | `JustificationController@reject` |
