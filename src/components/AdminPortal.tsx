import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Search,
  Check,
  RefreshCw,
  Sparkles,
  BarChart3,
  ShieldCheck,
  X,
} from 'lucide-react';
import { storage } from '../services/storageService';
import { User, Student, Faculty, Subject } from '../types';

interface AdminPortalProps {
  currentUser: User;
}

interface ParsedStudentRow {
  rollNo: string;
  enrollmentNo: string;
  name: string;
  email: string;
  status: 'valid' | 'invalid';
  note?: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'student-import' | 'teachers-subjects' | 'analytics' | 'audit-logs'
  >('student-import');

  const [dataVersion, setDataVersion] = useState<number>(0);

  // Class & Division Selection for Student Import
  const classes = storage.getClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const divisions = storage.getDivisions(selectedClassId);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(divisions[0]?.id || '');

  // Keep division updated if class changes
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const divs = storage.getDivisions(classId);
    if (divs.length > 0) {
      setSelectedDivisionId(divs[0].id);
    } else {
      setSelectedDivisionId('');
    }
  };

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Existing Students Search
  const [studentSearch, setStudentSearch] = useState<string>('');
  const classStudents = storage.getStudentsByClassAndDivision(selectedClassId, selectedDivisionId);
  const filteredStudents = classStudents.filter(
    s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Teachers & Subjects Form State
  const departments = storage.getDepartments();
  const subjects = storage.getSubjects();
  const facultyList = storage.getAllFaculty();

  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id || '');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [teacherFormMsg, setTeacherFormMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Analytics
  const analytics = storage.getOverallAnalytics();
  const auditLogs = storage.getAuditLogs();

  // -------------------------------------------------------------
  // Excel File Parsing Handler
  // -------------------------------------------------------------
  const processExcelBuffer = (buffer: ArrayBuffer, name: string) => {
    try {
      setIsProcessingFile(true);
      setImportStatus(null);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawData || rawData.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'The selected Excel file appears to be empty or has no readable rows.',
        });
        setParsedRows([]);
        return;
      }

      // Map rows with fuzzy header detection
      const parsed: ParsedStudentRow[] = rawData.map((row: any, idx: number) => {
        // Look for common column name variants
        const rollNo = String(
          row['Roll No'] ||
            row['Roll Number'] ||
            row['RollNo'] ||
            row['Roll'] ||
            row['roll_no'] ||
            row['roll'] ||
            ''
        ).trim();

        const enrollmentNo = String(
          row['Enrollment No'] ||
            row['Enrollment Number'] ||
            row['Enrollment'] ||
            row['PRN'] ||
            row['enrollment_no'] ||
            `ENR-${rollNo || idx + 1}`
        ).trim();

        const name = String(
          row['Student Name'] ||
            row['Name'] ||
            row['Full Name'] ||
            row['Student'] ||
            row['student_name'] ||
            ''
        ).trim();

        const email = String(
          row['Email'] ||
            row['Email ID'] ||
            row['Email Address'] ||
            row['email'] ||
            (rollNo ? `${rollNo.toLowerCase()}@student.college.edu` : '')
        ).trim();

        const isValid = Boolean(rollNo && name);

        return {
          rollNo,
          enrollmentNo,
          name,
          email,
          status: isValid ? 'valid' : 'invalid',
          note: !rollNo ? 'Missing Roll Number' : !name ? 'Missing Student Name' : undefined,
        };
      });

      setFileName(name);
      setParsedRows(parsed);
      const validCount = parsed.filter(r => r.status === 'valid').length;
      setImportStatus({
        type: 'info',
        message: `Parsed ${parsed.length} rows from "${name}". ${validCount} valid records ready to import into selected class.`,
      });
    } catch (err) {
      console.error(err);
      setImportStatus({
        type: 'error',
        message: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv document.',
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        processExcelBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        'Roll No': '24DS031',
        'Enrollment No': 'ENR-24DS031',
        'Student Name': 'Rohan Kulkarni',
        'Email': 'rohan.k@student.college.edu',
      },
      {
        'Roll No': '24DS032',
        'Enrollment No': 'ENR-24DS032',
        'Student Name': 'Ananya Sengupta',
        'Email': 'ananya.s@student.college.edu',
      },
      {
        'Roll No': '24DS033',
        'Enrollment No': 'ENR-24DS033',
        'Student Name': 'Vikramaditya Roy',
        'Email': 'vikram.r@student.college.edu',
      },
      {
        'Roll No': '24DS034',
        'Enrollment No': 'ENR-24DS034',
        'Student Name': 'Pooja Bhatt',
        'Email': 'pooja.b@student.college.edu',
      },
      {
        'Roll No': '24DS035',
        'Enrollment No': 'ENR-24DS035',
        'Student Name': 'Siddharth Nair',
        'Email': 'siddharth.n@student.college.edu',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Template');
    XLSX.writeFile(workbook, 'student_roster_template.xlsx');
  };

  // Load Demo Excel Batch
  const handleLoadSampleBatch = () => {
    const demoBatch: ParsedStudentRow[] = [
      {
        rollNo: '24DS041',
        enrollmentNo: 'ENR-24DS041',
        name: 'Tanvi Joshi',
        email: 'tanvi.j@student.college.edu',
        status: 'valid',
      },
      {
        rollNo: '24DS042',
        enrollmentNo: 'ENR-24DS042',
        name: 'Arjun Singhania',
        email: 'arjun.s@student.college.edu',
        status: 'valid',
      },
      {
        rollNo: '24DS043',
        enrollmentNo: 'ENR-24DS043',
        name: 'Meera Nambiar',
        email: 'meera.n@student.college.edu',
        status: 'valid',
      },
      {
        rollNo: '24DS044',
        enrollmentNo: 'ENR-24DS044',
        name: 'Kunal Deshpande',
        email: 'kunal.d@student.college.edu',
        status: 'valid',
      },
      {
        rollNo: '24DS045',
        enrollmentNo: 'ENR-24DS045',
        name: 'Isha Varma',
        email: 'isha.v@student.college.edu',
        status: 'valid',
      },
    ];
    setFileName('Demo_Student_Batch_2026.xlsx');
    setParsedRows(demoBatch);
    setImportStatus({
      type: 'info',
      message: 'Sample demo batch loaded with 5 students. Review and click "Confirm & Import Students".',
    });
  };

  // Commit Import to Storage
  const handleCommitImport = () => {
    const validRows = parsedRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No valid rows found to import. Please check Roll No and Student Name.',
      });
      return;
    }

    const result = storage.importStudents(selectedClassId, selectedDivisionId, validRows);
    const targetClass = storage.getClassById(selectedClassId);
    const targetDiv = storage.getDivisionById(selectedDivisionId);

    setImportStatus({
      type: 'success',
      message: `Successfully imported ${result.importedCount} new students and updated ${result.updatedCount} existing records into ${targetClass?.name} - ${targetDiv?.name}!`,
    });

    setParsedRows([]);
    setFileName('');
    setDataVersion(prev => prev + 1);
  };

  // Delete Student
  const handleDeleteStudent = (student: Student) => {
    if (window.confirm(`Are you sure you want to remove ${student.name} (${student.rollNo})?`)) {
      storage.deleteStudent(student.id);
      setDataVersion(prev => prev + 1);
    }
  };

  // -------------------------------------------------------------
  // Teacher & Subject Form Handlers
  // -------------------------------------------------------------
  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleEditTeacher = (fac: Faculty) => {
    const user = storage.getAllUsers().find(u => u.id === fac.userId);
    setEditingFacultyId(fac.id);
    setTeacherName(fac.name);
    setEmployeeCode(fac.employeeCode);
    setTeacherEmail(user?.email || '');
    setDepartmentId(fac.departmentId);

    const assigned = storage.getSubjectsByFaculty(fac.id).map(s => s.id);
    setSelectedSubjectIds(assigned);
    setTeacherFormMsg(null);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleCancelTeacherEdit = () => {
    setEditingFacultyId(null);
    setTeacherName('');
    setTeacherEmail('');
    setEmployeeCode('');
    setDepartmentId(departments[0]?.id || '');
    setSelectedSubjectIds([]);
    setTeacherFormMsg(null);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherFormMsg(null);

    if (!teacherName.trim() || !teacherEmail.trim() || !employeeCode.trim()) {
      setTeacherFormMsg({
        type: 'error',
        text: 'Please provide Teacher Name, Email, and Employee Code.',
      });
      return;
    }

    try {
      storage.addOrUpdateTeacher({
        id: editingFacultyId || undefined,
        name: teacherName.trim(),
        email: teacherEmail.trim(),
        employeeCode: employeeCode.trim(),
        departmentId,
        subjectIds: selectedSubjectIds,
      });

      setTeacherFormMsg({
        type: 'success',
        text: editingFacultyId
          ? `Updated teacher details and assigned ${selectedSubjectIds.length} subject(s).`
          : `Teacher ${teacherName} added and assigned to ${selectedSubjectIds.length} subject(s)!`,
      });

      handleCancelTeacherEdit();
      setDataVersion(prev => prev + 1);
    } catch (err: any) {
      setTeacherFormMsg({
        type: 'error',
        text: err?.message || 'Error saving teacher details.',
      });
    }
  };

  const handleDeleteTeacher = (fac: Faculty) => {
    if (
      window.confirm(
        `Are you sure you want to remove teacher ${fac.name}? Their assigned subjects will become unassigned.`
      )
    ) {
      storage.deleteTeacher(fac.id);
      setDataVersion(prev => prev + 1);
    }
  };

  // Export Attendance CSV
  const handleExportCSV = () => {
    const csvContent = storage.exportAttendanceCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              Institutional Admin
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-mono">Academic Year 2026–27</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            College Academic Management Portal
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Import students from Excel sheets as per class, and configure teachers and their assigned subjects.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-all-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Attendance CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70 text-xs font-semibold overflow-x-auto">
        <button
          id="tab-import-students"
          onClick={() => setActiveTab('student-import')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'student-import'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Import Students (Excel/CSV)</span>
        </button>

        <button
          id="tab-teachers-subjects"
          onClick={() => setActiveTab('teachers-subjects')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'teachers-subjects'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Teachers & Subjects</span>
        </button>

        <button
          id="tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'analytics'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Attendance Analytics</span>
        </button>

        <button
          id="tab-audit-logs"
          onClick={() => setActiveTab('audit-logs')}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'audit-logs'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: IMPORT STUDENTS FROM EXCEL AS PER CLASS            */}
      {/* ========================================================= */}
      {activeTab === 'student-import' && (
        <div className="space-y-6">
          {/* Class & Division Selection Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Step 1: Select Target Class & Division</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose which academic class and division will receive the imported student records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {classStudents.length} Students Currently Enrolled
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Class
                </label>
                <select
                  id="select-import-class"
                  value={selectedClassId}
                  onChange={e => handleClassChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.academicYearId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Division / Section
                </label>
                <select
                  id="select-import-division"
                  value={selectedDivisionId}
                  onChange={e => setSelectedDivisionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Excel File Upload & Parser Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Step 2: Upload Excel (.xlsx) / CSV Sheet</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Required columns: <strong>Roll No</strong>, <strong>Student Name</strong>,{' '}
                  <strong>Enrollment No</strong>, <strong>Email</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  id="btn-download-sample-template"
                  onClick={handleDownloadSampleTemplate}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Template</span>
                </button>

                <button
                  type="button"
                  id="btn-load-sample-batch"
                  onClick={handleLoadSampleBatch}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample Batch (5 Students)</span>
                </button>
              </div>
            </div>

            {/* Drag and Drop / File Input Zone */}
            <div className="mt-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drop your Excel file here
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </p>
                </div>
                {fileName && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Loaded: {fileName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {importStatus && (
              <div
                className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : importStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                }`}
              >
                {importStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : importStatus.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Excel Preview ({parsedRows.length} Rows Detected)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setParsedRows([]);
                        setFileName('');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-import-students"
                      onClick={handleCommitImport}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Import {parsedRows.filter(r => r.status === 'valid').length} Students</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Enrollment No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {row.rollNo || <span className="text-rose-500 italic">Empty</span>}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{row.enrollmentNo}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {row.name || <span className="text-rose-500 italic">Empty</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{row.email}</td>
                          <td className="py-2.5 px-3 text-right">
                            {row.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                <AlertCircle className="w-3 h-3" /> {row.note || 'Invalid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Current Enrolled Class Students List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>
                    Current Enrolled Students in {storage.getClassById(selectedClassId)?.name} (
                    {storage.getDivisionById(selectedDivisionId)?.name})
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total {classStudents.length} student(s) currently registered in this division.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by roll or name..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No students found for this class and division.</p>
                <p className="mt-1 text-slate-500">
                  Upload an Excel sheet above or click &quot;Load Sample Batch&quot; to import students.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-y border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Enrollment No</th>
                      <th className="py-2.5 px-3">Login Email</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudents.map(student => {
                      const user = storage.getAllUsers().find(u => u.id === student.userId);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {student.rollNo}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {student.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {student.enrollmentNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            {user?.email || student.rollNo.toLowerCase() + '@student.college.edu'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(student)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                              title="Delete student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ENTER TEACHER DETAILS AS PER SUBJECT               */}
      {/* ========================================================= */}
      {activeTab === 'teachers-subjects' && (
        <div className="space-y-6">
          {/* Teacher Creation / Edit Form Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>
                    {editingFacultyId ? 'Edit Teacher & Subject Assignments' : 'Add New Teacher & Assign Subjects'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter teacher credentials and select the academic subjects taught by this faculty member.
                </p>
              </div>

              {editingFacultyId && (
                <button
                  type="button"
                  onClick={handleCancelTeacherEdit}
                  className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>

            {teacherFormMsg && (
              <div
                className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                  teacherFormMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {teacherFormMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{teacherFormMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Teacher Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teacher Full Name
                  </label>
                  <input
                    type="text"
                    required
                    id="input-teacher-name"
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teacher Email Address
                  </label>
                  <input
                    type="email"
                    required
                    id="input-teacher-email"
                    value={teacherEmail}
                    onChange={e => setTeacherEmail(e.target.value)}
                    placeholder="e.g. rajesh.k@engg.college.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    required
                    id="input-teacher-emp-code"
                    value={employeeCode}
                    onChange={e => setEmployeeCode(e.target.value)}
                    placeholder="e.g. FAC-DS-105"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Department
                </label>
                <select
                  id="select-teacher-department"
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full md:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Assignment Checkboxes */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Assign Subjects Taught by this Teacher:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {subjects.map(subj => {
                    const isSelected = selectedSubjectIds.includes(subj.id);
                    const currentFaculty = storage.getFacultyById(subj.facultyId);
                    return (
                      <div
                        key={subj.id}
                        onClick={() => handleToggleSubject(subj.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30'
                            : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-indigo-700">
                              {subj.code}
                            </span>
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {subj.subjectType}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-1">{subj.name}</p>
                          {currentFaculty && currentFaculty.id !== editingFacultyId && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Assigned to: {currentFaculty.name}
                            </p>
                          )}
                        </div>

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  id="btn-save-teacher"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingFacultyId
                      ? 'Update Teacher & Subject Assignments'
                      : 'Save Teacher & Assign Subjects'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Teacher Directory & Assigned Subjects Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Faculty Directory & Assigned Subjects</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overview of all registered teachers, their department, and active subject courses.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {facultyList.length} Teachers
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Teacher Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Assigned Subject(s)</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {facultyList.map(fac => {
                    const user = storage.getAllUsers().find(u => u.id === fac.userId);
                    const dept = storage.getDepartmentById(fac.departmentId);
                    const assignedSubs = storage.getSubjectsByFaculty(fac.id);

                    return (
                      <tr key={fac.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {fac.employeeCode}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{fac.name}</td>
                        <td className="py-3 px-3 text-slate-600">{dept?.name || 'Department'}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono">{user?.email}</td>
                        <td className="py-3 px-3">
                          {assignedSubs.length === 0 ? (
                            <span className="text-amber-600 italic text-[11px]">
                              No subjects assigned
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedSubs.map(s => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold"
                                >
                                  <span className="font-mono">{s.code}</span> - {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditTeacher(fac)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 transition rounded-lg hover:bg-indigo-50"
                              title="Edit teacher and subject assignments"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(fac)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                              title="Delete teacher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: INSTITUTIONAL ANALYTICS & DEFAULTERS               */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Students
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalStudents}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Across all divisions</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Faculty Teachers
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalFaculty}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Active teaching staff</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Conducted Sessions
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalSessions}</p>
              <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
                {analytics.activeSessions} active now
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Defaulters (&lt; 75%)
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{analytics.defaultersCount}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Require academic notice</span>
            </div>
          </div>

          {/* Defaulter Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Defaulter Students List (&lt; 75% Attendance)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identifies students failing the statutory 75% classroom attendance mandate.
                </p>
              </div>
            </div>

            {analytics.defaulters.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No attendance defaulters found.</p>
                <p className="text-slate-400 mt-0.5">All students are currently at or above 75% attendance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-y border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Class & Division</th>
                      <th className="py-2.5 px-3">Conducted</th>
                      <th className="py-2.5 px-3">Attended</th>
                      <th className="py-2.5 px-3 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {analytics.defaulters.map((d, i) => {
                      const cls = storage.getClassById(d.student.classId);
                      const div = storage.getDivisionById(d.student.divisionId);
                      return (
                        <tr key={i} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {d.student.rollNo}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {d.student.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {cls?.name} - {div?.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{d.conducted}</td>
                          <td className="py-2.5 px-3 font-mono">{d.present}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              {d.percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AUDIT TRAIL LOGS                                    */}
      {/* ========================================================= */}
      {activeTab === 'audit-logs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Institutional Audit Trail & Logs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographic immutable log of attendance operations, Excel imports, and teacher assignments.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {log.actor}{' '}
                      <span className="text-[10px] text-slate-400 font-mono">({log.role})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
