# Student Performance Management System

A full-stack web application for managing student records, test results, and performance analytics with a modern, responsive interface.

## Overview

This system provides a comprehensive solution for educational institutions to track student performance across multiple tests and subjects.

## Tech Stack

### Backend
- **Django 4.x** - Python web framework
- **Django REST Framework** - RESTful API development
- **PostgreSQL/SQLite** - Database
- **Django Simple JWT** - JWT authentication
- **Django Filter** - Advanced filtering capabilities

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library

## Features

- **User Authentication** - Secure JWT-based authentication with token refresh
- **Student Management** - CRUD operations for student records
- **Test Management** - Create and manage tests with multiple subjects
- **Marks Entry** - Record and update student marks with validation
- **Performance Analytics**
  - Test-wise topper identification
  - Global top performers across all tests
  - Subject-wise performance tracking
  - Detailed student performance history
- **Advanced Filtering** - Filter students by class, search by name/roll number
- **Responsive Design** - Mobile-friendly interface with dark mode support

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Student      │         │      Test       │         │      Mark       │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │         │ id (PK)         │
│ name            │         │ name            │         │ student_id (FK) │
│ roll_number (U) │         │ date            │         │ test_id (FK)    │
│ class_name      │         │ subjects (JSON) │         │ subject_name    │
│ email (U)       │         └─────────────────┘         │ marks_obtained  │
│ phone           │                │                    │ max_marks       │
│ created_at      │                │                    └─────────────────┘
└─────────────────┘                │                              │
         │                         │                              │
         │                         │                              │
         └─────────────────────────┴──────────────────────────────┘
                                   │
                            One-to-Many relationships
```

### Models

#### Student
```python
- id: Primary Key
- name: CharField
- roll_number: CharField (Unique)
- class_name: CharField
- email: EmailField (Unique)
- phone: CharField (Optional)
- created_at: DateField (Auto)
```

#### Test
```python
- id: Primary Key
- name: CharField
- date: DateField
- subjects: JSONField
  Format: [{"name": "Math", "max_marks": 100}, ...]
```

#### Mark
```python
- id: Primary Key
- student: ForeignKey(Student)
- test: ForeignKey(Test)
- subject_name: CharField
- marks_obtained: IntegerField (≥0)
- max_marks: IntegerField (≥1)
- Constraint: unique_together(student, test, subject_name)
```

### Indexes
- Student: `roll_number`, `class_name`
- Test: `date`
- Mark: `(student, test)`, `test`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `GET /api/auth/user/` - Get current user
- `POST /api/auth/logout/` - Logout user
- `POST /api/token/refresh/` - Refresh access token

### Students
- `GET /api/students/` - List all students
- `POST /api/students/` - Create student
- `GET /api/students/{id}/` - Get student details
- `PUT /api/students/{id}/` - Update student
- `DELETE /api/students/{id}/` - Delete student

### Tests
- `GET /api/tests/` - List all tests
- `POST /api/tests/` - Create test
- `GET /api/tests/{id}/` - Get test details
- `PUT /api/tests/{id}/` - Update test
- `DELETE /api/tests/{id}/` - Delete test

### Marks
- `GET /api/marks/` - List all marks
- `POST /api/marks/` - Create mark entry
- `PUT /api/marks/{id}/` - Update mark
- `DELETE /api/marks/{id}/` - Delete mark

### Reports
- `GET /api/reports/test_topper/?test_id={id}` - Get test toppers
- `GET /api/reports/global_top_performers/?class={name}&limit={n}` - Get global top performers

## Usage Examples

### Creating a Test
```json
POST /api/tests/
{
  "name": "Mid-Term Exam 2024",
  "date": "2024-03-15",
  "subjects": [
    {"name": "Mathematics", "max_marks": 100},
    {"name": "Science", "max_marks": 100},
    {"name": "English", "max_marks": 50}
  ]
}
```

### Recording Marks
```json
POST /api/marks/
{
  "student_id": 1,
  "test_id": 1,
  "subject_name": "Mathematics",
  "marks_obtained": 85,
  "max_marks": 100
}
```

## Security Features

- JWT-based authentication with token refresh
- Password hashing using Django's built-in system
- CORS protection
- SQL injection prevention through ORM
- Input validation on both frontend and backend
- Protected API endpoints requiring authentication

## License

This project is licensed under the MIT License.
