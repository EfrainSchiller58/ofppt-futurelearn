-- SQL Script to update student emails to testable Gmail aliases
-- Replace 'your-email' with your actual Gmail address (before the @)
-- 
-- Example:
--   If your email is john.doe@gmail.com, replace 'your-email' with 'john.doe'
--   Final emails will be: john.doe+student1@gmail.com, john.doe+student2@gmail.com, etc.

UPDATE users
SET email = CONCAT('your-email+student', 
    (SELECT COUNT(*) FROM (
        SELECT u2.id FROM users u2 
        WHERE u2.role = 'student' 
        AND u2.id <= users.id
    ) AS cnt), 
    '@gmail.com')
WHERE role = 'student'
AND id IN (
    SELECT DISTINCT users.id 
    FROM users 
    JOIN students ON users.id = students.user_id
)
ORDER BY id ASC;

-- Verify the updates:
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    'student' as role
FROM users u
WHERE u.role = 'student'
ORDER BY u.id;
