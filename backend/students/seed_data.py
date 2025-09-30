from django.core.management.base import BaseCommand
from students.models import Student, Test, Mark
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Seeds the database with sample data for testing (Indian system)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Clear existing data
        Mark.objects.all().delete()
        Test.objects.all().delete()
        Student.objects.all().delete()
        self.stdout.write(self.style.WARNING('Cleared existing data'))

        # Create Students (Indian names + roll numbers)
        students_data = [
            {'name': 'Amit Sharma', 'roll_number': '10A001', 'class_name': '10A', 'email': 'amit@school.com', 'phone': '+919876543210'},
            {'name': 'Priya Singh', 'roll_number': '10A002', 'class_name': '10A', 'email': 'priya@school.com', 'phone': '+919876543211'},
            {'name': 'Rohan Kumar', 'roll_number': '10B001', 'class_name': '10B', 'email': 'rohan@school.com', 'phone': '+919876543212'},
            {'name': 'Anjali Gupta', 'roll_number': '10A003', 'class_name': '10A', 'email': 'anjali@school.com', 'phone': '+919876543213'},
            {'name': 'Karan Mehta', 'roll_number': '10B002', 'class_name': '10B', 'email': 'karan@school.com', 'phone': '+919876543214'},
            {'name': 'Sneha Iyer', 'roll_number': '10A004', 'class_name': '10A', 'email': 'sneha@school.com'},
            {'name': 'Arjun Reddy', 'roll_number': '10B003', 'class_name': '10B', 'email': 'arjun@school.com'},
            {'name': 'Neha Patel', 'roll_number': '10A005', 'class_name': '10A', 'email': 'neha@school.com'},
        ]

        students = []
        for student_data in students_data:
            student = Student.objects.create(**student_data)
            students.append(student)

        self.stdout.write(self.style.SUCCESS(f'Created {len(students)} students'))

        # Create Tests (with CBSE-style subjects)
        today = date.today()

        tests_data = [
            {
                'name': 'Half-Yearly Exam',
                'date': today - timedelta(days=30),
                'subjects': [
                    {'name': 'Mathematics', 'max_marks': 100},
                    {'name': 'Science', 'max_marks': 100},
                    {'name': 'English', 'max_marks': 100},
                    {'name': 'Hindi', 'max_marks': 100},
                    {'name': 'Social Science', 'max_marks': 100},
                ]
            },
            {
                'name': 'Unit Test 1',
                'date': today - timedelta(days=60),
                'subjects': [
                    {'name': 'Mathematics', 'max_marks': 50},
                    {'name': 'Science', 'max_marks': 50},
                ]
            },
            {
                'name': 'Final Exam',
                'date': today + timedelta(days=15),
                'subjects': [
                    {'name': 'Mathematics', 'max_marks': 100},
                    {'name': 'Science', 'max_marks': 100},
                    {'name': 'English', 'max_marks': 100},
                    {'name': 'Hindi', 'max_marks': 100},
                    {'name': 'Social Science', 'max_marks': 100},
                ]
            },
        ]

        tests = []
        for test_data in tests_data:
            test = Test.objects.create(**test_data)
            tests.append(test)

        self.stdout.write(self.style.SUCCESS(f'Created {len(tests)} tests'))

        # Create Marks for Half-Yearly Exam
        half_yearly = tests[0]
        marks_half = [
            {'student': students[0], 'subject_name': 'Mathematics', 'marks_obtained': 92},
            {'student': students[0], 'subject_name': 'Science', 'marks_obtained': 88},
            {'student': students[0], 'subject_name': 'English', 'marks_obtained': 85},
            {'student': students[0], 'subject_name': 'Hindi', 'marks_obtained': 90},
            {'student': students[0], 'subject_name': 'Social Science', 'marks_obtained': 87},

            {'student': students[1], 'subject_name': 'Mathematics', 'marks_obtained': 80},
            {'student': students[1], 'subject_name': 'Science', 'marks_obtained': 75},
            {'student': students[1], 'subject_name': 'English', 'marks_obtained': 78},
            {'student': students[1], 'subject_name': 'Hindi', 'marks_obtained': 82},
            {'student': students[1], 'subject_name': 'Social Science', 'marks_obtained': 77},

            {'student': students[2], 'subject_name': 'Mathematics', 'marks_obtained': 65},
            {'student': students[2], 'subject_name': 'Science', 'marks_obtained': 68},
            {'student': students[2], 'subject_name': 'English', 'marks_obtained': 70},
            {'student': students[2], 'subject_name': 'Hindi', 'marks_obtained': 60},
            {'student': students[2], 'subject_name': 'Social Science', 'marks_obtained': 72},
        ]

        for mark_data in marks_half:
            subject = next(s for s in half_yearly.subjects if s['name'] == mark_data['subject_name'])
            Mark.objects.create(
                test=half_yearly,
                max_marks=subject['max_marks'],
                **mark_data
            )

        # Create Marks for Unit Test 1
        unit_test = tests[1]
        marks_unit = [
            {'student': students[0], 'subject_name': 'Mathematics', 'marks_obtained': 48},
            {'student': students[0], 'subject_name': 'Science', 'marks_obtained': 45},

            {'student': students[1], 'subject_name': 'Mathematics', 'marks_obtained': 40},
            {'student': students[1], 'subject_name': 'Science', 'marks_obtained': 42},

            {'student': students[2], 'subject_name': 'Mathematics', 'marks_obtained': 35},
            {'student': students[2], 'subject_name': 'Science', 'marks_obtained': 38},
        ]

        for mark_data in marks_unit:
            subject = next(s for s in unit_test.subjects if s['name'] == mark_data['subject_name'])
            Mark.objects.create(
                test=unit_test,
                max_marks=subject['max_marks'],
                **mark_data
            )

        self.stdout.write(self.style.SUCCESS(f'Created {len(marks_half) + len(marks_unit)} marks'))
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

