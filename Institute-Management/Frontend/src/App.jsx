import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import AdminDashboard from './components/admin/AdminView';
import FacultyView from './components/faculty/FacultyView';
import StudentView from './components/student/StudentView';

export default function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedRole) {
      setRole(savedRole);
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setActiveTab(savedRole === 'admin' ? 'overview' : savedRole === 'teacher' ? 'subjects' : 'results');
    }
  }, []);

  const handleLogin = (userRole, userData) => {
    setRole(userRole);
    setUser(userData);
    setActiveTab(userRole === 'admin' ? 'overview' : userRole === 'teacher' ? 'subjects' : 'results');
  };

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setUser(null);
  };

  if (!role) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {role === 'admin' && (
        <AdminDashboard
          currentUser={user}
          onLogout={handleLogout}
        />
      )}
      {role === 'teacher' && (
        <FacultyView
          currentUser={user}
          onLogout={handleLogout}
        />
      )}
      {role === 'student' && (
        <StudentView
          currentUser={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}