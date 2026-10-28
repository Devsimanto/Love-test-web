import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, HeartCrack, Sparkles, Mail, Award, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { LetterData } from '../types';
import { sound } from '../utils/audio';
import { Language, translations } from '../utils/i18n';
import { LanguageToggle } from './LanguageToggle';
import { getLetterDirect, pushLetterEventDirect, _REQ_VAL } from '../services/letterService';
import { subscribeToLetter } from '../firebase';

interface VictimViewProps {
  letterId: string;
}

export const VictimView: React.FC<VictimViewProps> = ({ letterId }) => {
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clicks, setClicks] = useState(0);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'unlocked' | 'rejected'>('pending');
  const [revealedMessage, setRevealedMessage] = useState<string | null>(null);

  // Position of moving "I love you" button
  const [loveBtnPos, setLoveBtnPos] = useState<{ x: number; y: number; isFloating: boolean; scale: number; rotation: number }>({
    x: 0,
    y: 0,
    isFloating: false,
    scale: 1,
    rotation: 0
  });

  const [shake, setShake] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLetterData();

    // Direct Firestore real-time listener
    const unsub = subscribeToLetter(letterId, (liveLetter) => {
      if (liveLetter) {
        setLetter(liveLetter);
        setClicks(liveLetter.currentClicks || 0);
        setStatus(liveLetter.status || 'pending');
        if (liveLetter.status === 'unlocked' && liveLetter.secretMessage) {
          setRevealedMessage(liveLetter.secretMessage);
        }
      }
    });

    return () => unsub();
  }, [letterId]);

  const loadLetterData = async () => {
    try {
      setLoading(true);
      const res = await getLetterDirect(letterId);
      setLetter(res.letter);
      setClicks(res.letter.currentClicks || 0);
      setStatus(res.letter.status || 'pending');
      if (res.letter.secretMessage) {
        setRevealedMessage(res.letter.secretMessage);
      }

      // Record 'opened' event
      sendEventDirect('opened');
    } catch (err: any) {
      setError(err.message || 'Error loading letter');
    } finally {
      setLoading(false);
    }
  };

  const sendEventDirect = async (type: 'opened' | 'click_love' | 'click_hate' | 'heartbeat' | 'leave', coords?: { x: number; y: number }) => {
    try {
      const updated = await pushLetterEventDirect(letterId, { type, coords });
      if (updated.status === 'unlocked' && updated.secretMessage) {
        setRevealedMessage(updated.secretMessage);
      }
    } catch (e) {
      // Fallback to REST API if any
      fetch(`/api/letters/${letterId}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, coords })
      }).catch(() => {});
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    function fire(particleRatio: number, opts: any) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleLoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'unlocked' || status === 'rejected') return;

    const nextClick = clicks + 1;
    setClicks(nextClick);

    if (soundEnabled) {
      sound.playLovePop(1 + (nextClick / _REQ_VAL) * 0.8);
      setTimeout(() => sound.playBoing(), 70);
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const hX = e.clientX - rect.left;
      const hY = e.clientY - rect.top;
      setFloatingHearts((prev) => [
        ...prev.slice(-10),
        { id: Date.now() + Math.random(), x: hX, y: hY, size: Math.random() * 12 + 16 }
      ]);
    }

    // Check if target threshold met
    if (nextClick >= _REQ_VAL) {
      setStatus('unlocked');
      sendEventDirect('click_love');
      if (soundEnabled) sound.playVictoryHarp();
      triggerConfetti();
      setTimeout(() => loadLetterData(), 300);
      return;
    }

    // Random safe position
    const randX = Math.floor(Math.random() * 70) + 12;
    const randY = Math.floor(Math.random() * 64) + 16;

    let scale = 1;
    if (nextClick <= 4) scale = 0.95;
    else if (nextClick <= 10) scale = 0.82;
    else if (nextClick <= 16) scale = 0.70;
    else if (nextClick <= 21) scale = 0.60;
    else scale = 0.52;

    const randRot = Math.floor(Math.random() * 30) - 15;

    setLoveBtnPos({
      x: randX,
      y: randY,
      isFloating: true,
      scale,
      rotation: randRot
    });

    sendEventDirect('click_love', { x: randX, y: randY });
  };

  const handleHateClick = () => {
    if (status === 'unlocked' || status === 'rejected') return;
    setStatus('rejected');
    setShake(true);
    setTimeout(() => setShake(false), 800);
    if (soundEnabled) sound.playHateRejection();
    sendEventDirect('click_hate');
  };

  const getEncouragement = () => {
    if (lang === 'bn') {
      if (clicks === 0) return 'চিঠিটি খুলতে নিচে তোমার সত্যি অনুভূতিটি খুঁজে বের করো...';
      if (clicks < 5) return `বাহ্! খোঁজা শুরু হয়েছে (${clicks} বার পেয়েছো)। আরও খুঁজে দেখো!`;
      if (clicks < 12) return `উফ্! পালিয়ে যাচ্ছে কিন্তু তুমি থামছো না (${clicks} বার)! 🏃‍♂️`;
      if (clicks < 18) return `হাত ব্যথা হয়ে গেল নাকি?! সত্যি ভালো না বাসলে এতবার খুঁজতে না (${clicks} বার)! 😉`;
      if (clicks < 24) return `ধৈর্য্যের পরীক্ষা চলছে! একদম ছোট হয়ে লুকিয়ে আছে (${clicks} বার)! 🔍`;
      return 'অভিনন্দন! চিঠি খুলে গেছে! 🎉';
    } else {
      if (clicks === 0) return 'Find your true feelings below to unlock the envelope...';
      if (clicks < 5) return `Great start! (${clicks} found). Keep hunting!`;
      if (clicks < 12) return `Dodging away, but you keep going (${clicks} found)! 🏃‍♂️`;
      if (clicks < 18) return `Tired fingers? True dedication proves true love (${clicks} found)! 😉`;
      if (clicks < 24) return `Almost there! Hidden in microscopic disguise (${clicks} found)! 🔍`;
      return 'Congratulations! The letter is unlocked! 🎉';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 p-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-rose-500 mb-4"
        >
          <Mail className="w-16 h-16" />
        </motion.div>
        <p className="text-rose-800 font-semibold text-lg animate-pulse">
          {lang === 'bn' ? 'চিঠি লোড হচ্ছে...' : 'Loading letter...'}
        </p>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-rose-100">
          <HeartCrack className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">{lang === 'bn' ? 'চিঠি খুঁজে পাওয়া যায়নি!' : 'Letter Not Found!'}</h2>
          <p className="text-slate-600 mb-6">{error || (lang === 'bn' ? 'সম্ভবত লিংকটি ভুল বা মেয়াদ শেষ।' : 'Invalid link or expired.')}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-medium px-5 py-2.5 rounded-full transition shadow-md"
          >
            {lang === 'bn' ? 'নতুন চিঠি তৈরি করুন' : 'Create New Letter'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-700 ${
        status === 'rejected'
          ? 'bg-gradient-to-b from-slate-900 via-rose-950 to-slate-950 text-white'
          : status === 'unlocked'
          ? 'bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 text-slate-900'
          : 'bg-gradient-to-br from-rose-100 via-pink-100 to-rose-200 text-slate-800'
      }`}
    >
      {/* Top Navbar with Language Toggle and Sound Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <LanguageToggle currentLang={lang} onToggle={(newLang) => setLang(newLang)} />
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="pointer-events-auto p-2.5 rounded-full bg-white/70 backdrop-blur-md text-slate-700 shadow-sm border border-rose-200/50 hover:bg-white transition"
          title={soundEnabled ? t.soundOn : t.soundOff}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-rose-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
        </button>
      </div>

      {/* Floating mini hearts animation on click */}
      {floatingHearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0.5, x: h.x, y: h.y }}
          animate={{ opacity: 0, scale: 1.8, y: h.y - 100, x: h.x + (Math.random() * 40 - 20) }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="pointer-events-none absolute z-40 text-rose-500"
          style={{ width: h.size, height: h.size }}
        >
          <Heart fill="currentColor" />
        </motion.div>
      ))}

      {/* Main Container */}
      <div className={`w-full max-w-lg mx-auto flex flex-col items-center transition-transform duration-200 ${shake ? 'animate-bounce' : ''}`}>

        {/* Header Ribbon / Greeting */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-5 mt-6"
        >
          {/* Mystery warning banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs sm:text-sm font-bold shadow-sm mb-3">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
            <span>{t.victimMysteryNotice}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-['Playfair_Display',serif]">
            {letter.recipientName} {t.forLetter}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t.fromLabel} <span className="font-semibold text-rose-600">{letter.senderName}</span></p>
        </motion.div>

        {/* 3D Envelope & Letter Display */}
        <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center my-2">
          
          {/* Unlocked Letter View */}
          <AnimatePresence>
            {status === 'unlocked' && (
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="w-full bg-[#fdfbf7] p-6 sm:p-8 rounded-2xl shadow-2xl border-4 border-rose-200/90 text-slate-800 relative z-30"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>{t.unlockedBadge}</span>
                </div>

                <div className="border border-rose-200 rounded-xl p-5 bg-white/90 shadow-inner">
                  <div className="flex justify-between items-center border-b border-rose-100 pb-2 mb-4">
                    <span className="text-xs text-rose-500 font-bold tracking-widest uppercase">💌 {t.secretPreview}</span>
                    <span className="text-xs text-emerald-600 font-bold">{t.unlockedSub}</span>
                  </div>

                  <p className="text-sm font-semibold text-rose-700 mb-2">{letter.recipientName},</p>
                  
                  <div className="text-base sm:text-lg text-slate-800 leading-relaxed font-normal whitespace-pre-wrap py-2 font-['Playfair_Display',serif]">
                    "{revealedMessage || 'I love you more than words can say! ❤️'}"
                  </div>

                  <div className="text-right mt-4 pt-3 border-t border-rose-100">
                    <p className="text-xs text-slate-500">{t.foreverLove}</p>
                    <p className="text-base font-bold text-rose-600 font-['Dancing_Script',cursive]">{letter.senderName}</p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium border border-emerald-200">
                    {t.congratsMsg}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rejected Screen View */}
          <AnimatePresence>
            {status === 'rejected' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-red-500/40 text-center text-white relative z-30"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-4 bg-red-950/80 rounded-full flex items-center justify-center border-2 border-red-500"
                >
                  <HeartCrack className="w-12 h-12 text-red-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-red-400 mb-1">{t.rejectedTitle}</h2>
                <p className="text-slate-300 text-sm mb-4">
                  {t.rejectedDesc}
                </p>
                <div className="bg-red-950/40 border border-red-900 rounded-lg p-3 text-xs text-red-200 mb-4">
                  {t.rejectedNotice}
                </div>
                <button
                  onClick={() => {
                    setStatus('pending');
                    setClicks(0);
                    setLoveBtnPos({ x: 0, y: 0, isFloating: false, scale: 1, rotation: 0 });
                  }}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t.tryAgain}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sealed Envelope Graphic */}
          {status !== 'unlocked' && status !== 'rejected' && (
            <div className="relative w-72 sm:w-84 h-48 sm:h-56 bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 rounded-2xl shadow-2xl p-4 flex flex-col justify-between border-2 border-rose-300/60 overflow-hidden transform transition hover:scale-[1.02]">
              <div
                className="absolute top-0 left-0 right-0 h-28 bg-rose-600/40 pointer-events-none"
                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
              />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className="w-14 h-14 bg-gradient-to-br from-red-600 to-rose-700 rounded-full shadow-lg border-2 border-amber-300 flex items-center justify-center cursor-default"
                >
                  <Heart className="w-8 h-8 text-amber-200 fill-amber-200" />
                </motion.div>
                <span className="text-[11px] font-bold text-amber-200 mt-1 drop-shadow bg-black/20 px-2 py-0.5 rounded-full">
                  {t.sealedLetter}
                </span>
              </div>

              <div className="relative z-0 text-white/90">
                <span className="text-[10px] uppercase tracking-wider text-rose-200 block">{t.recipientTag}</span>
                <span className="text-sm font-bold truncate block">{letter.recipientName}</span>
              </div>

              <div className="relative z-0 text-right text-white/80">
                <span className="text-[10px] uppercase tracking-wider text-rose-200 block">{t.senderTag}</span>
                <span className="text-xs font-semibold truncate block">{letter.senderName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress & Encouragement Section (WITHOUT any filling progress bar line) */}
        {status !== 'unlocked' && status !== 'rejected' && (
          <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-rose-200 mb-6 text-center">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
              <span>{t.timesFound}</span>
              <span className="text-rose-600 font-bold">{clicks} {t.foundTimes}</span>
            </div>

            <p className="text-xs text-rose-800/90 font-medium mt-1">
              {getEncouragement()}
            </p>
          </div>
        )}

        {/* Decision & Action Area */}
        {status !== 'unlocked' && status !== 'rejected' && (
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            
            {/* The Big "I hate you" Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleHateClick}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-rose-200 hover:text-white font-bold text-sm sm:text-base shadow-lg border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <HeartCrack className="w-5 h-5 text-red-500" />
              <span>{t.hateBtn}</span>
            </motion.button>

            {/* Static Initial "I love you" Button (Before first click) */}
            {!loveBtnPos.isFloating && (
              <div className="flex flex-col items-center mt-2">
                <span className="text-[11px] text-slate-500 mb-1 animate-pulse">
                  {t.tinyHint}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLoveClick}
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold shadow-md border border-rose-300 flex items-center gap-1.5 cursor-pointer animate-bounce"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>{t.loveBtn}</span>
                </motion.button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating / Teleporting "I love you" Button */}
      {status !== 'unlocked' && status !== 'rejected' && loveBtnPos.isFloating && (
        <motion.div
          animate={{
            left: `${loveBtnPos.x}%`,
            top: `${loveBtnPos.y}%`,
            scale: loveBtnPos.scale,
            rotate: loveBtnPos.rotation
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25
          }}
          className="fixed z-50 cursor-pointer select-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <motion.button
            whileHover={{ scale: 1.25, rotate: [0, -10, 10, 0] }}
            whileTap={{ scale: 0.8 }}
            onClick={handleLoveClick}
            className={`font-extrabold rounded-full shadow-2xl flex items-center gap-1 transition-all duration-150 border active:ring-2 active:ring-pink-300 ${
              clicks > 18
                ? 'bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 text-[10px] border-white/60 shadow-rose-500/50'
                : clicks > 10
                ? 'bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 text-xs border-pink-200 shadow-pink-500/40'
                : 'bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 text-xs sm:text-sm border-rose-200'
            }`}
          >
            <Heart className="w-3 h-3 fill-current animate-pulse" />
            <span>{t.loveBtn}</span>
          </motion.button>
        </motion.div>
      )}

      {/* Footer Branding Note */}
      <div className="mt-8 text-center text-[11px] text-slate-500">
        {t.footerNote}
      </div>
    </div>
  );
};
