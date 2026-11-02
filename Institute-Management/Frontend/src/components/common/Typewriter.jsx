import { useState, useEffect } from 'react';

export default function Typewriter({ text, speed = 12 }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-xs">
      {displayedText}
      {displayedText.length < (text?.length || 0) && (
        <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
      )}
    </div>
  );
}