import { Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChartInfoButtonProps {
  title: string;
  description: string;
}

export default function ChartInfoButton({ title, description }: ChartInfoButtonProps) {
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  return (
    <div className="relative" ref={infoRef}>
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Chart information"
      >
        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
      </button>
      {showInfo && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
