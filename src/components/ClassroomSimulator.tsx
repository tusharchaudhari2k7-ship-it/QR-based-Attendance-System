import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Tv,
  Smartphone,
  Play,
  RotateCcw,
  Clock,
  Users,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { QR_VALIDITY_SECONDS } from '../services/cryptoService';
import { ScanValidationResult, User, Student } from '../types';

export const ClassroomSimulator: React.FC = () => {
  const [session, setSession] = useState(
    storage.getSessions().find(s => s.status === 'ACTIVE') || null
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(QR_VALIDITY_SECONDS);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Student device state
  const students = storage.getAllStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [tokenToSubmit, setTokenToSubmit] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanValidationResult | null>(null);

  const selectedStudent = storage.getStudentById(selectedStudentId);
  const faculty = session ? storage.getFacultyById(session.facultyId) : storage.getAllFaculty()[0];
  const subject = session ? storage.getSubjectById(session.subjectId) : storage.getSubjects()[0];

  // Initialize or start session if none active
  useEffect(() => {
    if (!session) {
      (async () => {
        const fac = storage.getAllFaculty()[0];
        const cls = storage.getClasses()[0];
        const divs = storage.getDivisions(cls.id);
        const sub = storage.getSubjects()[0];
        const newSess = await storage.startAttendanceSession(
          fac.id,
          cls.id,
          divs[0].id,
          sub.id
        );
        setSession(newSess);
      })();
    }
  }, []);

  // Update QR Code
  useEffect(() => {
    if (session?.currentToken) {
      QRCode.toDataURL(
        session.currentToken,
        {
          width: 260,
          margin: 1.5,
          color: { dark: '#0f172a', light: '#ffffff' },
        },
        (err, url) => {
          if (!err && url) setQrDataUrl(url);
        }
      );
    }
  }, [session?.currentToken]);

  // 25-second token timer loop
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') return;

    const timer = setInterval(async () => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          (async () => {
            try {
              const updated = await storage.refreshSessionToken(session.id);
              setSession(updated);
            } catch (err) {
              console.error(err);
            }
          })();
          return QR_VALIDITY_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.id, session?.status]);

  // Handle Token Submission from Simulated Student Mobile
  const handleScanSubmit = async (customToken?: string) => {
    if (!selectedStudent || !session) return;
    const token = customToken || tokenToSubmit || session.currentToken || '';
    if (!token) return;

    setIsSubmitting(true);
    setScanResult(null);

    try {
      const result = await storage.validateAndRecordAttendance(
        selectedStudent.userId,
        token,
        true
      );
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Roster and count
  const roster = session ? storage.getSessionRoster(session.id) : [];
  const presentCount = roster.filter(r => r.isPresent).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              Interactive Dual Simulation Mode
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Live Classroom Workflow (Section 6 & 15.2)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Faculty Projector vs. Student Smartphone
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Test real-time 25s dynamic QR rotation, immediate student scan submissions, and instant server attendance updates side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (session) {
                const refreshed = await storage.refreshSessionToken(session.id);
                setSession(refreshed);
                setSecondsRemaining(QR_VALIDITY_SECONDS);
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-2 border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Rotate QR (New Nonce)</span>
          </button>
        </div>
      </div>

      {/* Dual Split Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Faculty Projector Screen */}
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Projector Background Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Projector Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-100">
                    Classroom Projector Display
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Faculty: {faculty?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {presentCount} Marked Present
                </span>
              </div>
            </div>

            {/* Subject Banner */}
            <div className="my-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400">
                  {subject?.code}
                </span>
                <h4 className="text-sm font-bold text-white leading-snug">
                  {subject?.name}
                </h4>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Second Year B.Tech DS</p>
                <p className="font-semibold text-slate-200">Division A</p>
              </div>
            </div>

            {/* Center Dynamic QR Code */}
            <div className="py-4 flex flex-col items-center">
              <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-indigo-950/50">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Classroom Dynamic QR"
                    className="w-52 h-52 rounded-lg"
                  />
                ) : (
                  <div className="w-52 h-52 bg-slate-200 rounded-lg animate-pulse"></div>
                )}
              </div>

              {/* 25-Second Rotating Countdown */}
              <div className="mt-4 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs shadow-xs">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-slate-300">Token validity:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {secondsRemaining}s
                </span>
                <span className="text-[10px] text-slate-500">| Auto-rotates</span>
              </div>

              {/* Countdown Progress */}
              <div className="w-64 bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{
                    width: `${(secondsRemaining / QR_VALIDITY_SECONDS) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Copy Token for Windows Testing */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono truncate max-w-xs text-[10px]">
              {session?.currentToken}
            </span>
            <button
              onClick={() => {
                if (session?.currentToken) {
                  navigator.clipboard.writeText(session.currentToken);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center gap-1 transition text-[11px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Simulated Student Smartphone */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm bg-white rounded-3xl border-8 border-slate-900 shadow-2xl p-5 flex flex-col justify-between min-h-[580px] relative">
            {/* Phone Notch / Speaker bar */}
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto -mt-6 mb-3"></div>

            <div className="space-y-4">
              {/* Phone Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-slate-800">
                    Student Mobile Browser
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                  HTTPS Connected
                </span>
              </div>

              {/* Student Switcher for Testing Different Scenarios */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Simulate Student Profile:
                </label>
                <select
                  id="select-sim-student"
                  value={selectedStudentId}
                  onChange={e => {
                    setSelectedStudentId(e.target.value);
                    setScanResult(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                >
                  {students.map(s => {
                    const div = storage.getDivisionById(s.divisionId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.rollNo}) - {div?.name}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tip: Pick Kabir Mehta (Div B) or Sneha Deshmukh to test 403 rejections!
                </p>
              </div>

              {/* Simulated Scanner Action Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    One-Click Token Scan
                  </span>
                  <span className="text-[10px] text-indigo-600 font-mono">
                    T04 / T07 / T10
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-snug">
                  Reads the currently valid dynamic QR token from the projector screen and fires the server validation pipeline.
                </p>

                <button
                  id="btn-sim-instant-scan"
                  onClick={() => handleScanSubmit(session?.currentToken)}
                  disabled={isSubmitting || !session?.currentToken}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Projected Dynamic QR</span>
                </button>
              </div>

              {/* Or Paste Expired / Altered Token for Negative Testing */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Custom Token Test:</span>
                  <button
                    onClick={() => {
                      // Construct an expired token (>25s)
                      if (session) {
                        const oldTime = Date.now() - 35000;
                        setTokenToSubmit(`${session.id}:${oldTime}:oldnonce:oldsig`);
                      }
                    }}
                    className="text-[10px] text-amber-600 hover:underline"
                  >
                    Simulate Expired Token
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Or paste custom token string..."
                  value={tokenToSubmit}
                  onChange={e => setTokenToSubmit(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                />
                {tokenToSubmit && (
                  <button
                    onClick={() => handleScanSubmit(tokenToSubmit)}
                    className="w-full py-1.5 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                  >
                    Submit Custom Token
                  </button>
                )}
              </div>

              {/* Real-Time Scan Result inside Phone Display */}
              {scanResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    scanResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {scanResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                    )}
                    <span>HTTP {scanResult.code}</span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    {scanResult.message}
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Phone Home Indicator */}
            <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
