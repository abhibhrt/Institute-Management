import { useEffect, useMemo, useState } from 'react';
import API from '../../api/axiosClient';
import StudentSidebar from './StudentSidebar';
import { 
  RotateCw, 
  Sparkles, 
  BookOpen, 
  Video, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Clock, 
  UserCheck, 
  Bot, 
  Award, 
  TrendingUp,
  BarChart2,
  Mail,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentView({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [results, setResults] = useState([]);
  const [queries, setQueries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [selectedSem, setSelectedSem] = useState(1);

  // Doubt submission states
  const [targetType, setTargetType] = useState('AI');
  const [messageText, setMessageText] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [aiResultId, setAiResultId] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [aiConversations, setAiConversations] = useState([]);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoadingInitial(true);
    try {
      const [resData, qData, teachersRes] = await Promise.all([
        API.get('/users/student/results'),
        API.get('/users/student/queries'),
        API.get('/users/student/teachers')
      ]);
      setResults(resData.data || []);
      setQueries(qData.data || []);
      setTeachers(teachersRes.data || []);
      if (resData.data?.length > 0) {
        setSelectedSem(Number(resData.data[0].semester));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error loading records', 'error');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeResult = useMemo(() => {
    return results.find((r) => Number(r.semester) === Number(selectedSem));
  }, [results, selectedSem]);

  // Parse structured AI recommendations (feedback, books, youtube)
  const parsedAiFeedback = useMemo(() => {
    if (!activeResult?.ai_feedback) return null;
    try {
      if (typeof activeResult.ai_feedback === 'object') return activeResult.ai_feedback;
      return JSON.parse(activeResult.ai_feedback);
    } catch {
      return {
        generalFeedback: activeResult.ai_feedback,
        books: [],
        youtubeResources: []
      };
    }
  }, [activeResult]);

  // Overall Performance Calculations
  const stats = useMemo(() => {
    if (!activeResult?.marks?.length) return null;
    const marks = activeResult.marks.map((m) => Number(m.mark) || 0);
    const sum = marks.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / marks.length);
    const failedCount = marks.filter((m) => m < 33).length;
    
    let grade = 'F';
    if (avg >= 85) grade = 'A+';
    else if (avg >= 75) grade = 'A';
    else if (avg >= 65) grade = 'B';
    else if (avg >= 50) grade = 'C';
    else if (avg >= 33) grade = 'D';

    return {
      average: avg,
      grade,
      passed: failedCount === 0,
      failedCount,
      strongSubjects: activeResult.marks.filter((m) => Number(m.mark) >= 75),
      weakSubjects: activeResult.marks.filter((m) => Number(m.mark) < 50),
      failedSubjects: activeResult.marks.filter((m) => Number(m.mark) < 33)
    };
  }, [activeResult]);

  // Unified conversation history
  const unifiedHistory = useMemo(() => {
    const facultyItems = queries.map((q) => ({
      id: `faculty-${q.id}`,
      type: 'FACULTY',
      targetName: q.faculty_name,
      question: q.query_message,
      response: q.response,
      createdAt: q.created_at ? new Date(q.created_at).getTime() : 0,
      dateLabel: q.created_at ? new Date(q.created_at).toLocaleDateString() : ''
    }));
    return [...facultyItems, ...aiConversations].sort((a, b) => b.createdAt - a.createdAt);
  }, [queries, aiConversations]);

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return showToast('Type a message first', 'error');

    setLoadingSubmit(true);
    if (targetType === 'FACULTY') {
      if (!facultyId) {
        setLoadingSubmit(false);
        return showToast('Select a professor', 'error');
      }
      try {
        await API.post('/users/student/ask-teacher', {
          faculty_id: parseInt(facultyId, 10),
          query_message: trimmed
        });
        showToast('Query submitted to professor');
        setMessageText('');
        setFacultyId('');
        const qData = await API.get('/users/student/queries');
        setQueries(qData.data || []);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to send doubt', 'error');
      } finally {
        setLoadingSubmit(false);
      }
    } else {
      try {
        const res = await API.post('/users/student/ask-ai', {
          question: trimmed,
          resultId: aiResultId ? parseInt(aiResultId, 10) : activeResult?.id || null
        });

        const newChat = {
          id: `ai-${Date.now()}`,
          type: 'AI',
          targetName: 'Gemini AI Mentor',
          question: trimmed,
          response: res.data.response,
          createdAt: Date.now(),
          dateLabel: new Date().toLocaleDateString()
        };

        setAiConversations((prev) => [newChat, ...prev]);
        setMessageText('');
        showToast('AI explanation generated');
      } catch (err) {
        showToast('AI assistant is busy. Please try again', 'error');
      } finally {
        setLoadingSubmit(false);
      }
    }
  };

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

      {/* Student Sidebar */}
      <StudentSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Student</span>
            <span>›</span>
            <span className="text-slate-800 capitalize font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('ai-feedback')}
              className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Feedback
            </button>
            <button
              onClick={loadData}
              disabled={loadingInitial}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Record"
            >
              <RotateCw className={`w-4 h-4 ${loadingInitial ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: DASHBOARD & GRAPHICAL METRICS */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Header & Semester Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Hello, {activeResult?.student_name || currentUser?.name || 'Scholar'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeResult ? `Semester ${activeResult.semester} · ${activeResult.department_name}` : 'Select a semester to review performance'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs">
                  {SEMESTERS.slice(0, 6).map((sem) => {
                    const isSelected = selectedSem === sem;
                    const hasReport = results.some((r) => Number(r.semester) === sem);
                    return (
                      <button
                        key={sem}
                        onClick={() => setSelectedSem(sem)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition relative ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Sem {sem}
                        {hasReport && !isSelected && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!activeResult ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-xs">
                  No examination report released for Semester {selectedSem} yet.
                </div>
              ) : (
                <>
                  {/* Top Metric Cards (Profile + Score + Grade + Status) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Student Identity Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shadow-blue-500/20 shrink-0">
                            {(activeResult?.student_name || currentUser?.name || 'S')[0].toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
                              {activeResult?.student_name || currentUser?.name}
                            </h2>
                            <div className="text-xs text-slate-500 font-medium mt-0.5 truncate flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{activeResult?.department_name || 'Department'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-400 font-mono">
                              <span>ID: {activeResult?.student_id || currentUser?.id || 'N/A'}</span>
                              <span>•</span>
                              <span>Yr {activeResult?.academic_year || currentUser?.year || 1}</span>
                              <span>•</span>
                              <span>Sem {activeResult?.semester}</span>
                            </div>
                          </div>
                        </div>

                        {/* Email display */}
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{activeResult?.student_email || currentUser?.email}</span>
                        </div>
                      </div>

                      {/* Status Tags */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          stats?.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {stats?.passed ? 'Pass' : 'Backlog'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {stats?.average >= 70 ? 'Good' : stats?.average >= 50 ? 'Average' : 'Critical'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-auto">
                          {stats?.failedCount > 0 ? `${stats.failedCount} Sub Pending` : 'All Cleared'}
                        </span>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OVERALL SCORE</span>
                        <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.average}%</div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-4 pt-3 border-t border-slate-100">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Semester Average</span>
                      </div>
                    </div>

                    {/* Academic Grade */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GRADE</span>
                        <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.grade}</div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 font-medium">
                        Standard University Scale
                      </div>
                    </div>

                    {/* Standing Status */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STANDING</span>
                        <div className="text-3xl font-extrabold text-slate-900 mt-2">
                          {stats?.failedCount > 0 ? `${stats.failedCount} Failed` : 'Cleared'}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 font-medium">
                        {stats?.failedCount > 0 ? 'Requires Retest Examination' : 'Promoted to Next Semester'}
                      </div>
                    </div>
                  </div>

                  {/* Graphical Marks Breakdown & Categories */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Subject Marks Graphical Chart */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-blue-600" />
                            Subject Performance Graph
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Individual marks measured against the 33% passing benchmark</p>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">Max Score: 100</span>
                      </div>

                      {/* Marks Visualizer Progress Bars */}
                      <div className="space-y-4 pt-2">
                        {activeResult.marks?.map((m, idx) => {
                          const markVal = Number(m.mark) || 0;
                          const isFailed = markVal < 33;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">
                                  {m.subject} <span className="text-slate-400 font-mono text-[11px]">({m.code})</span>
                                </span>
                                <span className={`font-bold ${isFailed ? 'text-rose-600' : 'text-slate-900'}`}>
                                  {markVal} / 100
                                </span>
                              </div>
                              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 left-[33%] w-0.5 bg-slate-300 z-10" title="Passing Cutoff (33)" />
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isFailed ? 'bg-rose-500' : markVal >= 75 ? 'bg-blue-600' : 'bg-blue-400'
                                  }`} 
                                  style={{ width: `${Math.min(markVal, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Strong (≥75)</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Average (33-74)</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Failed (&lt;33)</span>
                        </div>
                        <span>Dashed indicator: Passing Cutoff (33)</span>
                      </div>
                    </div>

                    {/* Strong vs Weak Subject Cards */}
                    <div className="lg:col-span-4 space-y-4">
                      
                      {/* Strong Subjects */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Strong Subjects (≥ 75%)</span>
                        </div>
                        <div className="space-y-2">
                          {stats?.strongSubjects.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No subjects above 75% in this semester.</p>
                          ) : (
                            stats?.strongSubjects.map((s, idx) => (
                              <div key={idx} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">{s.subject}</span>
                                <span className="font-bold text-emerald-700">{s.mark}%</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Attention Required Subjects */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Attention Required (&lt; 50%)</span>
                        </div>
                        <div className="space-y-2">
                          {stats?.weakSubjects.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Excellent! All subjects scored 50% or higher.</p>
                          ) : (
                            stats?.weakSubjects.map((s, idx) => (
                              <div key={idx} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800">{s.subject}</span>
                                  {Number(s.mark) < 33 && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-200 text-rose-800 uppercase">Fail</span>
                                  )}
                                </div>
                                <span className="font-bold text-rose-600">{s.mark}%</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: AI FEEDBACK & FAILED SUBJECT REMEDIAL RESOURCES */}
          {activeTab === 'ai-feedback' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI Mentorship & Remedial Learning
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated performance diagnosis, textbooks, and YouTube links for subjects below 33.
                </p>
              </div>

              {!activeResult ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs">
                  Please select an active semester result from the dashboard.
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* General Mentorship Feedback */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-900">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Diagnostic Mentorship Feedback</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                      {parsedAiFeedback?.generalFeedback || 'Evaluating semester performance...'}
                    </p>
                  </div>

                  {/* Section 2: Standard Books (Triggered for Marks < 33) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Recommended Textbooks</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Auto-Curated</span>
                    </div>

                    {!parsedAiFeedback?.books || parsedAiFeedback.books.length === 0 ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>No failed subjects in this semester. Keep up the high score!</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {parsedAiFeedback.books.map((b, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700 uppercase">
                              {b.subject}
                            </span>
                            <div className="font-bold text-xs text-slate-900">{b.bookTitle}</div>
                            <div className="text-[11px] text-slate-500 font-medium">Author: {b.author}</div>
                            {b.reason && <p className="text-[11px] text-slate-600 pt-1 leading-snug">{b.reason}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 3: YouTube Videos (Triggered for Marks < 33) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Video className="w-4 h-4 text-rose-600" />
                        <span>Targeted YouTube Video Playlists</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Direct Search Links</span>
                    </div>

                    {!parsedAiFeedback?.youtubeResources || parsedAiFeedback.youtubeResources.length === 0 ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>No remedial video lessons required for this semester.</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {parsedAiFeedback.youtubeResources.map((yt, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{yt.topic}</span>
                                <span className="text-[10px] font-medium text-slate-400">({yt.subject})</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">Query: "{yt.searchQuery}"</div>
                            </div>
                            <a
                              href={yt.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(yt.searchQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Watch on YouTube
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOUBTS & INQUIRIES */}
          {activeTab === 'doubts' && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Question Form */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Ask a Doubt</h3>
                  
                  {/* AI vs Faculty Selector */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTargetType('AI')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        targetType === 'AI' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      AI Tutor
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('FACULTY')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        targetType === 'FACULTY' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Faculty
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAskSubmit} className="space-y-4">
                  {targetType === 'FACULTY' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Choose Professor
                      </label>
                      <select
                        required
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Professor</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Report Context (Optional)
                      </label>
                      <select
                        value={aiResultId}
                        onChange={(e) => setAiResultId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No specific semester context</option>
                        {results.map((r) => (
                          <option key={r.id} value={r.id}>Semester {r.semester} Report Context</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Your Query
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={targetType === 'AI' ? 'Ask AI to explain a theorem, review weak topics, or break down formulas...' : 'Ask your professor about lecture notes, marks verification, or exam questions...'}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {loadingSubmit ? 'Dispatching...' : targetType === 'AI' ? 'Send to AI Tutor' : 'Dispatch to Faculty'}
                  </button>
                </form>
              </div>

              {/* Thread History */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Conversation History</h3>
                  <span className="text-[11px] font-semibold text-slate-400">{unifiedHistory.length} messages</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                  {unifiedHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      No doubt submissions on record. Ask a query above to start.
                    </div>
                  ) : (
                    unifiedHistory.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                              item.type === 'AI' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.type}
                            </span>
                            <span className="font-bold text-slate-800">{item.targetName}</span>
                          </div>
                          <span className="text-slate-400">{item.dateLabel}</span>
                        </div>

                        {/* Question */}
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                          <span className="font-bold text-slate-400 mr-1.5">You:</span>
                          {item.question}
                        </div>

                        {/* Answer */}
                        {item.response ? (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {item.type === 'AI' ? 'AI Tutor Response:' : 'Faculty Response:'}
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{item.response}</p>
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[11px] font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting response from faculty...
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}