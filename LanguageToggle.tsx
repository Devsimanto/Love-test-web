import React from 'react';
import { Language } from '../utils/i18n';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  currentLang: Language;
  onToggle: (lang: Language) => void;
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLang, onToggle, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-rose-200/60 dark:border-slate-800 shadow-sm ${className}`}>
      <Globe className="w-3.5 h-3.5 ml-2 text-rose-500" />
      <button
        onClick={() => onToggle('bn')}
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition ${
          currentLang === 'bn'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        বাংলা
      </button>
      <button
        onClick={() => onToggle('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition ${
          currentLang === 'en'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        English
      </button>
    </div>
  );
};
