import { APP_CONFIG } from '../../config/appConfig';

export default function Sidebar({ role, activeTab, setActiveTab }) {
  const getMenuItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Examinations & Results'},
        { id: 'manage', label: 'Onboarding & Structure'},
      ];
    }
    if (role === 'teacher') {
      return [
        { id: 'subjects', label: 'Grading Dashboard'},
        { id: 'queries', label: 'Student Doubts'},
      ];
    }
    return [
      { id: 'results', label: 'Grade Cards & AI Review'},
      { id: 'doubts', label: 'Faculty & AI Help'},
    ];
  };

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen">
      <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
          {APP_CONFIG.APP_NAME[0]}
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide">{APP_CONFIG.APP_NAME}</h1>
          <p className="text-[10px] text-slate-500 font-medium">{APP_CONFIG.TAGLINE}</p>
        </div>
      </div>

      <nav className="p-4 space-y-1.5 flex-1">
        {getMenuItems().map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/60">
        <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Role Status</span>
          <span className="uppercase text-indigo-400 font-bold">{role}</span>
        </div>
      </div>
    </aside>
  );
}