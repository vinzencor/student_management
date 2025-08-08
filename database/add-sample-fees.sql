-- Add sample fee data for testing

-- First, let's make sure we have some students with courses
-- Insert sample students if they don't exist
INSERT INTO students (first_name, last_name, email, phone, grade_level, status, course_id, batch_duration, batch_start_date) 
SELECT 'John', 'Doe', 'john.doe@student.com', '9876543210', '10th', 'active', 
       (SELECT id FROM courses WHERE name = 'Mathematics Foundation' LIMIT 1), 
       '1_year', '2025-01-01'
WHERE NOT EXISTS (SELECT 1 FROM students WHERE email = 'john.doe@student.com');

INSERT INTO students (first_name, last_name, email, phone, grade_level, status, course_id, batch_duration, batch_start_date) 
SELECT 'Jane', 'Smith', 'jane.smith@student.com', '9876543211', '11th', 'active', 
       (SELECT id FROM courses WHERE name = 'Science Fundamentals' LIMIT 1), 
       '1_year', '2025-01-01'
WHERE NOT EXISTS (SELECT 1 FROM students WHERE email = 'jane.smith@student.com');

INSERT INTO students (first_name, last_name, email, phone, grade_level, status, course_id, batch_duration, batch_start_date) 
SELECT 'Mike', 'Johnson', 'mike.johnson@student.com', '9876543212', '12th', 'active', 
       (SELECT id FROM courses WHERE name = 'English Communication' LIMIT 1), 
       '6_months', '2025-01-01'
WHERE NOT EXISTS (SELECT 1 FROM students WHERE email = 'mike.johnson@student.com');

-- Insert sample fees for these students
INSERT INTO fees (student_id, amount, due_date, status, fee_type, description, paid_amount)
SELECT 
    s.id,
    c.price,
    '2025-02-01',
    'pending',
    'tuition',
    'Course fee for ' || c.name,
    0
FROM students s
JOIN courses c ON s.course_id = c.id
WHERE s.email IN ('john.doe@student.com', 'jane.smith@student.com', 'mike.johnson@student.com')
ON CONFLICT DO NOTHING;

-- Add some fees with partial payments
INSERT INTO fees (student_id, amount, due_date, status, fee_type, description, paid_amount)
SELECT 
    s.id,
    5000,
    '2025-01-15',
    'partial',
    'registration',
    'Registration fee',
    2000
FROM students s
WHERE s.email = 'john.doe@student.com'
ON CONFLICT DO NOTHING;

-- Add some paid fees
INSERT INTO fees (student_id, amount, due_date, paid_date, status, fee_type, description, paid_amount)
SELECT 
    s.id,
    3000,
    '2024-12-01',
    '2024-11-28',
    'paid',
    'exam',
    'Exam fee',
    3000
FROM students s
WHERE s.email = 'jane.smith@student.com'
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON fees TO authenticated;
GRANT SELECT ON students TO authenticated;
GRANT SELECT ON courses TO authenticated;
