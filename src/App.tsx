import React, { useState } from 'react';
import { Header } from './components/Header';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { LoginView } from './components/LoginView';
import { storage } from './services/storageService';
import { User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = sessionStorage.getItem('attendance_auth_user');
    if (savedUserId) {
      const user = storage.getAllUsers().find(u => u.id === savedUserId);
      if (user) return user;
    }
    return storage.getCurrentUser();
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem('attendance_auth_user');
  });

  const [dataVersion, setDataVersion] = useState<number>(0);

  // Handle successful login
  const handleLogin = (user: User) => {
    storage.setCurrentUser(user.id);
    sessionStorage.setItem('attendance_auth_user', user.id);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setDataVersion(prev => prev + 1);
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('attendance_auth_user');
    setIsLoggedIn(false);
  };

  // If not logged in, render the Login Screen
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col">
      {/* Clean Minimal Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentUser.role === 'admin' ? (
          <AdminPortal
            key={`admin-${dataVersion}-${currentUser.id}`}
            currentUser={currentUser}
          />
        ) : currentUser.role === 'faculty' ? (
          <FacultyDashboard
            key={`faculty-${dataVersion}-${currentUser.id}`}
            currentUser={currentUser}
          />
        ) : (
          <StudentPortal
            key={`student-${dataVersion}-${currentUser.id}`}
            currentUser={currentUser}
          />
        )}
      </main>
    </div>
  );
}
