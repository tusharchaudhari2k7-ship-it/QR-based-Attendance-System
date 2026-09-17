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
} from '../types';

export const SEED_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay-2026-27', yearName: '2026-27', isCurrent: true },
  { id: 'ay-2025-26', yearName: '2025-26', isCurrent: false },
];

export const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-ds', name: 'Department of Data Science', code: 'DS' },
  { id: 'dept-ce', name: 'Department of Computer Engineering', code: 'CE' },
  { id: 'dept-it', name: 'Department of Information Technology', code: 'IT' },
];

export const SEED_CLASSES: ClassRoom[] = [
  {
    id: 'cls-sy-ds',
    name: 'Second Year B.Tech Data Science',
    programme: 'B.Tech',
    year: 2,
    semester: 3,
    academicYearId: 'ay-2026-27',
    departmentId: 'dept-ds',
  },
  {
    id: 'cls-ty-ds',
    name: 'Third Year B.Tech Data Science',
    programme: 'B.Tech',
    year: 3,
    semester: 5,
    academicYearId: 'ay-2026-27',
    departmentId: 'dept-ds',
  },
];

export const SEED_DIVISIONS: Division[] = [
  { id: 'div-sy-ds-a', name: 'Division A', classId: 'cls-sy-ds' },
  { id: 'div-sy-ds-b', name: 'Division B', classId: 'cls-sy-ds' },
  { id: 'div-ty-ds-a', name: 'Division A', classId: 'cls-ty-ds' },
];

export const SEED_USERS: User[] = [
  {
    id: 'user-fac-1',
    username: 'priya.sharma',
    role: 'faculty',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@engg.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-fac-2',
    username: 'rajesh.verma',
    role: 'faculty',
    name: 'Prof. Rajesh Verma',
    email: 'rajesh.verma@engg.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-stud-1',
    username: 'aarav.patel',
    role: 'student',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-stud-2',
    username: 'ananya.iyer',
    role: 'student',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@student.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-stud-3',
    username: 'rohan.kulkarni',
    role: 'student',
    name: 'Rohan Kulkarni',
    email: 'rohan.k@student.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-stud-4',
    username: 'kabir.mehta',
    role: 'student',
    name: 'Kabir Mehta (Div B)',
    email: 'kabir.mehta@student.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-stud-5',
    username: 'sneha.deshmukh',
    role: 'student',
    name: 'Sneha Deshmukh (Unenrolled DS301)',
    email: 'sneha.d@student.college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'user-admin-1',
    username: 'admin.dean',
    role: 'admin',
    name: 'Dr. Arvind Rao (Dean)',
    email: 'dean.academic@college.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

export const SEED_FACULTY: Faculty[] = [
  {
    id: 'fac-1',
    userId: 'user-fac-1',
    employeeCode: 'FAC-DS-101',
    name: 'Dr. Priya Sharma',
    departmentId: 'dept-ds',
    designation: 'Associate Professor & HOD',
  },
  {
    id: 'fac-2',
    userId: 'user-fac-2',
    employeeCode: 'FAC-DS-102',
    name: 'Prof. Rajesh Verma',
    departmentId: 'dept-ds',
    designation: 'Assistant Professor',
  },
];

export const SEED_STUDENTS: Student[] = [
  {
    id: 'stud-1',
    userId: 'user-stud-1',
    rollNo: 'DS-2024-001',
    enrollmentNo: 'ENR20240901',
    name: 'Aarav Patel',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
    status: 'active',
  },
  {
    id: 'stud-2',
    userId: 'user-stud-2',
    rollNo: 'DS-2024-002',
    enrollmentNo: 'ENR20240902',
    name: 'Ananya Iyer',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
    status: 'active',
  },
  {
    id: 'stud-3',
    userId: 'user-stud-3',
    rollNo: 'DS-2024-003',
    enrollmentNo: 'ENR20240903',
    name: 'Rohan Kulkarni',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
    status: 'active',
  },
  {
    id: 'stud-4',
    userId: 'user-stud-4',
    rollNo: 'DS-2024-055',
    enrollmentNo: 'ENR20240955',
    name: 'Kabir Mehta',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-b', // Notice Division B!
    status: 'active',
  },
  {
    id: 'stud-5',
    userId: 'user-stud-5',
    rollNo: 'DS-2024-070',
    enrollmentNo: 'ENR20240970',
    name: 'Sneha Deshmukh',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
    status: 'active',
  },
];

export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'sub-ds301',
    code: 'DS301',
    name: 'Machine Learning',
    subjectType: 'Theory',
    departmentId: 'dept-ds',
    facultyId: 'fac-1',
  },
  {
    id: 'sub-ds302',
    code: 'DS302',
    name: 'Big Data Analytics',
    subjectType: 'Theory',
    departmentId: 'dept-ds',
    facultyId: 'fac-2',
  },
  {
    id: 'sub-ds303',
    code: 'DS303',
    name: 'Deep Learning Laboratory',
    subjectType: 'Practical',
    departmentId: 'dept-ds',
    facultyId: 'fac-1',
  },
];

export const SEED_STUDENT_SUBJECTS: StudentSubject[] = [
  // stud-1 enrolled in DS301, DS302
  { id: 'ss-1', studentId: 'stud-1', subjectId: 'sub-ds301', academicYearId: 'ay-2026-27' },
  { id: 'ss-2', studentId: 'stud-1', subjectId: 'sub-ds302', academicYearId: 'ay-2026-27' },

  // stud-2 enrolled in DS301, DS302
  { id: 'ss-3', studentId: 'stud-2', subjectId: 'sub-ds301', academicYearId: 'ay-2026-27' },
  { id: 'ss-4', studentId: 'stud-2', subjectId: 'sub-ds302', academicYearId: 'ay-2026-27' },

  // stud-3 enrolled in DS301
  { id: 'ss-5', studentId: 'stud-3', subjectId: 'sub-ds301', academicYearId: 'ay-2026-27' },

  // stud-4 (Div B) enrolled in DS301
  { id: 'ss-6', studentId: 'stud-4', subjectId: 'sub-ds301', academicYearId: 'ay-2026-27' },

  // stud-5 enrolled ONLY in DS303 (NOT enrolled in DS301!)
  { id: 'ss-7', studentId: 'stud-5', subjectId: 'sub-ds303', academicYearId: 'ay-2026-27' },
];

export const INITIAL_SESSIONS: AttendanceSession[] = [
  {
    id: 'sess-prev-101',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
    subjectId: 'sub-ds301',
    facultyId: 'fac-1',
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    status: 'CLOSED',
  },
  {
    id: 'sess-prev-102',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
    subjectId: 'sub-ds301',
    facultyId: 'fac-1',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    status: 'CLOSED',
  },
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-1',
    sessionId: 'sess-prev-101',
    studentId: 'stud-1',
    markedAt: new Date(Date.now() - 86400000 * 2 + 120000).toISOString(),
    status: 'PRESENT',
    verifiedVia: 'DYNAMIC_QR',
    subjectId: 'sub-ds301',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
  },
  {
    id: 'att-2',
    sessionId: 'sess-prev-101',
    studentId: 'stud-2',
    markedAt: new Date(Date.now() - 86400000 * 2 + 180000).toISOString(),
    status: 'PRESENT',
    verifiedVia: 'DYNAMIC_QR',
    subjectId: 'sub-ds301',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
  },
  {
    id: 'att-3',
    sessionId: 'sess-prev-102',
    studentId: 'stud-1',
    markedAt: new Date(Date.now() - 86400000 + 100000).toISOString(),
    status: 'PRESENT',
    verifiedVia: 'DYNAMIC_QR',
    subjectId: 'sub-ds301',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
  },
  {
    id: 'att-4',
    sessionId: 'sess-prev-102',
    studentId: 'stud-3',
    markedAt: new Date(Date.now() - 86400000 + 140000).toISOString(),
    status: 'PRESENT',
    verifiedVia: 'DYNAMIC_QR',
    subjectId: 'sub-ds301',
    classId: 'cls-sy-ds',
    divisionId: 'div-sy-ds-a',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    action: 'SESSION_CREATED',
    actor: 'Dr. Priya Sharma',
    role: 'faculty',
    details: 'Started lecture session for DS301 (Machine Learning), Class SY B.Tech DS - Div A',
    ipAddress: '192.168.1.104',
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    action: 'SESSION_CLOSED',
    actor: 'Dr. Priya Sharma',
    role: 'faculty',
    details: 'Concluded lecture session sess-prev-101. Total present recorded: 2',
    ipAddress: '192.168.1.104',
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    action: 'SYSTEM_BOOT',
    actor: 'Dean Dr. Arvind Rao',
    role: 'admin',
    details: 'Dynamic QR Attendance Service operational. Cryptographic key pair validated.',
    ipAddress: '10.0.0.1',
    status: 'SUCCESS',
  },
];
