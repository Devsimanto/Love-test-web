import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  HeartCrack,
  Sparkles,
  Copy,
  Check,
  Share2,
  Volume2,
  VolumeX,
  RotateCcw,
  Eye,
  Activity,
  Smile,
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { LetterData } from '../types';
import { sound } from '../utils/audio';
import { MEMES, getRandomMeme, MemeItem } from '../utils/memes';
import { Language, translations } from '../utils/i18n';
import { LanguageToggle } from './LanguageToggle';
import { getLetterDirect, resetLetterDirect } from '../services/letterService';
import { subscribeToLetter } from '../firebase';

interface AdminTrackerViewProps {
  letterId: string;
  adminToken: string;
}

export const AdminTrackerView: React.FC<AdminTrackerViewProps> = ({ letterId, adminToken }) => {
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedVictim, setCopiedVictim] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [activeMeme, setActiveMeme] = useState<MemeItem | null>(null);
  const [lastClicks, setLastClicks] = useState<number>(-1);
  const [lastStatus, setLastStatus] = useState<string>('');

  const victimUrl = `${window.location.origin}${window.location.pathname}?letter=${letterId}`;
  const adminUrl = `${window.location.origin}${window.location.pathname}?admin=${letterId}&token=${adminToken}`;

  const fetchLetterData = async () => {
    try {
      const res = await getLetterDirect(letterId, adminToken);
      setLetter(res.letter);
      handleDataUpdate(res.letter);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetterData();

    // Direct Firestore real-time listener
    const unsub = subscribeToLetter(letterId, (liveLetter) => {
      if (liveLetter) {
        setLetter(liveLetter);
        handleDataUpdate(liveLetter);
      }
    });

    return () => unsub();
  }, [letterId, adminToken]);

  const handleDataUpdate = (newLetter: LetterData) => {
    if (newLetter.status === 'rejected' && lastStatus !== 'rejected') {
      const meme = getRandomMeme('hate');
      triggerMemePopup(meme);
    } else if (newLetter.status === 'unlocked' && lastStatus !== 'unlocked') {
      const meme = getRandomMeme('unlock');
      triggerMemePopup(meme);
    } else if (lastClicks !== -1 && newLetter.currentClicks > lastClicks) {
      if (soundEnabled) {
        sound.playLovePop(1 + (newLetter.currentClicks / newLetter.targetClicks));
      }
      if (newLetter.currentClicks === 5 || newLetter.currentClicks === 12 || newLetter.currentClicks === 20) {
        const meme = getRandomMeme('love_milestone');
        triggerMemePopup(meme);
      }
    }

    setLastClicks(newLetter.currentClicks);
    setLastStatus(newLetter.status);
  };

  const triggerMemePopup = (meme: MemeItem) => {
    setActiveMeme(meme);
    if (soundEnabled) sound.playMemeSound(meme.soundType);
    setTimeout(() => setActiveMeme(null), 5500);
  };

  const copyToClipboard = (text: string, isVictim: boolean) => {
    navigator.clipboard.writeText(text);
    if (isVictim) {
      setCopiedVictim(true);
      setTimeout(() => setCopiedVictim(false), 2000);
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    }
  };

  const handleReset = async () => {
    if (!confirm(lang === 'bn' ? 'আপনি কি টেস্টটি আবার ০ থেকে শুরু করতে চান?' : 'Reset this test back to 0?')) return;
    try {
      await resetLetterDirect(letterId, adminToken);
      fetchLetterData();
      setLastClicks(0);
      setLastStatus('pending');
    } catch (e) {
      alert('Reset failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <Activity className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-300 font-medium">{lang === 'bn' ? 'এডমিন লাইভ ট্র্যাকার লোড হচ্ছে...' : 'Loading Admin Live Tracker...'}</p>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="bg-slate-900 p-8 rounded-2xl border border-red-800 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{lang === 'bn' ? 'সংযোগ ত্রুটি!' : 'Connection Error!'}</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Invalid admin token'}</p>
          <a
            href="/"
            className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            {lang === 'bn' ? 'হোমে ফিরে যান' : 'Go Home'}
          </a>
        </div>
      </div>
    );
  }

  const isHateClicked = letter.status === 'rejected';
  const isUnlocked = letter.status === 'unlocked';
  const lovePercent = isHateClicked ? 0 : isUnlocked ? 100 : letter.percentage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-['Hind_Siliguri',sans-serif]">
      
      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-900/50">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              {t.adminTitle}
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-semibold uppercase">
                {t.confidential}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {t.recipientTag}: <span className="text-rose-400 font-semibold">{letter.recipientName}</span> | {t.senderTag}: <span className="text-slate-300">{letter.senderName}</span>
            </p>
          </div>
        </div>

        {/* Controls: Language, Online, Sound, Reset */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle currentLang={lang} onToggle={(newLang) => setLang(newLang)} />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${letter.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-slate-300 font-medium">
              {letter.isOnline ? t.victimLive : t.waiting}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition ${
              soundEnabled
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/80'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title={soundEnabled ? t.soundOn : t.soundOff}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
            title={t.reset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.reset}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-5xl mx-auto py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Love Gauge & Live Status */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Circular Love Gauge Card */}
          <div className={`p-6 rounded-2xl border transition-all duration-500 text-center relative overflow-hidden ${
            isHateClicked
              ? 'bg-gradient-to-b from-red-950/70 to-slate-900 border-red-700 shadow-2xl shadow-red-950/50'
              : isUnlocked
              ? 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500 shadow-2xl shadow-rose-950/50'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-4">
              {t.liveMeter}
            </span>

            {/* Big Score Visual */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`transition-all duration-700 ease-out ${
                    isHateClicked ? 'stroke-red-600' : isUnlocked ? 'stroke-rose-500' : 'stroke-pink-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * lovePercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isHateClicked ? (
                  <HeartCrack className="w-10 h-10 text-red-500 animate-pulse mb-1" />
                ) : (
                  <Heart className={`w-10 h-10 mb-1 ${isUnlocked ? 'text-rose-500 fill-rose-500 animate-bounce' : 'text-pink-400 fill-pink-400/40'}`} />
                )}
                <span className={`text-4xl font-black tracking-tight ${
                  isHateClicked ? 'text-red-500' : isUnlocked ? 'text-rose-400' : 'text-white'
                }`}>
                  {lovePercent}%
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Love Score</span>
              </div>
            </div>

            {/* Click Counter Pill */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-around text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">{t.totalClicks}</span>
                <span className="text-lg font-bold text-white">{letter.currentClicks} / {letter.targetClicks}</span>
              </div>
              <div className="w-[1px] bg-slate-800" />
              <div>
                <span className="text-[11px] text-slate-400 block">{t.letterState}</span>
                <span className={`text-sm font-bold ${
                  isHateClicked ? 'text-red-400' : isUnlocked ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isHateClicked ? t.statusRejected : isUnlocked ? t.statusUnlocked : t.statusClosed}
                </span>
              </div>
            </div>

            {/* Hate Warning Alert */}
            {isHateClicked && (
              <div className="mt-4 p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-left text-xs text-red-200">
                <p className="font-bold flex items-center gap-1.5 text-red-400 mb-1">
                  <HeartCrack className="w-4 h-4" /> {t.hateAlertTitle}
                </p>
                {t.hateAlertDesc}
              </div>
            )}
          </div>

          {/* Quick Links Card */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-rose-500" />
              {t.shareHeader}
            </h3>

            {/* Victim Link */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>{t.victimSendLabel}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={victimUrl}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 w-full truncate focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(victimUrl, true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    copiedVictim ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {copiedVictim ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVictim ? t.copied : t.copyBtn}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `💌 ${letter.recipientName}, ${t.victimMysteryNotice} ${victimUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t.whatsappShare}
            </a>

            {/* Preview Button */}
            <a
              href={victimUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.testView}
            </a>
          </div>

          {/* Letter Secret Content Preview */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-400" /> {t.secretPreview}
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 italic whitespace-pre-wrap leading-relaxed">
              "{letter.secretMessage}"
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed & Funny Memes Soundboard */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Meme Soundboard Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">{t.soundboardTitle}</h3>
              </div>
              <span className="text-[11px] text-purple-300 bg-purple-950 border border-purple-800 px-2.5 py-0.5 rounded-full">
                {t.soundboardSub}
              </span>
            </div>

            {/* Test Meme Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => triggerMemePopup(MEMES[0])}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-red-900/60 text-left transition text-xs"
              >
                <span className="text-base block mb-0.5">😿💔</span>
                <span className="font-bold text-red-300 block truncate">Emotional Damage</span>
                <span className="text-[10px] text-slate-400">0% Love Meme</span>
              </button>

              <button
                onClick={() => triggerMemePopup(MEMES[1])}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-amber-900/60 text-left transition text-xs"
              >
                <span className="text-base block mb-0.5">🐹🥺</span>
                <span className="font-bold text-amber-300 block truncate">Sad Hamster</span>
                <span className="text-[10px] text-slate-400">Sad Trombone</span>
              </button>

              <button
                onClick={() => triggerMemePopup(MEMES[3])}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-sky-900/60 text-left transition text-xs"
              >
                <span className="text-base block mb-0.5">🕵️‍♂️🔍</span>
                <span className="font-bold text-sky-300 block truncate">Desperate Search</span>
                <span className="text-[10px] text-slate-400">Cartoon Boing</span>
              </button>

              <button
                onClick={() => triggerMemePopup(MEMES[5])}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-emerald-900/60 text-left transition text-xs"
              >
                <span className="text-base block mb-0.5">🎉🏆</span>
                <span className="font-bold text-emerald-300 block truncate">100% Victory</span>
                <span className="text-[10px] text-slate-400">Airhorn Fanfare</span>
              </button>
            </div>
          </div>

          {/* Real-time Activity Ticker */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{t.activityTitle}</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {t.totalEvents} {letter.events?.length || 0}
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {letter.events && letter.events.length > 0 ? (
                letter.events.map((evt, idx) => {
                  const dateStr = new Date(evt.timestamp).toLocaleTimeString();
                  const isHate = evt.type === 'click_hate';
                  const isUnlock = evt.type === 'unlocked';

                  return (
                    <motion.div
                      key={evt.id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        isHate
                          ? 'bg-red-950/40 border-red-700/60 text-red-200'
                          : isUnlock
                          ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">
                          {isHate ? '💔' : isUnlock ? '🎉' : '❤️'}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-200">{evt.message}</p>
                          <span className="text-[10px] text-slate-500">{dateStr}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isHate
                            ? 'bg-red-900 text-red-200'
                            : isUnlock
                            ? 'bg-emerald-900 text-emerald-200'
                            : 'bg-rose-950 text-rose-300'
                        }`}>
                          {evt.percentage}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {t.noEventsYet}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Pop-up Funny Meme Notification Modal */}
      <AnimatePresence>
        {activeMeme && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
          >
            <div className={`p-5 rounded-2xl shadow-2xl border bg-gradient-to-br ${activeMeme.color} border-white/20 text-white relative backdrop-blur-md`}>
              <button
                onClick={() => setActiveMeme(null)}
                className="absolute top-2 right-2 text-white/70 hover:text-white text-xs px-2 py-0.5"
              >
                ✕
              </button>
              <div className="text-3xl mb-2">{activeMeme.emoji}</div>
              <h4 className="text-base font-bold mb-1">{activeMeme.title}</h4>
              <p className="text-xs text-white/90 leading-relaxed">{activeMeme.subtitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
