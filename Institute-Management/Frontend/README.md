frontend/
├── src/
│   ├── config/
│   │   └── appConfig.js           # App name & branding in one place
│   ├── api/
│   │   └── axiosClient.js         # Configured Axios with JWT interceptor
│   ├── components/
│   │   ├── common/
│   │   │   ├── Sidebar.jsx        # Left sidebar with main navigation buttons
│   │   │   ├── Topbar.jsx         # Header with user profile and quick logout
│   │   │   ├── Modal.jsx          # Smooth animated backdrop for forms
│   │   │   └── Typewriter.jsx     # Smooth typewriter animation for AI responses
│   │   ├── auth/
│   │   │   └── Login.jsx          # Dark glassmorphism login screen
│   │   ├── admin/
│   │   │   ├── AdminView.jsx      # Admin hub with circular semester filters & modals
│   │   │   └── forms/
│   │   │       ├── DepartmentModal.jsx
│   │   │       ├── SubjectModal.jsx
│   │   │       ├── TeacherModal.jsx
│   │   │       ├── StudentModal.jsx
│   │   │       └── InitExamModal.jsx
│   │   ├── faculty/
│   │   │   └── FacultyView.jsx    # Subject grading matrix & student doubts
│   │   └── student/
│   │       └── StudentView.jsx    # Results view with typewriter AI mentorship & Q&A
│   ├── App.jsx                    # Core state & layout wrapper
│   ├── main.jsx
│   └── index.css                  # Custom scrollbars and dark aesthetics
└── vite.config.js