import React, { useState } from 'react';
import {
  QrCode,
  GraduationCap,
  Users,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building,
  AlertCircle,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [roleTab, setRoleTab] = useState<'student' | 'faculty' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('aarav.patel@student.college.edu');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');

  const users = storage.getAllUsers();
  const facultyUsers = users.filter(u => u.role === 'faculty');
  const studentUsers = users.filter(u => u.role === 'student');
  const adminUsers = users.filter(u => u.role === 'admin');

  const handleTabChange = (tab: 'student' | 'faculty' | 'admin') => {
    setRoleTab(tab);
    setErrorMessage('');
    if (tab === 'student') {
      setIdentifier('aarav.patel@student.college.edu');
    } else if (tab === 'faculty') {
      setIdentifier('priya.sharma@engg.college.edu');
    } else {
      setIdentifier('dean.academic@college.edu');
    }
    setPassword('password123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    let targetList: User[];
    if (roleTab === 'student') targetList = studentUsers;
    else if (roleTab === 'faculty') targetList = facultyUsers;
    else targetList = adminUsers;

    const cleanId = identifier.trim().toLowerCase();

    // Check by email or username or roll number
    const matchedUser = targetList.find(u => {
      if (u.email.toLowerCase() === cleanId) return true;
      if (u.username.toLowerCase() === cleanId) return true;
      if (roleTab === 'student') {
        const stud = storage.getStudentById(u.id);
        if (stud && stud.rollNo.toLowerCase() === cleanId) return true;
        if (stud && stud.enrollmentNo.toLowerCase() === cleanId) return true;
      }
      return false;
    });

    if (!matchedUser) {
      setErrorMessage(
        roleTab === 'student'
          ? 'Student account not found. Try Aarav Patel (24DS001) or click a quick profile below.'
          : roleTab === 'faculty'
          ? 'Faculty account not found. Try Dr. Priya Sharma or click a quick profile below.'
          : 'Administrator account not found. Try Dr. Arvind Rao (Dean).'
      );
      return;
    }

    onLogin(matchedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto text-center pt-6 pb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 mb-3">
          <QrCode className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          College Attendance Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Dynamic 25-Second Rotating QR Attendance System
        </p>
      </header>

      {/* Login Card */}
      <main className="max-w-md w-full mx-auto my-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        {/* Role Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold">
          <button
            type="button"
            id="tab-student-login"
            onClick={() => handleTabChange('student')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              roleTab === 'student'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            id="tab-faculty-login"
            onClick={() => handleTabChange('faculty')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              roleTab === 'faculty'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            id="tab-admin-login"
            onClick={() => handleTabChange('admin')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              roleTab === 'admin'
                ? 'bg-white text-amber-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {roleTab === 'student'
                ? 'Roll No or Student Email'
                : roleTab === 'faculty'
                ? 'Faculty Email or ID'
                : 'Admin Email or Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-login-id"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={
                  roleTab === 'student'
                    ? 'e.g. 24DS001 or student email'
                    : roleTab === 'faculty'
                    ? 'e.g. priya.sharma@engg.college.edu'
                    : 'e.g. dean.academic@college.edu'
                }
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                id="input-login-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-login"
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-sm ${
              roleTab === 'student'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                : roleTab === 'faculty'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
            }`}
          >
            <span>
              Sign In as {roleTab === 'student' ? 'Student' : roleTab === 'faculty' ? 'Faculty' : 'Administrator'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Profiles for Easy 1-Click Access */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick 1-Click Fill:
          </p>

          {roleTab === 'student' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('aarav.patel@student.college.edu');
                  setPassword('password123');
                }}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition"
              >
                <p className="text-xs font-bold text-slate-800">Aarav Patel</p>
                <p className="text-[10px] text-slate-500 font-mono">Div A (24DS001)</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('kabir.mehta@student.college.edu');
                  setPassword('password123');
                }}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition"
              >
                <p className="text-xs font-bold text-slate-800">Kabir Mehta</p>
                <p className="text-[10px] text-slate-500 font-mono">Div B (24DS015)</p>
              </button>
            </div>
          ) : roleTab === 'faculty' ? (
            <button
              type="button"
              onClick={() => {
                setIdentifier('priya.sharma@engg.college.edu');
                setPassword('password123');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-left transition flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">Dr. Priya Sharma</p>
                <p className="text-[11px] text-slate-500">Dept of Data Science (Machine Learning)</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Select</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIdentifier('dean.academic@college.edu');
                setPassword('password123');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 text-left transition flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">Dr. Arvind Rao (Dean)</p>
                <p className="text-[11px] text-slate-500">Academic Administration & Master Data</p>
              </div>
              <span className="text-xs font-semibold text-amber-700">Select</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-slate-400 py-3">
        <p>Dynamic QR Code Attendance System • Institutional Portal</p>
      </footer>
    </div>
  );
};
