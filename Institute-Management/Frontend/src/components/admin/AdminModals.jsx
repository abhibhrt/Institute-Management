import { useState } from 'react';
import API from '../../api/axiosClient';
import { X } from 'lucide-react';

export function ModalShell({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AddDeptModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/department', { name });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Add Department" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="text"
          placeholder="e.g. Computer Science and Engineering"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Create</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AddTeacherModal({ departments, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', empid: '', email: '', password: '', phoneno: '', department_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/teacher', formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Add Faculty Member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required placeholder="Employee ID (e.g. EMP101)" value={formData.empid} onChange={e => setFormData({ ...formData, empid: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <select required value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none">
          <option value="">Select Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Save</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AddStudentModal({ departments, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phoneno: '', curr_sem: 1, year: 1, department_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/student', formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Add Student" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Student Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required type="email" placeholder="Student Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input required type="number" min="1" max="8" placeholder="Semester" value={formData.curr_sem} onChange={e => setFormData({ ...formData, curr_sem: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
          <input required type="number" min="1" max="4" placeholder="Year" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        </div>
        <select required value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none">
          <option value="">Select Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Save</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AddSubjectModal({ departments, teachers, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', code: '', semester: 1, department_id: '', faculty_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/subject', formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Add Subject" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Subject Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required placeholder="Subject Code (e.g. CS501)" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <input required type="number" min="1" max="8" placeholder="Semester" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <select required value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none">
          <option value="">Select Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={formData.faculty_id} onChange={e => setFormData({ ...formData, faculty_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none">
          <option value="">Assign Faculty (Optional)</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.empid})</option>)}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Save</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AssignFacultyModal({ subject, teachers, onClose, onSuccess }) {
  const [facultyId, setFacultyId] = useState(subject?.faculty_id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put(`/admin/subject/assign-faculty/${subject.id}`, { faculty_id: facultyId });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Assign Faculty" subtitle={`${subject?.name} (${subject?.code})`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          required
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
        >
          <option value="">Select Faculty Member</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.empid})</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Assign</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function InitExamModal({ departments, onClose, onSuccess }) {
  const [deptId, setDeptId] = useState('');
  const [sem, setSem] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/exam/initialize', { department_id: parseInt(deptId, 10), semester: parseInt(sem, 10) });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Initialize Examination" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select required value={deptId} onChange={(e) => setDeptId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none">
          <option value="">Select Department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input required type="number" min="1" max="8" placeholder="Semester" value={sem} onChange={(e) => setSem(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Initialize</button>
        </div>
      </form>
    </ModalShell>
  );
}