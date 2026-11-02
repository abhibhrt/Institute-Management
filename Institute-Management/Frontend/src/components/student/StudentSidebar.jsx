import { 
  GraduationCap, 
  BarChart3, 
  Sparkles, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Your result, rank & topic analysis', icon: BarChart3 },
  { id: 'ai-feedback', label: 'AI Feedback & Remedial', desc: 'Strengths, books & video resources', icon: Sparkles },
  { id: 'doubts', label: 'Doubts & Queries', desc: 'Direct professor & AI doubt inbox', icon: HelpCircle },
];

export default function StudentSidebar({ activeTab, onSelectTab, currentUser, onLogout }) {
  const userInitial = currentUser?.name ? currentUser.name[0].toUpperCase() : 'S';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-none">Result Intelligence</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Student Portal</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                  active
                    ? 'bg-blue-50/80 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-semibold leading-tight">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Information and Sign Out */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {userInitial}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 truncate">{currentUser?.name || 'Student'}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'student@college.com'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out of account"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}