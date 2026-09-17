import React from 'react';
import { X, QrCode, Smartphone, Tv, ShieldCheck, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'faculty' | 'student' | 'simulator') => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                How to Use This Attendance System
              </h3>
              <p className="text-xs text-slate-500">
                Simplified guide for Faculty, Students, and Classrooms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Step Workflow */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            The 3-Step Live Attendance Flow
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                1
              </div>
              <p className="text-xs font-bold text-indigo-950">Faculty Starts Session</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Faculty selects the subject (e.g. <strong>Machine Learning</strong>) and starts the session. The live Dynamic QR is projected on the classroom wall or screen.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                2
              </div>
              <p className="text-xs font-bold text-amber-950">QR Rotates Every 25s</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Every 25 seconds, a brand new encrypted cryptographic QR code is generated. Photos forwarded to absent friends on WhatsApp expire immediately!
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                3
              </div>
              <p className="text-xs font-bold text-emerald-950">Student Scans & Marks</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Student opens the portal on their phone and scans the QR code (or taps 1-Click Scan). The server checks HMAC integrity and records them as <strong>Present</strong>!
              </p>
            </div>
          </div>
        </div>

        {/* Role Guides */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            How Each Role Interacts
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Faculty Role</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>Pick class, division, and subject.</li>
                <li>Display the full-screen dynamic QR code.</li>
                <li>Watch the live student head-count increment in real time.</li>
                <li>Click <strong>End Session</strong> when lecture attendance finishes.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Student Role</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>Log in to see active lecture alerts.</li>
                <li>Use mobile camera scanner or 1-tap instant scan.</li>
                <li>Instant visual feedback (Green for Present, Red if Division mismatch).</li>
                <li>Check overall attendance percentage and history.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Jump Action Buttons */}
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-indigo-950">
              Want to see both Projector & Phone on one screen?
            </p>
            <p className="text-[11px] text-indigo-700">
              Open the Dual Classroom Simulator to test real-time scanning instantly.
            </p>
          </div>
          <button
            onClick={() => {
              onSelectRole('simulator');
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/30 whitespace-nowrap"
          >
            <span>Launch Dual Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            College Academic Management • Secure Dynamic QR
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Got it, Let's Start
          </button>
        </div>
      </div>
    </div>
  );
};
