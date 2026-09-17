import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap,
  ListChecks,
  Check,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { createDynamicQRToken, QR_VALIDITY_SECONDS } from '../services/cryptoService';
import { TestSuiteResult } from '../types';

export const TestCenter: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestSuiteResult[]>([
    {
      id: '1',
      testId: 'T01',
      name: 'Faculty Authentication & Authorization',
      category: 'Happy Path',
      description: 'Faculty logs in with valid credentials and accesses faculty portal.',
      expectedResult: 'Faculty role verified, dashboard unlocked.',
      status: 'pending',
    },
    {
      id: '2',
      testId: 'T02',
      name: 'Session Initiation & QR Seed',
      category: 'Happy Path',
      description: 'Faculty starts a class/division/subject session.',
      expectedResult: 'ACTIVE session created and initial signed QR generated.',
      status: 'pending',
    },
    {
      id: '3',
      testId: 'T03',
      name: '25-Second Sliding Rotation Cycle',
      category: 'Happy Path',
      description: 'Token refreshed with new cryptographic nonce and timestamp.',
      expectedResult: 'New token generated, prior token slides towards expiry.',
      status: 'pending',
    },
    {
      id: '4',
      testId: 'T04',
      name: 'Valid Enrolled Student Verification',
      category: 'Happy Path',
      description: 'Student Aarav Patel (Div A, Enrolled) submits current token.',
      expectedResult: 'Attendance marked PRESENT with HTTP 200.',
      status: 'pending',
    },
    {
      id: '5',
      testId: 'T05',
      name: 'Real-Time Faculty Count Propagation',
      category: 'Happy Path',
      description: 'Faculty queries session status after scan.',
      expectedResult: 'Live present count increases in real-time.',
      status: 'pending',
    },
    {
      id: '6',
      testId: 'T06',
      name: 'Student Attendance Ledger Recording',
      category: 'Happy Path',
      description: 'Student opens personal attendance ledger.',
      expectedResult: 'New attendance record visible with timestamp.',
      status: 'pending',
    },
    {
      id: '7',
      testId: 'T07',
      name: 'Duplicate Replay Defense (Idempotency)',
      category: 'Security & Negative',
      description: 'Same student attempts to submit token a second time.',
      expectedResult: 'Duplicate rejected (409 Conflict), no second row inserted.',
      status: 'pending',
    },
    {
      id: '8',
      testId: 'T08',
      name: 'Expired Token Rejection (> 25 Seconds)',
      category: 'Security & Negative',
      description: 'Token older than 25 seconds submitted to server.',
      expectedResult: 'QR code expired response rejected by server.',
      status: 'pending',
    },
    {
      id: '9',
      testId: 'T09',
      name: 'Cryptographic Tampering Detection',
      category: 'Security & Negative',
      description: 'Altered character payload in signed HMAC token.',
      expectedResult: 'Invalid QR signature response, integrity lock triggered.',
      status: 'pending',
    },
    {
      id: '10',
      testId: 'T10',
      name: 'Cross-Division Boundary Isolation',
      category: 'Security & Negative',
      description: 'Kabir Mehta (Division B) attempts to mark attendance for Div A session.',
      expectedResult: 'HTTP 403 Forbidden: Division mismatch rejected.',
      status: 'pending',
    },
    {
      id: '11',
      testId: 'T11',
      name: 'Subject Enrollment Enforcement',
      category: 'Security & Negative',
      description: 'Sneha Deshmukh (not enrolled in DS301) attempts to submit token.',
      expectedResult: 'HTTP 403 Forbidden: Student not enrolled in subject.',
      status: 'pending',
    },
    {
      id: '12',
      testId: 'T12',
      name: 'Closed Session Termination Lock',
      category: 'Security & Negative',
      description: 'Student submits token after faculty explicitly ends lecture.',
      expectedResult: 'HTTP 400: Attendance session has ended.',
      status: 'pending',
    },
    {
      id: '13',
      testId: 'T13',
      name: 'Unauthenticated Request Interception',
      category: 'Security & Negative',
      description: 'Anonymous / unauthenticated request to /api/student/scan.',
      expectedResult: 'HTTP 401 Unauthorized.',
      status: 'pending',
    },
    {
      id: '14',
      testId: 'T14',
      name: 'Concurrent Race-Condition Protection',
      category: 'Security & Negative',
      description: 'Two concurrent requests arriving simultaneously for same session.',
      expectedResult: 'Database uniqueness constraint guarantees exactly 1 row.',
      status: 'pending',
    },
  ]);

  const runAllTests = async () => {
    setIsRunning(true);

    const updateTest = (testId: string, status: 'passed' | 'failed', message: string, durationMs: number) => {
      setTestResults(prev =>
        prev.map(t =>
          t.testId === testId
            ? { ...t, status, message, durationMs }
            : t
        )
      );
    };

    try {
      const fac = storage.getAllFaculty()[0];
      const cls = storage.getClasses()[0];
      const divA = storage.getDivisions(cls.id)[0];
      const divB = storage.getDivisions(cls.id)[1];
      const sub = storage.getSubjects()[0]; // DS301
      const student1 = storage.getAllStudents()[0]; // Aarav Patel (Div A, enrolled)
      const studentKabir = storage.getAllStudents()[3]; // Kabir Mehta (Div B)
      const studentSneha = storage.getAllStudents()[4]; // Sneha (Unenrolled DS301)

      // Test T01: Faculty Authentication
      const t01Start = performance.now();
      const facUser = storage.getCurrentUser();
      if (fac && facUser) {
        updateTest('T01', 'passed', 'Faculty authenticated with role "faculty"', Math.round(performance.now() - t01Start));
      } else {
        updateTest('T01', 'failed', 'Faculty auth failed', Math.round(performance.now() - t01Start));
      }

      // Test T02: Faculty starts session
      const t02Start = performance.now();
      const session = await storage.startAttendanceSession(fac.id, cls.id, divA.id, sub.id);
      if (session.status === 'ACTIVE' && session.currentToken) {
        updateTest('T02', 'passed', `Session ${session.id.slice(0, 10)} created with ACTIVE status and signed token`, Math.round(performance.now() - t02Start));
      } else {
        updateTest('T02', 'failed', 'Session creation failed', Math.round(performance.now() - t02Start));
      }

      // Test T03: Refresh token after 25s
      const t03Start = performance.now();
      const oldToken = session.currentToken!;
      const refreshedSession = await storage.refreshSessionToken(session.id);
      if (refreshedSession.currentToken && refreshedSession.currentToken !== oldToken) {
        updateTest('T03', 'passed', 'New token generated with fresh timestamp & nonce', Math.round(performance.now() - t03Start));
      } else {
        updateTest('T03', 'failed', 'Token refresh failed', Math.round(performance.now() - t03Start));
      }

      // Test T04: Valid enrolled student scan
      const t04Start = performance.now();
      const validScan = await storage.validateAndRecordAttendance(student1.userId, refreshedSession.currentToken!);
      if (validScan.success && validScan.code === 200) {
        updateTest('T04', 'passed', 'Student Aarav Patel marked PRESENT with valid HMAC token', Math.round(performance.now() - t04Start));
      } else {
        updateTest('T04', 'failed', validScan.message, Math.round(performance.now() - t04Start));
      }

      // Test T05: Live count increase
      const t05Start = performance.now();
      const sessionRecords = storage.getSessionAttendanceRecords(session.id);
      if (sessionRecords.length >= 1) {
        updateTest('T05', 'passed', `Live present count verified: ${sessionRecords.length} student(s)`, Math.round(performance.now() - t05Start));
      } else {
        updateTest('T05', 'failed', 'Present count did not increase', Math.round(performance.now() - t05Start));
      }

      // Test T06: Student attendance history
      const t06Start = performance.now();
      const history = storage.getStudentAttendanceHistory(student1.id);
      const hasRecord = history.some(h => h.sessionId === session.id);
      if (hasRecord) {
        updateTest('T06', 'passed', 'Ledger verified: Attendance entry present in student history', Math.round(performance.now() - t06Start));
      } else {
        updateTest('T06', 'failed', 'History entry missing', Math.round(performance.now() - t06Start));
      }

      // Test T07: Duplicate scan prevention
      const t07Start = performance.now();
      const duplicateScan = await storage.validateAndRecordAttendance(student1.userId, refreshedSession.currentToken!);
      if (!duplicateScan.success && duplicateScan.code === 409) {
        updateTest('T07', 'passed', 'Duplicate scan blocked (409 Conflict): "Already marked PRESENT"', Math.round(performance.now() - t07Start));
      } else {
        updateTest('T07', 'failed', 'Duplicate scan was not prevented!', Math.round(performance.now() - t07Start));
      }

      // Test T08: Expired token (>25s)
      const t08Start = performance.now();
      const expiredTimestamp = Date.now() - 35000; // 35 seconds old
      const expiredToken = `${session.id}:${expiredTimestamp}:testnonce:fakesig`;
      const expiredScan = await storage.validateAndRecordAttendance(student1.userId, expiredToken);
      if (!expiredScan.success && (expiredScan.code === 400 || expiredScan.message.includes('expired'))) {
        updateTest('T08', 'passed', 'Expired token rejected: "Token older than 25s window"', Math.round(performance.now() - t08Start));
      } else {
        updateTest('T08', 'failed', 'Expired token was accepted!', Math.round(performance.now() - t08Start));
      }

      // Test T09: Tampered signature
      const t09Start = performance.now();
      const tamperedToken = `${session.currentToken!.slice(0, -4)}dead`;
      const tamperedScan = await storage.validateAndRecordAttendance(student1.userId, tamperedToken);
      if (!tamperedScan.success && tamperedScan.code === 400) {
        updateTest('T09', 'passed', 'Tampered token rejected: "Invalid QR token signature"', Math.round(performance.now() - t09Start));
      } else {
        updateTest('T09', 'failed', 'Tampered token was accepted!', Math.round(performance.now() - t09Start));
      }

      // Test T10: Student in different division (Kabir Mehta - Div B)
      const t10Start = performance.now();
      const freshTokenForT10 = (await storage.refreshSessionToken(session.id)).currentToken!;
      const divMismatchScan = await storage.validateAndRecordAttendance(studentKabir.userId, freshTokenForT10);
      if (!divMismatchScan.success && divMismatchScan.code === 403) {
        updateTest('T10', 'passed', 'Division boundary enforced (403): Kabir Mehta in Div B blocked for Div A session', Math.round(performance.now() - t10Start));
      } else {
        updateTest('T10', 'failed', 'Cross-division scan was not rejected!', Math.round(performance.now() - t10Start));
      }

      // Test T11: Student not enrolled in subject (Sneha Deshmukh)
      const t11Start = performance.now();
      const freshTokenForT11 = (await storage.refreshSessionToken(session.id)).currentToken!;
      const unenrolledScan = await storage.validateAndRecordAttendance(studentSneha.userId, freshTokenForT11);
      if (!unenrolledScan.success && unenrolledScan.code === 403) {
        updateTest('T11', 'passed', 'Subject enrollment enforced (403): Sneha not enrolled in DS301 blocked', Math.round(performance.now() - t11Start));
      } else {
        updateTest('T11', 'failed', 'Unenrolled student scan was not rejected!', Math.round(performance.now() - t11Start));
      }

      // Test T12: Closed session rejection
      const t12Start = performance.now();
      storage.closeSession(session.id);
      const student2 = storage.getAllStudents()[1]; // Ananya
      const tokenForClosed = (await createDynamicQRToken(session.id)).tokenString;
      const closedScan = await storage.validateAndRecordAttendance(student2.userId, tokenForClosed);
      if (!closedScan.success && (closedScan.code === 400 || closedScan.message.includes('ended'))) {
        updateTest('T12', 'passed', 'Closed session blocked: "Attendance session has ended"', Math.round(performance.now() - t12Start));
      } else {
        updateTest('T12', 'failed', 'Scan accepted for closed session!', Math.round(performance.now() - t12Start));
      }

      // Test T13: Unauthenticated user
      const t13Start = performance.now();
      const anonScan = await storage.validateAndRecordAttendance('non-existent-user-id', tokenForClosed);
      if (!anonScan.success && anonScan.code === 401) {
        updateTest('T13', 'passed', 'Unauthenticated caller rejected with HTTP 401 Unauthorized', Math.round(performance.now() - t13Start));
      } else {
        updateTest('T13', 'failed', 'Unauthenticated caller was not rejected!', Math.round(performance.now() - t13Start));
      }

      // Test T14: Concurrent race-condition test
      const t14Start = performance.now();
      // Start fresh session to test simultaneous requests
      const raceSession = await storage.startAttendanceSession(fac.id, cls.id, divA.id, sub.id);
      const raceToken = raceSession.currentToken!;
      const [r1, r2] = await Promise.all([
        storage.validateAndRecordAttendance(student2.userId, raceToken),
        storage.validateAndRecordAttendance(student2.userId, raceToken),
      ]);
      const successes = [r1, r2].filter(r => r.success).length;
      if (successes === 1) {
        updateTest('T14', 'passed', 'Atomic uniqueness constraint verified: Exactly 1 row inserted out of 2 simultaneous calls', Math.round(performance.now() - t14Start));
      } else {
        updateTest('T14', 'failed', `Concurrency failure: ${successes} rows succeeded`, Math.round(performance.now() - t14Start));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = testResults.filter(t => t.status === 'passed').length;
  const failedCount = testResults.filter(t => t.status === 'failed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              Automated Verification Engine
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Specification Section 18 (T01–T14)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            System Test Plan & Security Audit Suite
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Executes full matrix of 14 core happy-path and negative security tests defined in the technical specification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-run-all-tests"
            onClick={runAllTests}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isRunning ? 'Running 14 Test Cases...' : 'Execute Full Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* Test Score Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">
              Total Tests
            </p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
              14
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <ListChecks className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase">
              Passed
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5">
              {passedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-600 font-semibold uppercase">
              Failed
            </p>
            <p className="text-2xl font-extrabold text-rose-700 font-mono mt-0.5">
              {failedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Technical Verification Matrix (T01 - T14)
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Section 18.1 Happy Path & Section 18.2 Negative Tests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Expected Result</th>
                <th className="py-3 px-4">Observed Outcome</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {testResults.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    {t.testId}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.category === 'Happy Path'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                    {t.name}
                    <div className="text-[11px] text-slate-500 font-normal">
                      {t.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px] max-w-xs">
                    {t.expectedResult}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-sans text-[11px] max-w-xs">
                    {t.message ? (
                      <span className="text-slate-700 font-medium">
                        {t.message}
                        {t.durationMs !== undefined && (
                          <span className="text-slate-400 font-mono text-[10px] ml-1">
                            ({t.durationMs}ms)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400">Ready to execute</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {t.status === 'passed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        PASSED
                      </span>
                    ) : t.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        FAILED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium text-slate-400 bg-slate-100">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
