import {
  AcademicYear,
  Department,
  ClassRoom,
  Division,
  Faculty,
  Student,
  Subject,
  StudentSubject,
  User,
  AttendanceSession,
  AttendanceRecord,
  AuditLog,
  ScanValidationResult,
} from '../types';
import {
  SEED_ACADEMIC_YEARS,
  SEED_DEPARTMENTS,
  SEED_CLASSES,
  SEED_DIVISIONS,
  SEED_FACULTY,
  SEED_STUDENTS,
  SEED_SUBJECTS,
  SEED_STUDENT_SUBJECTS,
  SEED_USERS,
  INITIAL_SESSIONS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';
import { createDynamicQRToken, verifyTokenStructureAndAge } from './cryptoService';

const STORAGE_KEYS = {
  USERS: 'qr_att_users',
  ACADEMIC_YEARS: 'qr_att_academic_years',
  DEPARTMENTS: 'qr_att_departments',
  CLASSES: 'qr_att_classes',
  DIVISIONS: 'qr_att_divisions',
  FACULTY: 'qr_att_faculty',
  STUDENTS: 'qr_att_students',
  SUBJECTS: 'qr_att_subjects',
  STUDENT_SUBJECTS: 'qr_att_student_subjects',
  SESSIONS: 'qr_att_sessions',
  RECORDS: 'qr_att_records',
  AUDIT_LOGS: 'qr_att_audit_logs',
  CURRENT_USER_ID: 'qr_att_current_user_id',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading storage for ${key}`, err);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving storage for ${key}`, err);
  }
}

class StorageManager {
  private users: User[];
  private academicYears: AcademicYear[];
  private departments: Department[];
  private classes: ClassRoom[];
  private divisions: Division[];
  private faculty: Faculty[];
  private students: Student[];
  private subjects: Subject[];
  private studentSubjects: StudentSubject[];
  private sessions: AttendanceSession[];
  private records: AttendanceRecord[];
  private auditLogs: AuditLog[];
  private currentUserId: string;

  constructor() {
    this.users = loadStorage(STORAGE_KEYS.USERS, SEED_USERS);
    this.academicYears = loadStorage(STORAGE_KEYS.ACADEMIC_YEARS, SEED_ACADEMIC_YEARS);
    this.departments = loadStorage(STORAGE_KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
    this.classes = loadStorage(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    this.divisions = loadStorage(STORAGE_KEYS.DIVISIONS, SEED_DIVISIONS);
    this.faculty = loadStorage(STORAGE_KEYS.FACULTY, SEED_FACULTY);
    this.students = loadStorage(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    this.subjects = loadStorage(STORAGE_KEYS.SUBJECTS, SEED_SUBJECTS);
    this.studentSubjects = loadStorage(STORAGE_KEYS.STUDENT_SUBJECTS, SEED_STUDENT_SUBJECTS);
    this.sessions = loadStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    this.records = loadStorage(STORAGE_KEYS.RECORDS, INITIAL_ATTENDANCE_RECORDS);
    this.auditLogs = loadStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.currentUserId = loadStorage(STORAGE_KEYS.CURRENT_USER_ID, 'user-fac-1');
  }

  public resetToSeed(): void {
    this.users = SEED_USERS;
    this.academicYears = SEED_ACADEMIC_YEARS;
    this.departments = SEED_DEPARTMENTS;
    this.classes = SEED_CLASSES;
    this.divisions = SEED_DIVISIONS;
    this.faculty = SEED_FACULTY;
    this.students = SEED_STUDENTS;
    this.subjects = SEED_SUBJECTS;
    this.studentSubjects = SEED_STUDENT_SUBJECTS;
    this.sessions = INITIAL_SESSIONS;
    this.records = INITIAL_ATTENDANCE_RECORDS;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.currentUserId = 'user-fac-1';

    saveStorage(STORAGE_KEYS.USERS, this.users);
    saveStorage(STORAGE_KEYS.ACADEMIC_YEARS, this.academicYears);
    saveStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);
    saveStorage(STORAGE_KEYS.CLASSES, this.classes);
    saveStorage(STORAGE_KEYS.DIVISIONS, this.divisions);
    saveStorage(STORAGE_KEYS.FACULTY, this.faculty);
    saveStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveStorage(STORAGE_KEYS.SUBJECTS, this.subjects);
    saveStorage(STORAGE_KEYS.STUDENT_SUBJECTS, this.studentSubjects);
    saveStorage(STORAGE_KEYS.SESSIONS, this.sessions);
    saveStorage(STORAGE_KEYS.RECORDS, this.records);
    saveStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    saveStorage(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
  }

  // Auth & Users
  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    return user || this.users[0];
  }

  public setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    saveStorage(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public getFacultyByUserId(userId: string): Faculty | undefined {
    return this.faculty.find(f => f.userId === userId);
  }

  public getStudentByUserId(userId: string): Student | undefined {
    return this.students.find(s => s.userId === userId);
  }

  public getStudentById(studentId: string): Student | undefined {
    return this.students.find(s => s.id === studentId);
  }

  public getFacultyById(facultyId: string): Faculty | undefined {
    return this.faculty.find(f => f.id === facultyId);
  }

  // Master Data Getters
  public getAcademicYears(): AcademicYear[] {
    return this.academicYears;
  }

  public getDepartments(): Department[] {
    return this.departments;
  }

  public getDepartmentById(departmentId: string): Department | undefined {
    return this.departments.find(d => d.id === departmentId);
  }

  public getClasses(): ClassRoom[] {
    return this.classes;
  }

  public getDivisions(classId?: string): Division[] {
    if (classId) {
      return this.divisions.filter(d => d.classId === classId);
    }
    return this.divisions;
  }

  public getSubjects(departmentId?: string): Subject[] {
    if (departmentId) {
      return this.subjects.filter(s => s.departmentId === departmentId);
    }
    return this.subjects;
  }

  public getSubjectById(subjectId: string): Subject | undefined {
    return this.subjects.find(s => s.id === subjectId);
  }

  public getClassById(classId: string): ClassRoom | undefined {
    return this.classes.find(c => c.id === classId);
  }

  public getDivisionById(divisionId: string): Division | undefined {
    return this.divisions.find(d => d.id === divisionId);
  }

  public getAllStudents(): Student[] {
    return this.students;
  }

  public getAllFaculty(): Faculty[] {
    return this.faculty;
  }

  // Attendance Sessions (Faculty Actions)
  public getActiveSessionForFaculty(facultyId: string): AttendanceSession | undefined {
    return this.sessions.find(s => s.facultyId === facultyId && s.status === 'ACTIVE');
  }

  public getSessions(): AttendanceSession[] {
    return this.sessions;
  }

  public getSessionById(sessionId: string): AttendanceSession | undefined {
    return this.sessions.find(s => s.id === sessionId);
  }

  public async startAttendanceSession(
    facultyId: string,
    classId: string,
    divisionId: string,
    subjectId: string
  ): Promise<AttendanceSession> {
    // If faculty already has active session, close or reuse
    const existing = this.getActiveSessionForFaculty(facultyId);
    if (existing) {
      // Re-generate fresh token
      return await this.refreshSessionToken(existing.id);
    }

    const sessionId = 'sess-' + Date.now();
    const tokenData = await createDynamicQRToken(sessionId);

    const newSession: AttendanceSession = {
      id: sessionId,
      classId,
      divisionId,
      subjectId,
      facultyId,
      startTime: new Date().toISOString(),
      status: 'ACTIVE',
      currentToken: tokenData.tokenString,
      tokenIssuedAt: tokenData.issuedTimestamp,
      currentNonce: tokenData.nonce,
      expiresInSeconds: tokenData.expiresInSeconds,
    };

    this.sessions = [newSession, ...this.sessions];
    saveStorage(STORAGE_KEYS.SESSIONS, this.sessions);

    const faculty = this.getFacultyById(facultyId);
    const subject = this.getSubjectById(subjectId);
    this.addAuditLog(
      'SESSION_STARTED',
      faculty?.name || 'Faculty',
      'faculty',
      `Started live session ${sessionId} for ${subject?.code} - ${subject?.name}`,
      'SUCCESS'
    );

    return newSession;
  }

  public async refreshSessionToken(sessionId: string): Promise<AttendanceSession> {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const session = this.sessions[index];
    if (session.status !== 'ACTIVE') {
      throw new Error(`Cannot refresh token: Session is not ACTIVE`);
    }

    const tokenData = await createDynamicQRToken(sessionId);
    const updated: AttendanceSession = {
      ...session,
      currentToken: tokenData.tokenString,
      tokenIssuedAt: tokenData.issuedTimestamp,
      currentNonce: tokenData.nonce,
      expiresInSeconds: tokenData.expiresInSeconds,
    };

    this.sessions[index] = updated;
    this.sessions = [...this.sessions];
    saveStorage(STORAGE_KEYS.SESSIONS, this.sessions);
    return updated;
  }

  public closeSession(sessionId: string): AttendanceSession {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const session = this.sessions[index];
    const presentCount = this.records.filter(r => r.sessionId === sessionId).length;

    const closed: AttendanceSession = {
      ...session,
      status: 'CLOSED',
      endTime: new Date().toISOString(),
      currentToken: undefined,
    };

    this.sessions[index] = closed;
    this.sessions = [...this.sessions];
    saveStorage(STORAGE_KEYS.SESSIONS, this.sessions);

    const faculty = this.getFacultyById(session.facultyId);
    this.addAuditLog(
      'SESSION_CLOSED',
      faculty?.name || 'Faculty',
      'faculty',
      `Concluded attendance session ${sessionId}. Total Present: ${presentCount}`,
      'SUCCESS'
    );

    return closed;
  }

  // Session Roster & Status
  public getSessionAttendanceRecords(sessionId: string): AttendanceRecord[] {
    return this.records.filter(r => r.sessionId === sessionId);
  }

  public getSessionRoster(sessionId: string): Array<{
    student: Student;
    isEnrolled: boolean;
    isPresent: boolean;
    markedAt?: string;
  }> {
    const session = this.getSessionById(sessionId);
    if (!session) return [];

    // All students in this class and division
    const classStudents = this.students.filter(
      s => s.classId === session.classId && s.divisionId === session.divisionId
    );

    return classStudents.map(student => {
      // Check enrollment
      const isEnrolled = this.studentSubjects.some(
        ss => ss.studentId === student.id && ss.subjectId === session.subjectId
      );
      const record = this.records.find(
        r => r.sessionId === sessionId && r.studentId === student.id
      );

      return {
        student,
        isEnrolled,
        isPresent: !!record,
        markedAt: record?.markedAt,
      };
    });
  }

  // Student Scan Validation Chain (Section 11.1)
  public async validateAndRecordAttendance(
    studentUserId: string,
    submittedToken: string,
    isTestToken = false
  ): Promise<ScanValidationResult> {
    const checks = {
      authenticatedStudent: false,
      tokenFormatValid: false,
      tokenSignatureValid: false,
      tokenAgeValid: false,
      activeSession: false,
      classMatch: false,
      divisionMatch: false,
      subjectEnrolled: false,
      notDuplicate: false,
    };

    // 1. Confirm a logged-in user exists and has STUDENT role
    const user = this.users.find(u => u.id === studentUserId);
    if (!user || user.role !== 'student') {
      return {
        success: false,
        code: 401,
        message: 'Unauthorized: User is not an authenticated student account.',
        checks,
      };
    }
    checks.authenticatedStudent = true;

    // 2. Load the corresponding student profile
    const student = this.getStudentByUserId(studentUserId);
    if (!student) {
      return {
        success: false,
        code: 404,
        message: 'Student academic profile not found for this account.',
        checks,
      };
    }

    // 3. Validate token structure, signature and age
    const cryptoResult = await verifyTokenStructureAndAge(submittedToken);
    if (!cryptoResult.valid) {
      if (cryptoResult.message.includes('expired')) {
        checks.tokenFormatValid = true;
        checks.tokenSignatureValid = true;
        checks.tokenAgeValid = false;
      } else {
        checks.tokenFormatValid = false;
        checks.tokenSignatureValid = false;
      }

      this.addAuditLog(
        'SCAN_REJECTED',
        student.name,
        'student',
        `Failed token validation: ${cryptoResult.message}`,
        'REJECTED'
      );

      return {
        success: false,
        code: cryptoResult.code,
        message: cryptoResult.message,
        checks,
        details: {
          tokenAgeSeconds: cryptoResult.ageSeconds,
          studentName: student.name,
          rollNo: student.rollNo,
        },
      };
    }

    checks.tokenFormatValid = true;
    checks.tokenSignatureValid = true;
    checks.tokenAgeValid = true;

    const sessionId = cryptoResult.sessionId!;

    // 4. Load the attendance session and confirm ACTIVE status
    const session = this.getSessionById(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      this.addAuditLog(
        'SCAN_REJECTED',
        student.name,
        'student',
        `Attempted scan for inactive or closed session ${sessionId}`,
        'REJECTED'
      );
      return {
        success: false,
        code: 400,
        message: 'Attendance session has ended or is not currently active.',
        checks,
        details: { studentName: student.name, rollNo: student.rollNo },
      };
    }
    checks.activeSession = true;

    const subject = this.getSubjectById(session.subjectId);

    // 5. Confirm the student class matches the session class
    if (student.classId !== session.classId) {
      this.addAuditLog(
        'SCAN_REJECTED',
        student.name,
        'student',
        `Class mismatch: Student is in ${student.classId}, session is for ${session.classId}`,
        'REJECTED'
      );
      return {
        success: false,
        code: 403,
        message: 'Class mismatch: You are not enrolled in the academic class conducting this session.',
        checks,
        details: { studentName: student.name, rollNo: student.rollNo, subjectName: subject?.name },
      };
    }
    checks.classMatch = true;

    // 6. Confirm the student division matches the session division (T10 test!)
    if (student.divisionId !== session.divisionId) {
      const studentDiv = this.getDivisionById(student.divisionId)?.name || student.divisionId;
      const sessionDiv = this.getDivisionById(session.divisionId)?.name || session.divisionId;
      this.addAuditLog(
        'SCAN_REJECTED',
        student.name,
        'student',
        `Division mismatch (T10): Student in ${studentDiv} attempted scan for session in ${sessionDiv}`,
        'REJECTED'
      );
      return {
        success: false,
        code: 403,
        message: `Division mismatch (403): You belong to ${studentDiv}, but this attendance session is strictly for ${sessionDiv}.`,
        checks,
        details: { studentName: student.name, rollNo: student.rollNo, subjectName: subject?.name },
      };
    }
    checks.divisionMatch = true;

    // 7. Confirm the student is enrolled in the session subject (T11 test!)
    const isEnrolled = this.studentSubjects.some(
      ss => ss.studentId === student.id && ss.subjectId === session.subjectId
    );
    if (!isEnrolled) {
      this.addAuditLog(
        'SCAN_REJECTED',
        student.name,
        'student',
        `Subject enrollment error (T11): Student not enrolled in ${subject?.code} - ${subject?.name}`,
        'REJECTED'
      );
      return {
        success: false,
        code: 403,
        message: `Subject enrollment error (403): You are not registered/enrolled in subject "${subject?.code} ${subject?.name}".`,
        checks,
        details: { studentName: student.name, rollNo: student.rollNo, subjectName: subject?.name },
      };
    }
    checks.subjectEnrolled = true;

    // 8. Check for an existing attendance row: (session_id, student_id) uniqueness constraint (T07 test!)
    const existing = this.records.find(
      r => r.sessionId === sessionId && r.studentId === student.id
    );
    if (existing) {
      this.addAuditLog(
        'SCAN_DUPLICATE',
        student.name,
        'student',
        `Duplicate attendance attempt (T07) for session ${sessionId}. Already marked at ${new Date(existing.markedAt).toLocaleTimeString()}`,
        'WARNING'
      );
      return {
        success: false,
        code: 409,
        message: `Duplicate submission: You have already been marked PRESENT for this session at ${new Date(existing.markedAt).toLocaleTimeString()}.`,
        checks: { ...checks, notDuplicate: false },
        details: { studentName: student.name, rollNo: student.rollNo, subjectName: subject?.name },
      };
    }
    checks.notDuplicate = true;

    // 9. Insert PRESENT attendance record
    const record: AttendanceRecord = {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sessionId,
      studentId: student.id,
      markedAt: new Date().toISOString(),
      status: 'PRESENT',
      verifiedVia: isTestToken ? 'TEST_TOKEN' : 'DYNAMIC_QR',
      subjectId: session.subjectId,
      classId: session.classId,
      divisionId: session.divisionId,
    };

    this.records = [record, ...this.records];
    saveStorage(STORAGE_KEYS.RECORDS, this.records);

    this.addAuditLog(
      'ATTENDANCE_MARKED',
      student.name,
      'student',
      `Marked PRESENT for ${subject?.code} (Session: ${sessionId.slice(0, 12)}) via ${record.verifiedVia}`,
      'SUCCESS'
    );

    return {
      success: true,
      code: 200,
      message: `Success! Attendance marked PRESENT for ${subject?.code} - ${subject?.name}.`,
      record,
      checks,
      details: {
        tokenAgeSeconds: cryptoResult.ageSeconds,
        studentName: student.name,
        rollNo: student.rollNo,
        subjectName: subject?.name,
      },
    };
  }

  // Student Attendance History & Percentages (Section 6)
  public getStudentAttendanceHistory(studentId: string): Array<
    AttendanceRecord & {
      subjectCode: string;
      subjectName: string;
      facultyName: string;
      sessionDate: string;
    }
  > {
    const studentRecords = this.records.filter(r => r.studentId === studentId);

    return studentRecords.map(r => {
      const session = this.getSessionById(r.sessionId);
      const subject = session ? this.getSubjectById(session.subjectId) : undefined;
      const faculty = session ? this.getFacultyById(session.facultyId) : undefined;

      return {
        ...r,
        subjectCode: subject?.code || 'N/A',
        subjectName: subject?.name || 'Academic Lecture',
        facultyName: faculty?.name || 'Faculty Member',
        sessionDate: session?.startTime || r.markedAt,
      };
    });
  }

  public getStudentAttendanceStats(studentId: string): {
    totalConducted: number;
    totalPresent: number;
    percentage: number;
    subjectBreakdown: Array<{
      subject: Subject;
      conducted: number;
      present: number;
      percentage: number;
    }>;
  } {
    const student = this.getStudentById(studentId);
    if (!student) {
      return { totalConducted: 0, totalPresent: 0, percentage: 100, subjectBreakdown: [] };
    }

    // Sessions relevant to this student's class and division
    const relevantSessions = this.sessions.filter(
      s => s.classId === student.classId && s.divisionId === student.divisionId
    );

    const studentEnrolledSubjectIds = this.studentSubjects
      .filter(ss => ss.studentId === student.id)
      .map(ss => ss.subjectId);

    const enrolledSessions = relevantSessions.filter(s =>
      studentEnrolledSubjectIds.includes(s.subjectId)
    );

    const totalConducted = enrolledSessions.length;
    const studentRecords = this.records.filter(r => r.studentId === studentId);
    const totalPresent = studentRecords.length;
    const percentage = totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) : 100;

    const subjectBreakdown = studentEnrolledSubjectIds.map(subId => {
      const sub = this.getSubjectById(subId)!;
      const subSessions = enrolledSessions.filter(s => s.subjectId === subId);
      const subPresent = studentRecords.filter(r => {
        const sess = this.getSessionById(r.sessionId);
        return sess?.subjectId === subId;
      }).length;
      const subPct = subSessions.length > 0 ? Math.round((subPresent / subSessions.length) * 100) : 100;

      return {
        subject: sub,
        conducted: subSessions.length,
        present: subPresent,
        percentage: subPct,
      };
    });

    return { totalConducted, totalPresent, percentage, subjectBreakdown };
  }

  // Admin & Analytics
  public getOverallAnalytics() {
    const totalSessions = this.sessions.length;
    const activeSessions = this.sessions.filter(s => s.status === 'ACTIVE').length;
    const totalRecords = this.records.length;
    const totalStudents = this.students.length;
    const totalFaculty = this.faculty.length;

    // Calculate defaulters (< 75%)
    const defaulters: Array<{
      student: Student;
      conducted: number;
      present: number;
      percentage: number;
    }> = [];

    this.students.forEach(student => {
      const stats = this.getStudentAttendanceStats(student.id);
      if (stats.totalConducted > 0 && stats.percentage < 75) {
        defaulters.push({
          student,
          conducted: stats.totalConducted,
          present: stats.totalPresent,
          percentage: stats.percentage,
        });
      }
    });

    return {
      totalSessions,
      activeSessions,
      totalRecords,
      totalStudents,
      totalFaculty,
      defaultersCount: defaulters.length,
      defaulters,
    };
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(
    action: string,
    actor: string,
    role: 'faculty' | 'student' | 'admin',
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'REJECTED'
  ): void {
    const log: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      action,
      actor,
      role,
      details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      status,
    };

    this.auditLogs = [log, ...this.auditLogs.slice(0, 99)];
    saveStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // Export CSV
  public exportAttendanceCSV(): string {
    const headers = [
      'Record ID',
      'Session ID',
      'Student Roll No',
      'Student Name',
      'Class',
      'Division',
      'Subject Code',
      'Subject Name',
      'Faculty',
      'Marked At',
      'Verification Method',
      'Status',
    ];

    const rows = this.records.map(r => {
      const session = this.getSessionById(r.sessionId);
      const student = this.getStudentById(r.studentId);
      const subject = session ? this.getSubjectById(session.subjectId) : undefined;
      const faculty = session ? this.getFacultyById(session.facultyId) : undefined;
      const classRoom = session ? this.getClassById(session.classId) : undefined;
      const division = session ? this.getDivisionById(session.divisionId) : undefined;

      return [
        `"${r.id}"`,
        `"${r.sessionId}"`,
        `"${student?.rollNo || 'N/A'}"`,
        `"${student?.name || 'N/A'}"`,
        `"${classRoom?.name || 'N/A'}"`,
        `"${division?.name || 'N/A'}"`,
        `"${subject?.code || 'N/A'}"`,
        `"${subject?.name || 'N/A'}"`,
        `"${faculty?.name || 'N/A'}"`,
        `"${new Date(r.markedAt).toLocaleString()}"`,
        `"${r.verifiedVia}"`,
        `"${r.status}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // Student Management & Excel Import
  public getStudentsByClassAndDivision(classId: string, divisionId: string): Student[] {
    return this.students.filter(
      s => s.classId === classId && (divisionId ? s.divisionId === divisionId : true)
    );
  }

  public importStudents(
    classId: string,
    divisionId: string,
    studentsData: Array<{ rollNo: string; enrollmentNo: string; name: string; email: string }>
  ): { importedCount: number; updatedCount: number } {
    let importedCount = 0;
    let updatedCount = 0;

    const subjects = this.getSubjects();
    const currentYear = this.academicYears[0]?.id || 'ay-2026';

    studentsData.forEach(item => {
      const rollNo = item.rollNo.trim();
      const enrollmentNo = item.enrollmentNo.trim() || `ENR-${rollNo}`;
      const name = item.name.trim();
      const email = item.email.trim() || `${rollNo.toLowerCase()}@student.college.edu`;

      if (!rollNo || !name) return;

      // Check if student already exists by rollNo or enrollmentNo
      const existingStudentIndex = this.students.findIndex(
        s => s.rollNo.toLowerCase() === rollNo.toLowerCase() || s.enrollmentNo.toLowerCase() === enrollmentNo.toLowerCase()
      );

      let studentId: string;

      if (existingStudentIndex >= 0) {
        // Update existing student
        const existingStudent = this.students[existingStudentIndex];
        studentId = existingStudent.id;
        this.students[existingStudentIndex] = {
          ...existingStudent,
          name,
          rollNo,
          enrollmentNo,
          classId,
          divisionId,
        };

        // Update user account
        const userIndex = this.users.findIndex(u => u.id === existingStudent.userId);
        if (userIndex >= 0) {
          this.users[userIndex] = {
            ...this.users[userIndex],
            name,
            email,
          };
        }
        updatedCount++;
      } else {
        // Create new user account
        const newUserId = 'user-stud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
        const username = email.split('@')[0] || rollNo.toLowerCase();

        const newUser: User = {
          id: newUserId,
          username,
          role: 'student',
          name,
          email,
          isActive: true,
        };
        this.users.push(newUser);

        // Create student record
        studentId = 'stud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
        const newStudent: Student = {
          id: studentId,
          userId: newUserId,
          rollNo,
          enrollmentNo,
          name,
          classId,
          divisionId,
          status: 'active',
        };
        this.students.push(newStudent);
        importedCount++;
      }

      // Automatically enroll student into all subjects of the class
      subjects.forEach(subj => {
        const isAlreadyEnrolled = this.studentSubjects.some(
          ss => ss.studentId === studentId && ss.subjectId === subj.id
        );
        if (!isAlreadyEnrolled) {
          this.studentSubjects.push({
            id: 'ss-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            studentId,
            subjectId: subj.id,
            academicYearId: currentYear,
          });
        }
      });
    });

    // Save changes
    this.students = [...this.students];
    this.users = [...this.users];
    this.studentSubjects = [...this.studentSubjects];
    saveStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveStorage(STORAGE_KEYS.USERS, this.users);
    saveStorage(STORAGE_KEYS.STUDENT_SUBJECTS, this.studentSubjects);

    const classRoom = this.getClassById(classId);
    const division = this.getDivisionById(divisionId);
    this.addAuditLog(
      'STUDENTS_IMPORTED',
      'System Admin',
      'admin',
      `Imported ${importedCount} and updated ${updatedCount} students in ${classRoom?.name} - ${division?.name}`,
      'SUCCESS'
    );

    return { importedCount, updatedCount };
  }

  public deleteStudent(studentId: string): void {
    const student = this.getStudentById(studentId);
    if (!student) return;

    this.students = this.students.filter(s => s.id !== studentId);
    this.users = this.users.filter(u => u.id !== student.userId);
    this.studentSubjects = this.studentSubjects.filter(ss => ss.studentId !== studentId);

    saveStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveStorage(STORAGE_KEYS.USERS, this.users);
    saveStorage(STORAGE_KEYS.STUDENT_SUBJECTS, this.studentSubjects);

    this.addAuditLog(
      'STUDENT_DELETED',
      'System Admin',
      'admin',
      `Removed student ${student.name} (${student.rollNo})`,
      'WARNING'
    );
  }

  // Teacher & Subject Management
  public getSubjectsByFaculty(facultyId: string): Subject[] {
    return this.subjects.filter(s => s.facultyId === facultyId);
  }

  public addOrUpdateTeacher(teacherData: {
    id?: string;
    name: string;
    email: string;
    employeeCode: string;
    departmentId: string;
    designation?: string;
    subjectIds: string[];
  }): Faculty {
    const name = teacherData.name.trim();
    const email = teacherData.email.trim();
    const employeeCode = teacherData.employeeCode.trim();
    const departmentId = teacherData.departmentId;

    let facultyResult: Faculty;

    if (teacherData.id) {
      // Update existing
      const facIndex = this.faculty.findIndex(f => f.id === teacherData.id);
      if (facIndex >= 0) {
        const existingFac = this.faculty[facIndex];
        const updatedFac: Faculty = {
          ...existingFac,
          name,
          employeeCode,
          departmentId,
          designation: teacherData.designation || existingFac.designation || 'Assistant Professor',
        };
        this.faculty[facIndex] = updatedFac;
        facultyResult = updatedFac;

        // Update user
        const userIndex = this.users.findIndex(u => u.id === existingFac.userId);
        if (userIndex >= 0) {
          this.users[userIndex] = {
            ...this.users[userIndex],
            name,
            email,
          };
        }
      } else {
        throw new Error('Faculty record not found');
      }
    } else {
      // Create new Teacher / Faculty
      const newUserId = 'user-fac-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const username = email.split('@')[0] || employeeCode.toLowerCase();

      const newUser: User = {
        id: newUserId,
        username,
        role: 'faculty',
        name,
        email,
        isActive: true,
      };
      this.users.push(newUser);

      const newFacultyId = 'fac-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newFaculty: Faculty = {
        id: newFacultyId,
        userId: newUserId,
        name,
        employeeCode,
        departmentId,
        designation: teacherData.designation || 'Assistant Professor',
      };
      this.faculty.push(newFaculty);
      facultyResult = newFaculty;
    }

    // Update subject assignments: assign selected subjectIds to this faculty
    this.subjects = this.subjects.map(subj => {
      if (teacherData.subjectIds.includes(subj.id)) {
        return { ...subj, facultyId: facultyResult.id };
      } else if (subj.facultyId === facultyResult.id) {
        // If it was assigned to this faculty before but is no longer in subjectIds, unassign or leave
        return { ...subj, facultyId: '' };
      }
      return subj;
    });

    this.faculty = [...this.faculty];
    this.users = [...this.users];
    this.subjects = [...this.subjects];

    saveStorage(STORAGE_KEYS.FACULTY, this.faculty);
    saveStorage(STORAGE_KEYS.USERS, this.users);
    saveStorage(STORAGE_KEYS.SUBJECTS, this.subjects);

    this.addAuditLog(
      teacherData.id ? 'TEACHER_UPDATED' : 'TEACHER_CREATED',
      'System Admin',
      'admin',
      `${teacherData.id ? 'Updated' : 'Added'} teacher ${name} (${employeeCode}) with ${teacherData.subjectIds.length} subject(s)`,
      'SUCCESS'
    );

    return facultyResult;
  }

  public deleteTeacher(facultyId: string): void {
    const fac = this.getFacultyById(facultyId);
    if (!fac) return;

    this.faculty = this.faculty.filter(f => f.id !== facultyId);
    this.users = this.users.filter(u => u.id !== fac.userId);

    // Unassign subjects
    this.subjects = this.subjects.map(s => {
      if (s.facultyId === facultyId) {
        return { ...s, facultyId: '' };
      }
      return s;
    });

    saveStorage(STORAGE_KEYS.FACULTY, this.faculty);
    saveStorage(STORAGE_KEYS.USERS, this.users);
    saveStorage(STORAGE_KEYS.SUBJECTS, this.subjects);

    this.addAuditLog(
      'TEACHER_DELETED',
      'System Admin',
      'admin',
      `Removed teacher ${fac.name} (${fac.employeeCode})`,
      'WARNING'
    );
  }

  public assignTeacherToSubject(facultyId: string, subjectId: string): void {
    const subIndex = this.subjects.findIndex(s => s.id === subjectId);
    if (subIndex >= 0) {
      this.subjects[subIndex] = {
        ...this.subjects[subIndex],
        facultyId,
      };
      this.subjects = [...this.subjects];
      saveStorage(STORAGE_KEYS.SUBJECTS, this.subjects);
    }
  }
}

export const storage = new StorageManager();

