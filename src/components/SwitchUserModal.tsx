import React from 'react';
import { X, Check, GraduationCap, Users, ShieldCheck, UserCheck } from 'lucide-react';
import { storage } from '../services/storageService';
import { User, Role } from '../types';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const users = storage.getAllUsers();

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'faculty':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'student':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Switch User & Role Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Select any pre-configured persona from Appendix A of the specification to test role authorization, attendance submissions, and security constraints.
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {users.map(u => {
            const isSelected = u.id === currentUser.id;
            let sublabel = '';
            if (u.role === 'faculty') {
              const f = storage.getFacultyByUserId(u.id);
              sublabel = `${f?.designation || 'Faculty'} • Emp Code: ${f?.employeeCode || 'N/A'}`;
            } else if (u.role === 'student') {
              const s = storage.getStudentByUserId(u.id);
              const div = s ? storage.getDivisionById(s.divisionId) : null;
              sublabel = `Roll: ${s?.rollNo || 'N/A'} • ${div?.name || ''} • ${u.email}`;
            } else {
              sublabel = 'Dean Office • Institutional Administration & Master Data';
            }

            return (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      u.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {u.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          u.role === 'faculty'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'student'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate font-sans">
                      {sublabel}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 flex-shrink-0">
                    Switch
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
