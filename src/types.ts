export type Role = 'faculty' | 'student' | 'admin';

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface AcademicYear {
  id: string;
  yearName: string; // e.g. "2026-27"
  isCurrent: boolean;
}

export interface Department {
  id: string;
  name: string; // e.g. "Department of Data Science"
  code: string; // e.g. "DS"
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "SY B.Tech Data Science"
  programme: string; // e.g. "B.Tech"
  year: number; // 2
  semester: number; // 3
  academicYearId: string;
  departmentId: string;
}

export interface Division {
  id: string;
  name: string; // e.g. "Division A"
  classId: string;
}

export interface Faculty {
  id: string;
  userId: string;
  employeeCode: string;
  name: string;
  departmentId: string;
  designation: string;
}

export interface Student {
  id: string;
  userId: string;
  rollNo: string;
  enrollmentNo: string;
  name: string;
  classId: string;
  divisionId: string;
  status: 'active' | 'suspended';
}

export interface Subject {
  id: string;
  code: string; // e.g. "DS301"
  name: string; // e.g. "Machine Learning"
  subjectType: 'Theory' | 'Practical';
  departmentId: string;
  facultyId: string;
}

export interface StudentSubject {
  id: string;
  studentId: string;
  subjectId: string;
  academicYearId: string;
}

export type SessionStatus = 'ACTIVE' | 'CLOSED';

export interface AttendanceSession {
  id: string;
  classId: string;
  divisionId: string;
  subjectId: string;
  facultyId: string;
  startTime: string; // ISO string
  endTime?: string;
  status: SessionStatus;
  currentToken?: string;
  tokenIssuedAt?: number; // epoch ms
  currentNonce?: string;
  expiresInSeconds?: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  markedAt: string; // ISO string
  status: 'PRESENT';
  verifiedVia: 'DYNAMIC_QR' | 'TEST_TOKEN';
  subjectId?: string;
  classId?: string;
  divisionId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  role: Role;
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'WARNING' | 'REJECTED';
}

export interface TokenPayload {
  sessionId: string;
  issuedTimestamp: number;
  nonce: string;
  signature: string;
}

export interface ScanValidationResult {
  success: boolean;
  code: number;
  message: string;
  record?: AttendanceRecord;
  checks?: {
    authenticatedStudent: boolean;
    tokenFormatValid: boolean;
    tokenSignatureValid: boolean;
    tokenAgeValid: boolean;
    activeSession: boolean;
    classMatch: boolean;
    divisionMatch: boolean;
    subjectEnrolled: boolean;
    notDuplicate: boolean;
  };
  details?: {
    tokenAgeSeconds?: number;
    studentName?: string;
    rollNo?: string;
    subjectName?: string;
  };
}

export interface TestSuiteResult {
  id: string;
  testId: string;
  name: string;
  category: 'Happy Path' | 'Security & Negative';
  description: string;
  expectedResult: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  durationMs?: number;
}
