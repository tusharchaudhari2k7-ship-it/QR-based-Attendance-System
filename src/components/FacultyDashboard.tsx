import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Play,
  Square,
  RefreshCw,
  Users,
  Clock,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { User, Faculty, AttendanceSession, Subject, ClassRoom, Division } from '../types';
import { QR_VALIDITY_SECONDS } from '../services/cryptoService';

interface FacultyDashboardProps {
  currentUser: User;
  onNavigateToSimulator?: () => void;
  onNavigateToTestCenter?: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
}) => {
  const faculty = storage.getFacultyByUserId(currentUser.id);
  const classes = storage.getClasses();
  const subjects = storage.getSubjects();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const divisions = storage.getDivisions(selectedClassId);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(divisions[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');

  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(QR_VALIDITY_SECONDS);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync division when class changes
  useEffect(() => {
    const divs = storage.getDivisions(selectedClassId);
    if (divs.length > 0 && !divs.some(d => d.id === selectedDivisionId)) {
      setSelectedDivisionId(divs[0].id);
    }
  }, [selectedClassId]);

  // Check active session on mount
  useEffect(() => {
    if (faculty) {
      const active = storage.getActiveSessionForFaculty(faculty.id);
      if (active) {
        setActiveSession(active);
        // compute remaining seconds
        if (active.tokenIssuedAt) {
          const elapsed = Math.floor((Date.now() - active.tokenIssuedAt) / 1000);
          setSecondsRemaining(Math.max(1, QR_VALIDITY_SECONDS - elapsed));
        }
      } else {
        setActiveSession(null);
      }
    }
  }, [faculty, refreshKey]);

  // Handle Dynamic QR generation on canvas
  useEffect(() => {
    if (activeSession && activeSession.currentToken) {
      QRCode.toDataURL(
        activeSession.currentToken,
        {
          width: 280,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    } else {
      setQrDataUrl('');
    }
  }, [activeSession?.currentToken]);

  // 25-Second Rotating Dynamic Token Timer
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'ACTIVE') return;

    const interval = setInterval(async () => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Trigger token rotation
          (async () => {
            try {
              const updated = await storage.refreshSessionToken(activeSession.id);
              setActiveSession(updated);
            } catch (err) {
              console.error('Failed to rotate token', err);
            }
          })();
          return QR_VALIDITY_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.id, activeSession?.status]);

  // Start Session Handler
  const handleStartSession = async () => {
    if (!faculty) return;
    try {
      const session = await storage.startAttendanceSession(
        faculty.id,
        selectedClassId,
        selectedDivisionId,
        selectedSubjectId
      );
      setActiveSession(session);
      setSecondsRemaining(QR_VALIDITY_SECONDS);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Close Session Handler
  const handleCloseSession = () => {
    if (!activeSession) return;
    storage.closeSession(activeSession.id);
    setActiveSession(null);
    setQrDataUrl('');
    setRefreshKey(prev => prev + 1);
  };

  // Manual Force Refresh
  const handleForceRefresh = async () => {
    if (!activeSession) return;
    const updated = await storage.refreshSessionToken(activeSession.id);
    setActiveSession(updated);
    setSecondsRemaining(QR_VALIDITY_SECONDS);
  };

  // Session Data & Roster
  const currentSubject = activeSession
    ? storage.getSubjectById(activeSession.subjectId)
    : storage.getSubjectById(selectedSubjectId);
  const currentClass = activeSession
    ? storage.getClassById(activeSession.classId)
    : storage.getClassById(selectedClassId);
  const currentDivision = activeSession
    ? storage.getDivisionById(activeSession.divisionId)
    : storage.getDivisionById(selectedDivisionId);

  const roster = activeSession ? storage.getSessionRoster(activeSession.id) : [];
  const presentCount = roster.filter(r => r.isPresent).length;
  const enrolledCount = roster.length;

  const pastSessions = storage
    .getSessions()
    .filter(s => s.facultyId === faculty?.id && s.status === 'CLOSED');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Faculty Workspace
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Emp Code: {faculty?.employeeCode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            {faculty?.name || 'Faculty Portal'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Conduct lecture attendance with server-signed short-lived dynamic QR tokens (25s rotation).
          </p>
        </div>

        {activeSession ? (
          <div className="flex items-center gap-3">
            <button
              id="btn-force-refresh-qr"
              onClick={handleForceRefresh}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-2 border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rotate Token</span>
            </button>

            <button
              id="btn-close-session"
              onClick={handleCloseSession}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-2 shadow-sm shadow-rose-600/30"
            >
              <Square className="w-3.5 h-3.5" />
              <span>End Lecture Session</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
              Ready to conduct lecture
            </span>
          </div>
        )}
      </div>

      {/* Main Content: Active Session or Session Creator */}
      {activeSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Dynamic QR Projector View */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            {/* Session Info Header */}
            <div className="w-full pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  {currentSubject?.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {currentSubject?.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">
                  {currentClass?.name}
                </span>
                <div className="text-xs font-bold text-slate-700">
                  {currentDivision?.name}
                </div>
              </div>
            </div>

            {/* Dynamic QR Display & Ticker */}
            <div className="my-5 relative p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Dynamic Session QR Code"
                  className="w-64 h-64 rounded-xl shadow-xs border border-slate-200/60 bg-white p-2"
                />
              ) : (
                <div className="w-64 h-64 rounded-xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
                  Generating Token...
                </div>
              )}

              {/* 25-Second Animated Countdown Pill */}
              <div className="mt-4 flex items-center gap-3 w-full justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Valid for:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {secondsRemaining}s
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Refreshes every 25s
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{
                    width: `${(secondsRemaining / QR_VALIDITY_SECONDS) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Classroom Display Note */}
            <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                Classroom Projector Display
              </p>
              <p className="text-[11px] text-slate-500">
                Display this screen in the classroom. The dynamic QR code refreshes automatically every 25 seconds.
              </p>
            </div>
          </div>

          {/* Right Column: Live Attendance Counter & Student Roster */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Count Stat Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Live Present Counter
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">
                      {presentCount}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      / {enrolledCount} enrolled students
                    </span>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {enrolledCount > 0
                        ? Math.round((presentCount / enrolledCount) * 100)
                        : 0}
                      % Present
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Users className="w-7 h-7" />
                </div>
              </div>

              {/* Real-Time Pulse Indicator */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live lecture listener polling active</span>
                </div>
                <span className="font-mono text-slate-400">
                  Session ID: {activeSession.id}
                </span>
              </div>
            </div>

            {/* Real-time Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Class Enrolment Roster ({roster.length})
                  </h4>
                </div>
                <span className="text-xs text-slate-500">
                  Auto-updates upon cryptographic verification
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Enrolment</th>
                      <th className="py-3 px-4">Attendance Status</th>
                      <th className="py-3 px-4 text-right">Time Marked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {roster.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-slate-400 text-xs"
                        >
                          No students registered in this division.
                        </td>
                      </tr>
                    ) : (
                      roster.map(item => (
                        <tr
                          key={item.student.id}
                          className={`hover:bg-slate-50/80 transition ${
                            item.isPresent ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-medium text-slate-700 text-xs">
                            {item.student.rollNo}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {item.student.name}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">
                            {item.student.enrollmentNo}
                          </td>
                          <td className="py-3 px-4">
                            {item.isPresent ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                PRESENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-slate-400 bg-slate-100">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-mono text-slate-500">
                            {item.markedAt
                              ? new Date(item.markedAt).toLocaleTimeString()
                              : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Create New Lecture Session */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <QrCode className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Configure Attendance Session
                </h3>
                <p className="text-xs text-slate-500">
                  Specify class, division, and subject to generate dynamic cryptographic QR codes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Class Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Class
                </label>
                <select
                  id="select-faculty-class"
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Semester {c.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Division Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Division
                </label>
                <select
                  id="select-faculty-division"
                  value={selectedDivisionId}
                  onChange={e => setSelectedDivisionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject / Module
                </label>
                <select
                  id="select-faculty-subject"
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.subjectType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Button & 1-Click Quick Launch */}
              <div className="pt-2 space-y-2">
                <button
                  id="btn-start-session"
                  onClick={handleStartSession}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Attendance Session & Display QR</span>
                </button>

                <button
                  id="btn-quick-start-ml"
                  onClick={() => {
                    const cls = classes[0];
                    const div = divisions[0];
                    const sub = subjects[0];
                    if (cls && div && sub && faculty) {
                      storage.startAttendanceSession(faculty.id, cls.id, div.id, sub.id).then(newSess => {
                        setActiveSession(newSess);
                        setSecondsRemaining(QR_VALIDITY_SECONDS);
                      });
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Instant Start: Machine Learning (Div A)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Info Box: Spec Guarantees */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-bold text-sm">Security Controls in Place</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                  <span>
                    <strong>25-Second Short-Lived QR:</strong> Prevents proxy attendance by invalidating tokens after 25s.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                  <span>
                    <strong>HMAC-SHA256 Signed:</strong> Every token contains nonce and server cryptographic signature.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                  <span>
                    <strong>Class & Division Match:</strong> Students outside this division or unenrolled will be rejected (403).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                  <span>
                    <strong>Duplicate Lock:</strong> Strict (session_id, student_id) uniqueness constraint prevents double scans.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* History of Past Sessions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Concluded Attendance Sessions ({pastSessions.length})
            </h4>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Class & Division</th>
                <th className="py-3 px-4">Conducted At</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Students Present</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pastSessions.map(sess => {
                const sub = storage.getSubjectById(sess.subjectId);
                const cls = storage.getClassById(sess.classId);
                const div = storage.getDivisionById(sess.divisionId);
                const count = storage.getSessionAttendanceRecords(sess.id).length;

                return (
                  <tr key={sess.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {sess.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">
                        {sub?.code}
                      </span>{' '}
                      <span className="text-slate-600 text-xs">({sub?.name})</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {cls?.name} • {div?.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(sess.startTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                        CLOSED
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {count} Present
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
