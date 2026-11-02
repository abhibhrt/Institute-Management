export default function Topbar({ user, onLogout }) {
  return (
    <header className="h-16 bg-[#0f172a]/70 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="text-xs text-slate-400 font-medium">
        Active Session: <span className="text-slate-200 font-semibold">{user?.email}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
          <div className="text-[10px] text-slate-500">{user?.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300 border border-red-900/40 text-xs font-semibold transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}