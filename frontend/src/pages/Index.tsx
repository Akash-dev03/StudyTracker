// Student Management System - Landing redirects to main app

import { useEffect } from 'react';

const Index = () => {
  // This page is no longer used as the main app is now in App.tsx
  // Redirect to prevent any routing conflicts
  useEffect(() => {
    // This component should not be rendered in normal app flow
    console.warn('Index page accessed - should use App.tsx main routing');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">StudyTracker</h1>
        <p className="text-xl text-muted-foreground">Loading Student Management System...</p>
      </div>
    </div>
  );
};

export default Index;
