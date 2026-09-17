import React from 'react';
import {
  QrCode,
  Users,
  GraduationCap,
  ShieldCheck,
  History,
  BarChart3,
  Layers,
  Settings,
  Tv,
  CheckCircle2,
  ChevronRight,
  LogOut,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { User } from '../types';

export type NavView =
  | 'faculty-session'
  | 'faculty-history'
  | 'student-scan'
  | 'student-history'
  | 'admin-analytics'
  | 'admin-master'
  | 'admin-audit'
  | 'classroom-simulator'
  | 'test-center';

interface SidebarProps {
  currentUser: User;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenSwitchUser: () => void;
  onOpenHowToUse?: () => void;
  hasActiveSession: boolean;
  activeSessionInfo?: {
    subjectCode: string;
    divisionName: string;
    presentCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onSelectView,
  onOpenSwitchUser,
  onOpenHowToUse,
  hasActiveSession,
  activeSessionInfo,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3 h-3" />
            Faculty
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Users className="w-3 h-3" />
            Student
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      id="app-sidebar"
      className="w-72 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 h-screen border-r border-slate-800 select-none shadow-xl z-30"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-tight flex items-center gap-1.5">
              DynQR Portal
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
                v0.1
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate">
              FastAPI + Dynamic HMAC
            </p>
          </div>
        </div>

        {/* Live Active Session Indicator in Sidebar */}
        {hasActiveSession && (
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="text-xs">
                <p className="font-semibold text-emerald-300 leading-none">
                  {activeSessionInfo?.subjectCode || 'Active Lecture'}
                </p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  {activeSessionInfo?.divisionName} • {activeSessionInfo?.presentCount || 0} Present
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectView('faculty-session')}
              className="text-[11px] font-medium text-emerald-300 hover:text-emerald-100 bg-emerald-900/60 px-2 py-1 rounded transition"
            >
              View
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Faculty Views */}
        {currentUser.role === 'faculty' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Faculty Management
            </div>
            <div className="space-y-1">
              <button
                id="nav-faculty-session"
                onClick={() => onSelectView('faculty-session')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'faculty-session'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>Start / Active QR Session</span>
                </div>
                {hasActiveSession && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                id="nav-faculty-history"
                onClick={() => onSelectView('faculty-history')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'faculty-history'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>Attendance Logs & History</span>
              </button>
            </div>
          </div>
        )}

        {/* Student Views */}
        {currentUser.role === 'student' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Student Attendance
            </div>
            <div className="space-y-1">
              <button
                id="nav-student-scan"
                onClick={() => onSelectView('student-scan')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'student-scan'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>Scan QR & Submit Token</span>
              </button>

              <button
                id="nav-student-history"
                onClick={() => onSelectView('student-history')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'student-history'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>My Attendance History</span>
              </button>
            </div>
          </div>
        )}

        {/* Admin Views */}
        {currentUser.role === 'admin' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Administration & Analytics
            </div>
            <div className="space-y-1">
              <button
                id="nav-admin-analytics"
                onClick={() => onSelectView('admin-analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'admin-analytics'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Analytics & Defaulters</span>
              </button>

              <button
                id="nav-admin-master"
                onClick={() => onSelectView('admin-master')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'admin-master'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Master Academic Data</span>
              </button>

              <button
                id="nav-admin-audit"
                onClick={() => onSelectView('admin-audit')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeView === 'admin-audit'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Security Audit Trail</span>
              </button>
            </div>
          </div>
        )}

        {/* Evaluation & Interactive Simulators */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Interactive Testbed
          </div>
          <div className="space-y-1">
            <button
              id="nav-classroom-simulator"
              onClick={() => onSelectView('classroom-simulator')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeView === 'classroom-simulator'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tv className="w-4 h-4 text-violet-400" />
                <span>Dual Projector Simulator</span>
              </div>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 font-semibold px-1.5 py-0.5 rounded border border-violet-500/30">
                Split
              </span>
            </button>

            <button
              id="nav-test-center"
              onClick={() => onSelectView('test-center')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeView === 'test-center'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Validation Suite (T01-T14)</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                14 Tests
              </span>
            </button>

            {onOpenHowToUse && (
              <button
                id="nav-how-to-use"
                onClick={onOpenHowToUse}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>How System Works</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">Guide</span>
              </button>
            )}
          </div>
        </div>

        {/* Spec Architecture Summary */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Spec v0.1 Conformance
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            • 25-Second Rotating Tokens
            <br />
            • HMAC Server Signature
            <br />
            • Class & Division Integrity
            <br />
            • Windows Test-Token Bridge
          </p>
        </div>
      </div>

      {/* User Profile & Role Switcher Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
              }
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {getRoleBadge(currentUser.role)}
              </div>
            </div>
          </div>
          <button
            id="btn-switch-account"
            onClick={onOpenSwitchUser}
            title="Switch User / Role"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
