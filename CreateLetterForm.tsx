import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Send, Sparkles } from 'lucide-react';
import { LetterData } from '../types';
import { Language, translations } from '../utils/i18n';
import { LanguageToggle } from './LanguageToggle';
import { createLetterDirect } from '../services/letterService';

interface CreateLetterFormProps {
  onCreated: (letter: LetterData) => void;
  onQuickDemo: () => void;
}

export const CreateLetterForm: React.FC<CreateLetterFormProps> = ({ onCreated, onQuickDemo }) => {
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [secretMessage, setSecretMessage] = useState(
    'তুমি আমার জীবনের শ্রেষ্ঠ গল্প। হাজার ভিড়ের মাঝেও আমার চোখ শুধু তোমাকেই খোঁজে। অনেক ভালোবাসি তোমাকে! ❤️'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে প্রিয় মানুষের নাম লিখুন!' : 'Please enter recipient name!');
      return;
    }
    if (!secretMessage.trim()) {
      setError(lang === 'bn' ? 'চিঠির বার্তাটি লিখুন!' : 'Please enter secret message!');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create directly in Firebase Firestore (works 100% on static hosts like GitHub Pages!)
      const letter = await createLetterDirect({
        recipientName,
        senderName: senderName.trim() || (lang === 'bn' ? 'গোপন প্রেমিক' : 'Secret Admirer'),
        secretMessage
      });

      onCreated(letter);
    } catch (err: any) {
      setError(err.message || 'Error creating letter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 py-10 px-4 sm:px-6 font-['Hind_Siliguri',sans-serif]">
      <div className="max-w-2xl mx-auto">
        
        {/* Top Navbar with Language Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle currentLang={lang} onToggle={(newLang) => setLang(newLang)} />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-3 text-white"
          >
            <Heart className="w-9 h-9 fill-white" />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight font-['Playfair_Display',serif]">
            {t.appTitle}
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            {t.appSubtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-rose-200/80 p-6 sm:p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.recipientLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.recipientPlaceholder}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.senderLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.senderPlaceholder}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.messageLabel}
                </label>
                <span className="text-[11px] text-slate-400">{t.secretHint}</span>
              </div>
              <textarea
                rows={4}
                value={secretMessage}
                onChange={(e) => setSecretMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm transition leading-relaxed"
                required
              />
            </div>

            {/* Mystery Challenge Setting */}
            <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  {t.challengeNote}
                </p>
                <p className="text-xs text-rose-800/80">
                  {t.victimMysteryNotice}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-base shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? t.creating : t.submitBtn}</span>
            </button>
          </form>

          {/* Quick Demo Button */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onQuickDemo}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-100/70 hover:bg-rose-200/80 px-4 py-2 rounded-full transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.quickDemo}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
