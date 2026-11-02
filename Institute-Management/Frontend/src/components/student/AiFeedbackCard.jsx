import ReactMarkdown from 'react-markdown';

export default function AiFeedbackCard({ text }) {
  if (!text) {
    return (
      <div className="text-slate-400 italic text-xs">
        No AI mentorship analysis available yet.
      </div>
    );
  }

  return (
    <div className="relative bg-[#0d1424] border border-indigo-900/60 rounded-2xl p-6 shadow-xl shadow-black/40 overflow-hidden">
      {/* Top glowing ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 opacity-80" />

      {/* Header Badge */}
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-800/80">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
        <h4 className="text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          Gemini AI Mentorship & Action Plan
        </h4>
      </div>

      {/* Custom Styled Markdown Parser */}
      <div className="text-slate-200 text-xs leading-relaxed space-y-4 font-sans">
        <ReactMarkdown
          components={{
            // Convert ### Headings to sleek pill badges
            h3: ({ node, ...props }) => {
              const textContent = String(props.children);
              const isStrong = textContent.toLowerCase().includes('strong');
              const isWeak = textContent.toLowerCase().includes('weak');

              return (
                <div className="mt-5 mb-3 pt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs tracking-wide uppercase border ${
                      isStrong
                        ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 shadow-sm shadow-emerald-900/30'
                        : isWeak
                        ? 'bg-rose-950/70 border-rose-700/60 text-rose-300 shadow-sm shadow-rose-900/30'
                        : 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300'
                    }`}
                  >
                    <span>{isStrong ? '✦' : isWeak ? '▲' : '●'}</span>
                    {props.children}
                  </span>
                </div>
              );
            },

            // Soft horizontal divider
            hr: () => <hr className="border-slate-800/80 my-4" />,

            // Paragraph styling
            p: ({ node, ...props }) => (
              <p className="text-slate-300 text-xs leading-relaxed my-2">
                {props.children}
              </p>
            ),

            // Nested list styling
            ul: ({ node, depth, ...props }) => {
              if (depth === 0) {
                // Top-level subjects list as distinct dark glass cards
                return <div className="space-y-3 my-3">{props.children}</div>;
              }
              // Nested items (areas for improvement, book recommendations, etc.)
              return (
                <ul className="mt-2 space-y-1.5 pl-4 border-l-2 border-indigo-500/20 text-slate-300">
                  {props.children}
                </ul>
              );
            },

            li: ({ node, ...props }) => {
              return (
                <li className="list-none py-1">
                  {props.children}
                </li>
              );
            },

            // Strong/Bold highlights with glowing colors
            strong: ({ node, ...props }) => {
              const content = String(props.children);
              // Highlight subjects and scores nicely
              const isScore = /\(\d+\s*marks?\)/i.test(content);
              return (
                <strong
                  className={`font-semibold ${
                    isScore
                      ? 'text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 font-mono text-[11px]'
                      : 'text-indigo-200'
                  }`}
                >
                  {props.children}
                </strong>
              );
            },

            // Emphasis/Italics formatting
            em: ({ node, ...props }) => (
              <em className="text-slate-400 not-italic font-medium text-indigo-300/80">
                {props.children}
              </em>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}