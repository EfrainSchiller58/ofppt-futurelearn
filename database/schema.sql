-- ============================================
-- OFPPT Smart Attendance - MySQL Schema
-- Production-Ready
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS (unified authentication table)
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'teacher', 'student') NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. GROUPS
CREATE TABLE `groups` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `level` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_groups_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. STUDENTS (extends users)
CREATE TABLE `students` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `cne` VARCHAR(20) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NULL,
    `group_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_students_group` FOREIGN KEY (`group_id`)
        REFERENCES `groups`(`id`) ON DELETE RESTRICT,

    INDEX `idx_students_group` (`group_id`),
    INDEX `idx_students_cne` (`cne`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. TEACHERS (extends users)
CREATE TABLE `teachers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL UNIQUE,
    `subject` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_teachers_user` FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. TEACHER_GROUPS (pivot)
CREATE TABLE `teacher_groups` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `teacher_id` BIGINT UNSIGNED NOT NULL,
    `group_id` BIGINT UNSIGNED NOT NULL,

    CONSTRAINT `fk_tg_teacher` FOREIGN KEY (`teacher_id`)
        REFERENCES `teachers`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tg_group` FOREIGN KEY (`group_id`)
        REFERENCES `groups`(`id`) ON DELETE CASCADE,

    UNIQUE KEY `uk_teacher_group` (`teacher_id`, `group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. ABSENCES
CREATE TABLE `absences` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `teacher_id` BIGINT UNSIGNED NOT NULL,
    `group_id` BIGINT UNSIGNED NOT NULL,
    `date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `hours` DECIMAL(4,2) GENERATED ALWAYS AS
        (TIMESTAMPDIFF(MINUTE, CONCAT(date,' ',start_time), CONCAT(date,' ',end_time)) / 60) STORED,
    `subject` VARCHAR(100) NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('pending', 'justified', 'unjustified') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_absences_student` FOREIGN KEY (`student_id`)
        REFERENCES `students`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_absences_teacher` FOREIGN KEY (`teacher_id`)
        REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_absences_group` FOREIGN KEY (`group_id`)
        REFERENCES `groups`(`id`) ON DELETE RESTRICT,

    INDEX `idx_absences_student` (`student_id`),
    INDEX `idx_absences_teacher` (`teacher_id`),
    INDEX `idx_absences_group` (`group_id`),
    INDEX `idx_absences_date` (`date`),
    INDEX `idx_absences_status` (`status`),
    INDEX `idx_absences_student_date` (`student_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 7. JUSTIFICATIONS
CREATE TABLE `justifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `absence_id` BIGINT UNSIGNED NOT NULL,
    `reason` TEXT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_type` ENUM('pdf', 'image') NOT NULL,
    `file_size` INT UNSIGNED NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewed_by` BIGINT UNSIGNED NULL,
    `review_note` TEXT NULL,
    `reviewed_at` TIMESTAMP NULL,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_justifications_absence` FOREIGN KEY (`absence_id`)
        REFERENCES `absences`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_justifications_reviewer` FOREIGN KEY (`reviewed_by`)
        REFERENCES `users`(`id`) ON DELETE SET NULL,

    INDEX `idx_justifications_absence` (`absence_id`),
    INDEX `idx_justifications_status` (`status`),
    INDEX `idx_justifications_reviewer` (`reviewed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================
-- VIEW: Student total absence hours
-- ============================================
CREATE VIEW `v_student_absence_hours` AS
SELECT
    s.id AS student_id,
    s.user_id,
    u.first_name,
    u.last_name,
    s.cne,
    g.name AS group_name,
    COALESCE(SUM(a.hours), 0) AS total_absence_hours,
    COALESCE(SUM(CASE WHEN a.status = 'justified' THEN a.hours ELSE 0 END), 0) AS justified_hours,
    COALESCE(SUM(CASE WHEN a.status = 'unjustified' THEN a.hours ELSE 0 END), 0) AS unjustified_hours,
    COALESCE(SUM(CASE WHEN a.status = 'pending' THEN a.hours ELSE 0 END), 0) AS pending_hours
FROM students s
JOIN users u ON u.id = s.user_id
JOIN `groups` g ON g.id = s.group_id
LEFT JOIN absences a ON a.student_id = s.id
GROUP BY s.id, s.user_id, u.first_name, u.last_name, s.cne, g.name;
