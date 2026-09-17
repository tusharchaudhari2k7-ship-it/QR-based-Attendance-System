import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  AlertOctagon,
  Clock,
  History,
  ShieldCheck,
  User as UserIcon,
  BookOpen,
  Scan,
  RotateCcw,
  Copy,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { User, Student, ScanValidationResult } from '../types';

interface StudentPortalProps {
  currentUser: User;
  onNavigateToSimulator?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  onNavigateToSimulator,
}) => {
  const student = storage.getStudentByUserId(currentUser.id);
  const studentClass = student ? storage.getClassById(student.classId) : null;
  const studentDivision = student ? storage.getDivisionById(student.divisionId) : null;

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ScanValidationResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Load stats and history
  const [historyKey, setHistoryKey] = useState<number>(0);
  const history = student ? storage.getStudentAttendanceHistory(student.id) : [];
  const stats = student ? storage.getStudentAttendanceStats(student.id) : null;

  // Live Camera Scanner using jsQR
  useEffect(() => {
    if (!isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    let localStream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      .then(stream => {
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          requestAnimationFrame(scanVideoFrame);
        }
      })
      .catch(err => {
        console.warn('Camera access denied or unavailable in environment:', err);
        setCameraError(
          'Camera access is unavailable or denied. If a lecture is active, you can tap "Mark Present" above.'
        );
        setIsCameraActive(false);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive]);

  // Video scanning loop
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Found QR Code! Submit immediately
          setIsCameraActive(false);
          handleTokenSubmit(code.data, false);
          return;
        }
      }
    }

    if (isCameraActive) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // Submit token to server validation chain (Section 11.1)
  const handleTokenSubmit = async (tokenString: string, isTestToken = true) => {
    if (!student || !tokenString.trim()) return;

    setIsSubmitting(true);
    setValidationResult(null);

    try {
      const result = await storage.validateAndRecordAttendance(
        currentUser.id,
        tokenString.trim(),
        isTestToken
      );
      setValidationResult(result);
      if (result.success) {
        setHistoryKey(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active session detection
  const activeSessions = storage.getSessions().filter(s => s.status === 'ACTIVE');
  const currentActiveSession = activeSessions.length > 0 ? activeSessions[0] : null;
  const activeSubject = currentActiveSession ? storage.getSubjectById(currentActiveSession.subjectId) : null;
  const activeFaculty = currentActiveSession ? storage.getFacultyById(currentActiveSession.facultyId) : null;
  const isStudentDivisionMatch = currentActiveSession && student
    ? currentActiveSession.divisionId === student.divisionId
    : false;
  const alreadyMarkedInActiveSession = currentActiveSession && student
    ? storage.getSessionAttendanceRecords(currentActiveSession.id).some(
        r => r.studentId === student.id && r.status === 'PRESENT'
      )
    : false;

  // Quick helper: Instant 1-tap scan for active session
  const handleInstantScanActiveSession = () => {
    if (currentActiveSession && currentActiveSession.currentToken) {
      handleTokenSubmit(currentActiveSession.currentToken, true);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Active Lecture Banner / Status */}
      {currentActiveSession ? (
        <div className={`rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
          alreadyMarkedInActiveSession
            ? 'bg-emerald-50 border-emerald-200'
            : isStudentDivisionMatch
            ? 'bg-indigo-50/80 border-indigo-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${
              alreadyMarkedInActiveSession
                ? 'bg-emerald-600'
                : isStudentDivisionMatch
                ? 'bg-indigo-600 animate-pulse'
                : 'bg-amber-600'
            }`}>
              {alreadyMarkedInActiveSession ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <Scan className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  alreadyMarkedInActiveSession
                    ? 'bg-emerald-200/60 text-emerald-800'
                    : isStudentDivisionMatch
                    ? 'bg-indigo-200/60 text-indigo-800'
                    : 'bg-amber-200/60 text-amber-800'
                }`}>
                  {alreadyMarkedInActiveSession
                    ? 'Attendance Recorded'
                    : isStudentDivisionMatch
                    ? 'Live Lecture in Progress'
                    : 'Division Mismatch Notice'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {activeSubject?.code}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {activeSubject?.name}
              </h3>
              <p className="text-xs text-slate-600">
                Faculty: <strong>{activeFaculty?.name}</strong> • 25s Rotating Dynamic QR Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {alreadyMarkedInActiveSession ? (
              <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Marked Present</span>
              </span>
            ) : isStudentDivisionMatch ? (
              <button
                id="btn-instant-mark-present"
                onClick={handleInstantScanActiveSession}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Verifying...' : '⚡ Mark Present (1-Tap Scan)'}</span>
              </button>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-200">
                Not your division
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>No lecture session is currently active. Attendance will open once faculty starts the class.</span>
        </div>
      )}

      {/* Student Identity Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-xs">
              {student?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Student Identity
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Roll: {student?.rollNo}
                </span>
                <span className="text-xs font-mono text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-500">
                  Enrol: {student?.enrollmentNo}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {student?.name}
              </h2>
              <p className="text-xs text-slate-500">
                {studentClass?.name} •{' '}
                <strong className="text-slate-700">{studentDivision?.name}</strong>
              </p>
            </div>
          </div>

          {/* Attendance Stats Pill */}
          {stats && (
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Attendance Rate
                </p>
                <p className="text-2xl font-extrabold text-slate-900 font-mono">
                  {stats.percentage}%
                </p>
              </div>
              <div className="h-9 w-px bg-slate-200"></div>
              <div className="text-left text-xs text-slate-600 space-y-0.5">
                <p>
                  Present: <strong className="text-emerald-700 font-bold">{stats.totalPresent}</strong>
                </p>
                <p>
                  Total Lectures: <strong className="text-slate-800">{stats.totalConducted}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Scanner Card & Validation Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera QR Scanner */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Scan Lecture QR Code
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Point at projector screen
              </span>
            </div>

            {/* Camera Viewport / Toggle Area */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[220px] flex flex-col items-center justify-center p-4 text-center border border-slate-800">
              {isCameraActive ? (
                <div className="relative w-full aspect-video max-w-sm rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Laser Scanning Frame overlay */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/60 rounded-xl m-6">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                    <div className="w-full h-0.5 bg-indigo-400/80 shadow-lg shadow-indigo-400 animate-pulse absolute top-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Camera QR Scanner
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                      Scan the 25-second changing QR code displayed on the classroom screen.
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Action Toggle Button */}
              <div className="mt-3">
                <button
                  id="btn-toggle-camera"
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isCameraActive
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/30'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isCameraActive ? 'Turn Off Camera' : 'Launch Camera Scanner'}</span>
                </button>
              </div>

              {cameraError && (
                <div className="mt-3 p-2 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded-lg max-w-xs text-left">
                  {cameraError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Status & Subject Progress */}
        <div className="lg:col-span-6 space-y-6">
          {/* Validation Feedback Banner */}
          {validationResult && (
            <div
              className={`rounded-2xl p-5 border shadow-xs space-y-2 ${
                validationResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-3">
                {validationResult.success ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold leading-snug">
                    {validationResult.success ? 'Attendance Recorded Successfully' : 'Attendance Not Recorded'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {validationResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subject Attendance Breakdown Cards */}
          {stats && stats.subjectBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Enrolled Subjects & Attendance %
                </h4>
                <span className="text-[11px] text-slate-500">Min 75% Requirement</span>
              </div>
              <div className="space-y-3">
                {stats.subjectBreakdown.map(item => (
                  <div key={item.subject.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">
                        {item.subject.code} - {item.subject.name}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          item.percentage >= 75 ? 'text-emerald-700' : 'text-amber-600'
                        }`}
                      >
                        {item.present}/{item.conducted} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Recorded Attendance History ({history.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {student?.name} ({student?.rollNo})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Conducted By</th>
                <th className="py-3 px-4">Date & Time Marked</th>
                <th className="py-3 px-4">Verification Path</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    No attendance records logged yet.
                  </td>
                </tr>
              ) : (
                history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {item.subjectCode}
                      </div>
                      <div className="text-xs text-slate-500">{item.subjectName}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {item.facultyName}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {new Date(item.markedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.verifiedVia}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PRESENT
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
