# StudyTracker - Student Management System

A modern, responsive student management application built with React, TypeScript, and Tailwind CSS. Track students, manage tests, record marks, and identify top performers with an intuitive interface.

## ✨ Features

- **Student Management**: Add, edit, view, and manage student profiles
- **Test Creation**: Create tests with multiple subjects and dynamic configurations
- **Marks Entry**: Record and manage student performance across tests
- **Toppers & Analytics**: Leaderboards and performance insights
- **Dark/Light Theme**: Animated theme switching with persistence
- **Responsive Design**: Mobile-first approach, works on all devices
- **Mock Data Support**: Fallback data when backend is unavailable

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **State Management**: React Query + Context API
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd studytracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Navigation and layout components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (Theme, etc.)
├── pages/              # Main application pages
│   ├── Students/       # Student management
│   ├── Tests/          # Test creation and management
│   ├── Marks/          # Marks entry and viewing
│   ├── Toppers/        # Leaderboards and analytics
│   └── Settings/       # Application settings
├── services/           # API services and data layer
│   └── api.ts          # Axios configuration and API calls
└── hooks/              # Custom React hooks
```

## 🔧 Configuration

### API Integration

The app expects the following backend endpoints:

- `GET /api/students` - List students
- `POST /api/students` - Create student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

- `GET /api/tests` - List tests
- `POST /api/tests` - Create test
- `PUT /api/tests/{id}` - Update test
- `DELETE /api/tests/{id}` - Delete test

- `GET /api/marks` - List marks
- `POST /api/marks` - Create marks
- `PUT /api/marks/{id}` - Update marks
- `DELETE /api/marks/{id}` - Delete marks

- `GET /api/reports/test_topper` - Get test toppers
- `GET /api/reports/global_top_performers` - Get global toppers

### Mock Data

When the backend is unavailable, the app automatically falls back to mock data defined in `src/services/api.ts`.

### Theme Customization

Modify colors and design tokens in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind configuration

## 🎨 Design System

The app uses a comprehensive design system with:
- Semantic color tokens for consistent theming
- Component variants for different use cases
- Responsive breakpoints and spacing
- Smooth animations and transitions

## 📱 Mobile Support

Built mobile-first with:
- Responsive navigation (tabs on desktop, dropdown on mobile)
- Touch-friendly interface elements
- Optimized layouts for all screen sizes

## 🔮 Future Enhancements

- User authentication and role management
- Real-time notifications
- Advanced analytics and reporting
- Bulk import/export functionality
- Performance optimizations (virtualization for large lists)
- PWA capabilities

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using React, TypeScript, and modern web technologies.