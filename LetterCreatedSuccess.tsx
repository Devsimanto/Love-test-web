import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ExternalLink, Heart, Radio, Share2 } from 'lucide-react';
import { LetterData } from '../types';
import { Language, translations } from '../utils/i18n';
import { LanguageToggle } from './LanguageToggle';

interface LetterCreatedSuccessProps {
  letter: LetterData;
  onGoToAdmin: () => void;
}

export const LetterCreatedSuccess: React.FC<LetterCreatedSuccessProps> = ({ letter, onGoToAdmin }) => {
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [copiedVictim, setCopiedVictim] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  // Computes path accurately on GitHub Pages (e.g. /my-repo/) or root (/)
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const victimUrl = `${baseUrl}?letter=${letter.id}`;
  const adminUrl = `${baseUrl}?admin=${letter.id}&token=${letter.adminToken}`;

  const copyVictim = () => {
    navigator.clipboard.writeText(victimUrl);
    setCopiedVictim(true);
    setTimeout(() => setCopiedVictim(false), 2000);
  };

  const copyAdmin = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 py-10 px-4 sm:px-6 font-['Hind_Siliguri',sans-serif]">
      <div className="max-w-xl mx-auto">
        
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle currentLang={lang} onToggle={(newLang) => setLang(newLang)} />
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-rose-200 p-6 sm:p-8 text-center">
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/30"
          >
            <Check className="w-8 h-8 stroke-[3]" />
          </motion.div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-['Playfair_Display',serif]">
            {t.successTitle}
          </h2>
          <p className="text-slate-600 text-sm mt-1.5 mb-6">
            {t.successSubtitle}
          </p>

          {/* Links Section */}
          <div className="space-y-4 text-left">
            
            {/* 1. Victim Link */}
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {t.victimLinkTitle}
                </span>
                <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
                  Public
                </span>
              </div>
              <p className="text-xs text-rose-700/80 mb-2">
                {t.victimLinkDesc}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={victimUrl}
                  className="bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-700 w-full truncate font-mono select-all"
                />
                <button
                  onClick={copyVictim}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    copiedVictim ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {copiedVictim ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVictim ? t.copied : t.copyBtn}</span>
                </button>
              </div>

              <div className="mt-2.5 flex gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `💌 ${letter.recipientName}, ${t.victimMysteryNotice} ${victimUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> {t.whatsappShare}
                </a>
                <a
                  href={victimUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> {t.testView}
                </a>
              </div>
            </div>

            {/* 2. Admin Live Tracker Link */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> {t.adminLinkTitle}
                </span>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-semibold">
                  Secret
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {t.adminLinkDesc}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={adminUrl}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 w-full truncate font-mono select-all"
                />
                <button
                  onClick={copyAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    copiedAdmin ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {copiedAdmin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAdmin ? t.copied : t.copyBtn}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Action button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onGoToAdmin}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-ping" />
              <span>{t.enterAdmin}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
