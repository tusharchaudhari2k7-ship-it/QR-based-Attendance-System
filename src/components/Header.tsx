import React, { useState, useEffect } from 'react';
import {
  Clock,
  Building2,
  LogOut,
  GraduationCap,
  Users,
  QrCode,
} from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storageService';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
}) => {
  const [time, setTime] = useState<string>('');

  // Active session check
  const activeSessions = storage.getSessions().filter(s => s.status === 'ACTIVE');
  const hasActiveSession = activeSessions.length > 0;
  const activeSession = activeSessions[0];
  const activeSubject = activeSession ? storage.getSubjectById(activeSession.subjectId) : null;

  // Student specific details
  const student = currentUser.role === 'student' ? storage.getStudentByUserId(currentUser.id) : null;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="app-header"
      className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between z-20 shadow-xs"
    >
      {/* Left: Branding & Role Portal Badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 leading-tight">
              Attendance Portal
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                currentUser.role === 'admin'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : currentUser.role === 'faculty'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'faculty' ? 'Faculty' : 'Student'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            College of Engineering & Technology
          </p>
        </div>

        {/* Live Session Pill */}
        {hasActiveSession && (
          <div className="hidden md:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Session: <strong>{activeSubject?.code}</strong></span>
          </div>
        )}
      </div>

      {/* Right: Clock, User Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-2.5 pl-2">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {student ? `Roll: ${student.rollNo}` : currentUser.email}
            </p>
          </div>
        </div>

        {/* Real Sign Out Button */}
        <button
          id="btn-sign-out"
          onClick={onLogout}
          title="Sign Out"
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
