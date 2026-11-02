import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axiosClient';
import AdminSidebar from './AdminSidebar';
import {
  AddDeptModal,
  AddTeacherModal,
  AddStudentModal,
  AddSubjectModal,
  AssignFacultyModal,
  InitExamModal
} from './AdminModals';
import { 
  RotateCw, 
  Plus, 
  Trash2, 
  UserCheck, 
  Building2, 
  Users, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminView({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [lookups, setLookups] = useState({ departments: [], teachers: [], students: [], subjects: [] });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Modals & Selected Objects
  const [modalType, setModalType] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // Exam Management State
  const [targetDept, setTargetDept] = useState('');
  const [targetSem, setTargetSem] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLookups = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/lookups');
      setLookups(res.data);
      if (res.data.departments?.length > 0 && !targetDept) {
        setTargetDept(String(res.data.departments[0].id));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to sync database data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const handleDelete = async (endpoint, id, label) => {
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;
    try {
      await API.delete(`/admin/${endpoint}/${id}`);
      showToast(`${label} deleted successfully`);
      fetchLookups();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to delete ${label}`, 'error');
    }
  };

  const handleInitExam = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/exam/initialize', {
        department_id: parseInt(targetDept, 10),
        semester: parseInt(targetSem, 10)
      });
      showToast(res.data.message);
      setModalType(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Initialization failed', 'error');
    }
  };

  const handlePublishCohort = async () => {
    if (!targetDept) return showToast('Please select a department', 'error');
    setPublishing(true);
    setPublishStatus(null);
    try {
      const res = await API.post('/admin/exam/publish', {
        department_id: parseInt(targetDept, 10),
        semester: parseInt(targetSem, 10)
      });
      setPublishStatus({ success: true, message: res.data.message });
      showToast(res.data.message || 'Results published successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Prerequisites not met';
      setPublishStatus({
        success: false,
        message: errorMsg,
        pending: err.response?.data?.pendingEntries || []
      });
      showToast(errorMsg, 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Filtered queries
  const filteredDepartments = useMemo(() => {
    return (lookups.departments || []).filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lookups.departments, searchQuery]);

  const filteredTeachers = useMemo(() => {
    return (lookups.teachers || []).filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.empid.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDeptFilter === 'ALL' || String(t.department_id) === String(selectedDeptFilter);
      return matchesSearch && matchesDept;
    });
  }, [lookups.teachers, searchQuery, selectedDeptFilter]);

  const filteredStudents = useMemo(() => {
    return (lookups.students || []).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDeptFilter === 'ALL' || String(s.department_id) === String(selectedDeptFilter);
      const matchesSem = selectedSemFilter === 'ALL' || Number(s.curr_sem) === Number(selectedSemFilter);
      return matchesSearch && matchesDept && matchesSem;
    });
  }, [lookups.students, searchQuery, selectedDeptFilter, selectedSemFilter]);

  const filteredSubjects = useMemo(() => {
    return (lookups.subjects || []).filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sub.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDeptFilter === 'ALL' || String(sub.department_id) === String(selectedDeptFilter);
      const matchesSem = selectedSemFilter === 'ALL' || Number(sub.semester) === Number(selectedSemFilter);
      return matchesSearch && matchesDept && matchesSem;
    });
  }, [lookups.subjects, searchQuery, selectedDeptFilter, selectedSemFilter]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased overflow-hidden">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar with Navigation & Logout */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => { setActiveTab(tab); setSearchQuery(''); }}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Admin</span>
            <span>›</span>
            <span className="text-slate-800 capitalize font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide">
              ADMIN MODE
            </span>
            <button
              onClick={fetchLookups}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
                <p className="text-xs text-slate-500 mt-1">Real-time stats across academic departments and cohorts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'DEPARTMENTS', count: lookups.departments.length, sub: 'Active Faculties', icon: Building2 },
                  { label: 'FACULTY MEMBERS', count: lookups.teachers.length, sub: 'Instructors Onboarded', icon: UserCheck },
                  { label: 'STUDENTS', count: lookups.students.length, sub: 'Enrolled Scholars', icon: Users },
                  { label: 'SUBJECTS', count: lookups.subjects.length, sub: 'Mapped Courses', icon: BookOpen },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{s.label}</span>
                        <Icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 mt-2">{s.count}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">{s.sub}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Exam Controller</h3>
                      <p className="text-xs text-slate-500">Configure examination cohorts and broadcast student marks</p>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button 
                      onClick={() => setActiveTab('exams')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      Open Exam Control
                    </button>
                    <button 
                      onClick={() => setModalType('initExam')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Fast Initialize
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Direct Insertion</h3>
                      <p className="text-xs text-slate-500">Quick-create new departments, teachers, and subjects</p>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button onClick={() => setModalType('dept')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">+ Dept</button>
                    <button onClick={() => setModalType('teacher')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">+ Faculty</button>
                    <button onClick={() => setModalType('student')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">+ Student</button>
                    <button onClick={() => setModalType('subject')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">+ Subject</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Departments</h2>
                  <p className="text-xs text-slate-500">Manage all faculties and academic branches.</p>
                </div>
                <button
                  onClick={() => setModalType('dept')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" /> Add Department
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Department Name</th>
                      <th className="py-3.5 px-6 text-center">Enrolled Students</th>
                      <th className="py-3.5 px-6 text-center">Faculty Members</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDepartments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6 font-mono text-slate-400">#{d.id}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{d.name}</td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-full font-medium text-slate-600">
                            {d.student_count || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {d.faculty_count || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDelete('department', d.id, 'Department')}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDepartments.length === 0 && (
                      <tr><td colSpan="5" className="py-8 text-center text-slate-400">No departments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Faculty Directory</h2>
                  <p className="text-xs text-slate-500">Teachers and department heads.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search name, email, EMP ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setModalType('teacher')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Faculty
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">EMP ID</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Contact Email</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{t.name}</td>
                        <td className="py-3.5 px-6 font-mono text-slate-500">{t.empid}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-600 font-medium">
                            {t.department_name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">{t.email}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDelete('teacher', t.id, 'Faculty')}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete Faculty"
                          >
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <tr><td colSpan="5" className="py-8 text-center text-slate-400">No faculty members found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: STUDENTS */}
          {activeTab === 'students' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Enrolled Students</h2>
                  <p className="text-xs text-slate-500">Maintain candidate profiles and cohort assignments.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={selectedSemFilter}
                    onChange={(e) => setSelectedSemFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Semesters</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                  <button
                    onClick={() => setModalType('student')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" /> Add Student
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">Email Address</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6 text-center">Semester</th>
                      <th className="py-3.5 px-6 text-center">Year</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-3.5 px-6 text-slate-600">{s.email}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-600 font-medium">
                            {s.department_name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                            Sem {s.curr_sem}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center text-slate-600 font-medium">Year {s.year}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDelete('student', s.id, 'Student')}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-400">No students found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Curriculum Subjects</h2>
                  <p className="text-xs text-slate-500">Subjects and assigned instructors.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search subject or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={selectedSemFilter}
                    onChange={(e) => setSelectedSemFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Semesters</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                  <button
                    onClick={() => setModalType('subject')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" /> Add Subject
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Subject Name</th>
                      <th className="py-3.5 px-6">Code</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6 text-center">Semester</th>
                      <th className="py-3.5 px-6">Assigned Faculty</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{sub.name}</td>
                        <td className="py-3.5 px-6 font-mono text-blue-600 font-medium">{sub.code}</td>
                        <td className="py-3.5 px-6 text-slate-600">{sub.department_name}</td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                            Sem {sub.semester}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          {sub.faculty_name ? (
                            <span className="font-medium text-slate-800">{sub.faculty_name}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-medium text-[11px]">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-2">
                          <button
                            onClick={() => { setActiveItem(sub); setModalType('assignFaculty'); }}
                            className="text-blue-600 hover:text-blue-800 font-semibold transition"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => handleDelete('subject', sub.id, 'Subject')}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition inline-block align-middle"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSubjects.length === 0 && (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-400">No subjects found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: EXAMS */}
          {activeTab === 'exams' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Exam Lifecycle & Cohort Publisher</h2>
                <p className="text-xs text-slate-500">Initialize exams to generate mark rosters for teachers, then publish results once marks are submitted.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Department
                    </label>
                    <select
                      value={targetDept}
                      onChange={(e) => setTargetDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {lookups.departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Semester
                    </label>
                    <div className="flex items-center gap-2">
                      {SEMESTERS.slice(0, 6).map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => setTargetSem(sem)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                            targetSem === sem
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sem}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={handleInitExam}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-slate-500" />
                    Initialize Examination
                  </button>

                  <button
                    onClick={handlePublishCohort}
                    disabled={publishing}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    {publishing ? 'Validating Marks...' : 'Publish Cohort Results'}
                  </button>
                </div>
              </div>

              {publishStatus && (
                <div className={`p-5 rounded-2xl border text-xs space-y-3 ${
                  publishStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-bold text-sm flex items-center gap-2">
                    {publishStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{publishStatus.message}</span>
                  </div>

                  {publishStatus.pending && publishStatus.pending.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-rose-200">
                      <div className="font-semibold text-rose-900">
                        Pending Faculty Submissions ({publishStatus.pending.length}):
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {publishStatus.pending.map((item, idx) => (
                          <div key={idx} className="bg-white/80 p-2.5 rounded-lg border border-rose-200 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">{item.student_name}</span>
                              <span className="text-slate-500 font-mono ml-2">({item.subject_name})</span>
                            </div>
                            <span className="text-rose-600 font-medium">
                              Faculty: {item.faculty_name || 'Unassigned'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Popups and Modals */}
      {modalType === 'dept' && (
        <AddDeptModal onClose={() => setModalType(null)} onSuccess={() => { fetchLookups(); showToast('Department Created'); }} />
      )}
      {modalType === 'teacher' && (
        <AddTeacherModal departments={lookups.departments} onClose={() => setModalType(null)} onSuccess={() => { fetchLookups(); showToast('Faculty Created'); }} />
      )}
      {modalType === 'student' && (
        <AddStudentModal departments={lookups.departments} onClose={() => setModalType(null)} onSuccess={() => { fetchLookups(); showToast('Student Created'); }} />
      )}
      {modalType === 'subject' && (
        <AddSubjectModal departments={lookups.departments} teachers={lookups.teachers} onClose={() => setModalType(null)} onSuccess={() => { fetchLookups(); showToast('Subject Created'); }} />
      )}
      {modalType === 'assignFaculty' && (
        <AssignFacultyModal subject={activeItem} teachers={lookups.teachers} onClose={() => setModalType(null)} onSuccess={() => { fetchLookups(); showToast('Faculty Assigned'); }} />
      )}
      {modalType === 'initExam' && (
        <InitExamModal departments={lookups.departments} onClose={() => setModalType(null)} onSuccess={() => { fetchLookups(); showToast('Exam Initialized'); }} />
      )}

    </div>
  );
}