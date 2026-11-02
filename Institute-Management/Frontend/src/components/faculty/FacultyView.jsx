import { useEffect, useMemo, useState } from 'react';
import API from '../../api/axiosClient';
import FacultySidebar from './FacultySidebar';
import { 
  RotateCw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Users, 
  CheckCheck, 
  Clock, 
  MessageSquare, 
  Send 
} from 'lucide-react';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function FacultyView({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedSem, setSelectedSem] = useState(1);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [roster, setRoster] = useState([]);
  const [marksState, setMarksState] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [queries, setQueries] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [submittingMarks, setSubmittingMarks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [deptRes, subRes, qRes] = await Promise.all([
        API.get('/users/teacher/departments'),
        API.get('/users/teacher/subjects'),
        API.get('/users/teacher/queries')
      ]);

      setDepartments(deptRes.data);
      setSubjects(subRes.data);
      setQueries(qRes.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to sync faculty data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter subjects for the selected Department and Semester
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const matchesDept = selectedDeptId === 'ALL' || String(sub.dept_id) === String(selectedDeptId);
      const matchesSem = Number(sub.semester) === Number(selectedSem);
      return matchesDept && matchesSem;
    });
  }, [subjects, selectedDeptId, selectedSem]);

  // Keep active subject synchronized
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      const exists = filteredSubjects.some((s) => s.id === selectedSubject?.id);
      if (!exists) {
        setSelectedSubject(filteredSubjects[0]);
      }
    } else {
      setSelectedSubject(null);
      setRoster([]);
      setMarksState({});
    }
  }, [filteredSubjects, selectedSubject]);

  // Load students taking the currently selected subject
  const loadRoster = async (subjectId) => {
    try {
      const res = await API.get(`/users/teacher/roster/${subjectId}`);
      setRoster(res.data);
      const initial = {};
      res.data.forEach((item) => {
        initial[item.mark_id] = item.mark ?? '';
      });
      setMarksState(initial);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load roster', 'error');
    }
  };

  useEffect(() => {
    if (selectedSubject?.id) {
      loadRoster(selectedSubject.id);
    }
  }, [selectedSubject]);

  // Filter roster by name/email search & submission status
  const filteredRoster = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return roster.filter((student) => {
      const name = (student.student_name || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const matchesSearch = !query || name.includes(query) || email.includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'GRADED' && student.is_submitted) ||
        (statusFilter === 'MISSING' && !student.is_submitted);

      return matchesSearch && matchesStatus;
    });
  }, [roster, searchQuery, statusFilter]);

  // Bulk save grades
  const handleBulkSubmit = async () => {
    if (!selectedSubject) return;

    const payload = Object.keys(marksState)
      .filter((k) => marksState[k] !== '' && !isNaN(marksState[k]))
      .map((k) => ({
        mark_id: parseInt(k, 10),
        mark: parseFloat(marksState[k])
      }));

    if (payload.length === 0) return showToast('Please enter marks first', 'error');

    setSubmittingMarks(true);
    try {
      const res = await API.put(`/users/teacher/marks/${selectedSubject.id}`, { marks: payload });
      showToast(res.data.message || 'Marks submitted successfully');
      loadRoster(selectedSubject.id);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit marks', 'error');
    } finally {
      setSubmittingMarks(false);
    }
  };

  // Reply to Student Doubt
  const handleReply = async (queryId) => {
    const reply = replyInputs[queryId]?.trim();
    if (!reply) return showToast('Please enter a response message', 'error');

    try {
      await API.put(`/users/teacher/query-reply/${queryId}`, { response: reply });
      showToast('Response dispatched to student');
      setReplyInputs((prev) => ({ ...prev, [queryId]: '' }));
      const qRes = await API.get('/users/teacher/queries');
      setQueries(qRes.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send response', 'error');
    }
  };

  // Aggregated Stats
  const pendingQueries = queries.filter((q) => !q.response);
  const gradedStudentsCount = roster.filter((r) => r.is_submitted).length;
  const missingStudentsCount = roster.length - gradedStudentsCount;

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

      {/* Faculty Sidebar */}
      <FacultySidebar
        activeTab={activeTab}
        onSelectTab={(tab) => { setActiveTab(tab); setSearchQuery(''); }}
        currentUser={currentUser}
        onLogout={onLogout}
        pendingQueriesCount={pendingQueries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Faculty</span>
            <span>›</span>
            <span className="text-slate-800 capitalize font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide">
              INSTRUCTOR PORTAL
            </span>
            <button
              onClick={loadInitialData}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Records"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {currentUser?.name || 'Professor'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">Review assigned classes, submission readiness, and student inquiries.</p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'TEACHING SUBJECTS', count: subjects.length, sub: 'Assigned Courses', icon: BookOpen },
                  { label: 'ACTIVE STUDENTS', count: roster.length, sub: selectedSubject ? `In ${selectedSubject.code}` : 'Select a course', icon: Users },
                  { label: 'SUBMISSIONS COMPLETED', count: gradedStudentsCount, sub: `${missingStudentsCount} pending marks`, icon: CheckCheck },
                  { label: 'UNRESOLVED DOUBTS', count: pendingQueries.length, sub: 'Awaiting your answer', icon: MessageSquare },
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

              {/* Direct Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Enter Student Grades</h3>
                      <p className="text-xs text-slate-500">Pick an assigned subject and submit marks for cohorts</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('subjects')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      Go to Grading Sheet
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Student Inquiries</h3>
                      <p className="text-xs text-slate-500">{pendingQueries.length} doubts currently require clarification</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('queries')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Open Student Doubts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBJECTS & BATCH GRADING */}
          {activeTab === 'subjects' && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Filter Strip */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
                <div className="flex flex-col gap-1.5 min-w-[220px]">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Target Semester
                  </label>
                  <div className="flex items-center gap-2">
                    {SEMESTERS.slice(0, 6).map((sem) => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSem(sem)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                          selectedSem === sem
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

              {/* Subject Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Assigned Courses in Semester {selectedSem}:
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {filteredSubjects.length} courses
                  </span>
                </div>

                {filteredSubjects.length === 0 ? (
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl text-xs text-slate-400 italic text-center">
                    No subjects assigned to you for Semester {selectedSem} under this department.
                  </div>
                ) : (
                  <div className="flex gap-2 pb-1 overflow-x-auto">
                    {filteredSubjects.map((sub) => {
                      const isSelected = selectedSubject?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSubject(sub)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap shadow-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {sub.name} <span className={`font-mono text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>({sub.code})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Candidate Roster & Grade Input Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Roster: {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'Select a Subject'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing {filteredRoster.length} of {roster.length} registered candidates
                    </p>
                  </div>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={!selectedSubject || roster.length === 0 || submittingMarks}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    {submittingMarks ? 'Saving...' : 'Save All Marks'}
                  </button>
                </div>

                {/* Search & Status Pill Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {['ALL', 'GRADED', 'MISSING'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                          statusFilter === status
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : status === 'GRADED' ? 'Graded' : 'Missing'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roster Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-5">Student Name</th>
                        <th className="py-3 px-5">Email</th>
                        <th className="py-3 px-5 text-center">Status</th>
                        <th className="py-3 px-5 text-right">Score (0 - 100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRoster.map((r) => (
                        <tr key={r.mark_id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-5 font-semibold text-slate-800">{r.student_name}</td>
                          <td className="py-3 px-5 text-slate-500">{r.email}</td>
                          <td className="py-3 px-5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                r.is_submitted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {r.is_submitted ? 'Graded' : 'Missing'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={marksState[r.mark_id] ?? ''}
                              onChange={(e) =>
                                setMarksState({ ...marksState, [r.mark_id]: e.target.value })
                              }
                              className="w-24 px-3 py-1.5 text-right bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500"
                              placeholder="Score"
                            />
                          </td>
                        </tr>
                      ))}
                      {filteredRoster.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            {!selectedSubject
                              ? 'Select a subject from above to inspect students.'
                              : roster.length === 0
                              ? 'No students found for this cohort.'
                              : 'No students matching the specified search.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT DOUBTS */}
          {activeTab === 'queries' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Student Doubts Inbox</h2>
                <p className="text-xs text-slate-500">Provide direct feedback and academic explanations to students.</p>
              </div>

              {queries.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs">
                  No inquiries or doubts currently assigned to you.
                </div>
              ) : (
                <div className="space-y-4">
                  {queries.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{q.student_name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({q.student_email})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(q.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Query Body */}
                      <div className="p-3.5 bg-slate-50 rounded-xl text-slate-700 text-xs leading-relaxed font-medium">
                        "{q.query_message}"
                      </div>

                      {/* Instructor Response */}
                      {q.response ? (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Your Response:
                          </div>
                          <p>{q.response}</p>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write an explanatory response..."
                            value={replyInputs[q.id] || ''}
                            onChange={(e) =>
                              setReplyInputs({ ...replyInputs, [q.id]: e.target.value })
                            }
                            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleReply(q.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" /> Reply
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}