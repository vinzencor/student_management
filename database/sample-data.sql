-- Additional Sample Data for Student Management System
-- Run this after the main schema.sql file

-- More sample students with their class enrollments
DO $$
DECLARE
    parent_id_1 UUID;
    parent_id_2 UUID;
    parent_id_3 UUID;
    student_id_1 UUID;
    student_id_2 UUID;
    student_id_3 UUID;
    class_id_math UUID;
    class_id_english UUID;
    class_id_chemistry UUID;
BEGIN
    -- Get some existing parent IDs (with error checking)
    SELECT id INTO parent_id_1 FROM parents WHERE email = 'rajesh.kumar@email.com';
    SELECT id INTO parent_id_2 FROM parents WHERE email = 'priya.sharma@email.com';
    SELECT id INTO parent_id_3 FROM parents WHERE email = 'amit.patel@email.com';

    -- Get some class IDs (with error checking)
    SELECT id INTO class_id_math FROM classes WHERE name = 'Advanced Mathematics 10th';
    SELECT id INTO class_id_english FROM classes WHERE name = 'English Literature 12th';
    SELECT id INTO class_id_chemistry FROM classes WHERE name = 'Chemistry Fundamentals 11th';

    -- Get some student IDs (with error checking)
    SELECT id INTO student_id_1 FROM students WHERE email = 'aarav.kumar@student.com';
    SELECT id INTO student_id_2 FROM students WHERE email = 'diya.sharma@student.com';
    SELECT id INTO student_id_3 FROM students WHERE email = 'aryan.patel@student.com';

    -- Check if all required IDs were found
    IF student_id_1 IS NULL OR student_id_2 IS NULL OR student_id_3 IS NULL OR
       class_id_math IS NULL OR class_id_english IS NULL OR class_id_chemistry IS NULL THEN
        RAISE EXCEPTION 'Required students or classes not found. Make sure schema.sql has been run first.';
    END IF;

    -- Enroll students in classes (only if they're not already enrolled)
    INSERT INTO student_classes (student_id, class_id)
    SELECT student_id, class_id FROM (VALUES
        (student_id_1, class_id_math),
        (student_id_2, class_id_english),
        (student_id_3, class_id_chemistry)
    ) AS new_enrollments(student_id, class_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM student_classes sc
        WHERE sc.student_id = new_enrollments.student_id
        AND sc.class_id = new_enrollments.class_id
    );
    
    -- Add some attendance records for the past week
    INSERT INTO attendance (student_id, class_id, date, status, notes) VALUES
    -- Aarav's attendance
    (student_id_1, class_id_math, CURRENT_DATE - INTERVAL '7 days', 'present', 'Active participation'),
    (student_id_1, class_id_math, CURRENT_DATE - INTERVAL '5 days', 'present', 'Good performance'),
    (student_id_1, class_id_math, CURRENT_DATE - INTERVAL '3 days', 'late', 'Arrived 10 minutes late'),
    (student_id_1, class_id_math, CURRENT_DATE - INTERVAL '1 day', 'present', 'Excellent work'),
    (student_id_1, class_id_math, CURRENT_DATE, 'present', 'On time'),
    
    -- Diya's attendance
    (student_id_2, class_id_english, CURRENT_DATE - INTERVAL '6 days', 'present', 'Great essay submission'),
    (student_id_2, class_id_english, CURRENT_DATE - INTERVAL '4 days', 'present', 'Active in discussions'),
    (student_id_2, class_id_english, CURRENT_DATE - INTERVAL '2 days', 'absent', 'Sick leave'),
    (student_id_2, class_id_english, CURRENT_DATE, 'present', 'Back from sick leave'),
    
    -- Aryan's attendance
    (student_id_3, class_id_chemistry, CURRENT_DATE - INTERVAL '7 days', 'present', 'Lab work completed'),
    (student_id_3, class_id_chemistry, CURRENT_DATE - INTERVAL '5 days', 'present', 'Good understanding'),
    (student_id_3, class_id_chemistry, CURRENT_DATE - INTERVAL '3 days', 'present', 'Helped classmates'),
    (student_id_3, class_id_chemistry, CURRENT_DATE - INTERVAL '1 day', 'late', 'Traffic delay'),
    (student_id_3, class_id_chemistry, CURRENT_DATE, 'present', 'Punctual today');
    
    -- Add some performance records
    INSERT INTO performance (student_id, class_id, test_name, test_date, marks_obtained, total_marks, grade, feedback) VALUES
    (student_id_1, class_id_math, 'Unit Test 1 - Algebra', CURRENT_DATE - INTERVAL '10 days', 85, 100, 'A', 'Excellent problem-solving skills'),
    (student_id_1, class_id_math, 'Quiz - Geometry', CURRENT_DATE - INTERVAL '5 days', 92, 100, 'A+', 'Perfect understanding of concepts'),
    
    (student_id_2, class_id_english, 'Essay Writing', CURRENT_DATE - INTERVAL '8 days', 88, 100, 'A', 'Creative and well-structured'),
    (student_id_2, class_id_english, 'Literature Analysis', CURRENT_DATE - INTERVAL '3 days', 90, 100, 'A+', 'Deep understanding of themes'),
    
    (student_id_3, class_id_chemistry, 'Organic Chemistry Test', CURRENT_DATE - INTERVAL '12 days', 78, 100, 'B+', 'Good grasp of reactions'),
    (student_id_3, class_id_chemistry, 'Lab Practical', CURRENT_DATE - INTERVAL '6 days', 95, 100, 'A+', 'Excellent lab technique');
    
END $$;

-- Add more leads with varied statuses and sources
INSERT INTO leads (first_name, last_name, email, phone, source, status, grade_level, subjects_interested, assigned_counselor, notes, follow_up_date) VALUES
('Priya', 'Verma', 'priya.verma@email.com', '+91-9876543245', 'website', 'new', '11th', ARRAY['Physics', 'Chemistry', 'Mathematics'], 'Sarah Johnson', 'Interested in JEE preparation', CURRENT_DATE + INTERVAL '2 days'),

('Rahul', 'Sharma', 'rahul.sharma@email.com', '+91-9876543246', 'referral', 'contacted', '12th', ARRAY['English', 'History'], 'Mike Wilson', 'Parent called for demo class', CURRENT_DATE + INTERVAL '1 day'),

('Sneha', 'Patel', 'sneha.patel@email.com', '+91-9876543247', 'social_media', 'interested', '9th', ARRAY['Mathematics', 'Science'], 'Sarah Johnson', 'Wants weekend batches', CURRENT_DATE + INTERVAL '3 days'),

('Arjun', 'Singh', 'arjun.singh@email.com', '+91-9876543248', 'walk_in', 'new', '10th', ARRAY['Computer Science', 'Mathematics'], 'Mike Wilson', 'Visited center yesterday', CURRENT_DATE + INTERVAL '1 day'),

('Kavya', 'Reddy', 'kavya.reddy@email.com', '+91-9876543249', 'referral', 'converted', '11th', ARRAY['Biology', 'Chemistry'], 'Sarah Johnson', 'Enrolled in Biology batch', NULL),

('Vikram', 'Gupta', 'vikram.gupta@email.com', '+91-9876543250', 'website', 'lost', '12th', ARRAY['Physics', 'Mathematics'], 'Mike Wilson', 'Chose competitor due to location', NULL),

('Anita', 'Joshi', 'anita.joshi@email.com', '+91-9876543251', 'social_media', 'contacted', '10th', ARRAY['English', 'Social Studies'], 'Sarah Johnson', 'Demo class scheduled', CURRENT_DATE + INTERVAL '2 days'),

('Rohit', 'Agarwal', 'rohit.agarwal@email.com', '+91-9876543252', 'referral', 'interested', '9th', ARRAY['Mathematics', 'Science'], 'Mike Wilson', 'Very keen on joining', CURRENT_DATE + INTERVAL '1 day'),

('Meera', 'Nair', 'meera.nair@email.com', '+91-9876543253', 'walk_in', 'new', '11th', ARRAY['Commerce', 'Economics'], 'Sarah Johnson', 'Inquired about commerce stream', CURRENT_DATE + INTERVAL '4 days'),

('Karan', 'Malhotra', 'karan.malhotra@email.com', '+91-9876543254', 'website', 'contacted', '12th', ARRAY['Computer Science'], 'Mike Wilson', 'Interested in programming courses', CURRENT_DATE + INTERVAL '2 days');

-- Add some communication records
INSERT INTO communications (recipient_type, recipient_id, type, subject, message, status, scheduled_at, sent_at) VALUES
('parent', (SELECT parent_id FROM students WHERE email = 'aarav.kumar@student.com'), 'email', 'Monthly Progress Report', 'Dear Parent, Your child Aarav has shown excellent progress this month...', 'sent', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),

('parent', (SELECT parent_id FROM students WHERE email = 'diya.sharma@student.com'), 'sms', 'Fee Reminder', 'Dear Parent, This is a reminder that the monthly fee for Diya is due on 1st of next month.', 'sent', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),

('student', (SELECT id FROM students WHERE email = 'aryan.patel@student.com'), 'email', 'Assignment Reminder', 'Hi Aryan, Please remember to submit your Chemistry assignment by tomorrow.', 'sent', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'),

('parent', (SELECT parent_id FROM students WHERE email = 'aarav.kumar@student.com'), 'whatsapp', 'Attendance Alert', 'Your child was late to class today. Please ensure punctuality.', 'delivered', CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Add some worksheet records (mock file URLs)
INSERT INTO worksheets (class_id, title, description, file_url, file_name, file_size, uploaded_by, shared_with) VALUES
((SELECT id FROM classes WHERE name = 'Advanced Mathematics 10th'), 'Algebra Practice Sheet', 'Practice problems for quadratic equations', 'https://example.com/worksheets/algebra-practice.pdf', 'algebra-practice.pdf', 245760, (SELECT id FROM teachers WHERE email = 'meera.joshi@school.com'), ARRAY[(SELECT id FROM students WHERE email = 'aarav.kumar@student.com')]),

((SELECT id FROM classes WHERE name = 'English Literature 12th'), 'Shakespeare Analysis', 'Character analysis worksheet for Hamlet', 'https://example.com/worksheets/hamlet-analysis.pdf', 'hamlet-analysis.pdf', 189440, (SELECT id FROM teachers WHERE email = 'arjun.nair@school.com'), ARRAY[(SELECT id FROM students WHERE email = 'diya.sharma@student.com')]),

((SELECT id FROM classes WHERE name = 'Chemistry Fundamentals 11th'), 'Organic Reactions', 'Practice sheet for organic chemistry reactions', 'https://example.com/worksheets/organic-reactions.pdf', 'organic-reactions.pdf', 312320, (SELECT id FROM teachers WHERE email = 'kavya.reddy@school.com'), ARRAY[(SELECT id FROM students WHERE email = 'aryan.patel@student.com')]);

-- Update class current_students count
UPDATE classes SET current_students = (
    SELECT COUNT(*) FROM student_classes WHERE class_id = classes.id
);

-- Add some overdue fees for testing
INSERT INTO fees (student_id, class_id, amount, due_date, status, notes) VALUES
((SELECT id FROM students WHERE email = 'aarav.kumar@student.com'), (SELECT id FROM classes WHERE name = 'Advanced Mathematics 10th'), 3500, CURRENT_DATE - INTERVAL '5 days', 'overdue', 'Payment pending for 5 days'),
((SELECT id FROM students WHERE email = 'aryan.patel@student.com'), (SELECT id FROM classes WHERE name = 'Chemistry Fundamentals 11th'), 4000, CURRENT_DATE - INTERVAL '2 days', 'overdue', 'Follow up required');

-- Add some scheduled communications
INSERT INTO communications (recipient_type, recipient_id, type, subject, message, status, scheduled_at) VALUES
('parent', (SELECT parent_id FROM students WHERE email = 'aarav.kumar@student.com'), 'email', 'Fee Reminder', 'Dear Parent, This is a gentle reminder about the pending fee payment.', 'pending', CURRENT_TIMESTAMP + INTERVAL '1 day'),
('student', (SELECT id FROM students WHERE email = 'diya.sharma@student.com'), 'sms', 'Birthday Wishes', 'Happy Birthday Diya! Wishing you a wonderful year ahead!', 'pending', CURRENT_TIMESTAMP + INTERVAL '7 days');
