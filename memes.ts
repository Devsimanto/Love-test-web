export interface MemeItem {
  id: string;
  trigger: 'hate' | 'love_milestone' | 'unlock' | 'rage_quit' | 'general';
  title: string;
  subtitle: string;
  emoji: string;
  soundType: 'emotional_damage' | 'airhorn' | 'fail' | 'wow' | 'boing' | 'heartbreak';
  color: string;
}

export const MEMES: MemeItem[] = [
  // When victim clicks I hate you (0% love)
  {
    id: 'hate_crying_cat',
    trigger: 'hate',
    title: '💔 এক ক্লিকেই সব শেষ! ০% লাভ!',
    subtitle: 'ইমোশনাল ড্যামেজ! এক ফোটা চোখের জল ফেলে I hate you তে চাপ দিয়ে দিলো!',
    emoji: '😿💔💀',
    soundType: 'emotional_damage',
    color: 'from-red-600 to-rose-950'
  },
  {
    id: 'hate_hamster',
    trigger: 'hate',
    title: '😭 কষ্টে বুকটা ফাইটা গেল!',
    subtitle: 'যে গাছে ফুল ফুটে না, সে গাছে জল ঢেলে কোনো লাভ নেই!',
    emoji: '🐹🥺🥀',
    soundType: 'fail',
    color: 'from-amber-700 to-red-900'
  },
  {
    id: 'hate_cid',
    trigger: 'hate',
    title: '🚨 এ কেমন অবিচার?!',
    subtitle: 'দয়া, কিছু তো গড়বড় আছে! এতো সুন্দর চিঠি না খুলেই রিজেক্ট?!',
    emoji: '👮‍♂️🔍⚠️',
    soundType: 'heartbreak',
    color: 'from-zinc-800 to-red-900'
  },

  // When victim is searching and clicking (In progress)
  {
    id: 'searching_cid',
    trigger: 'love_milestone',
    title: '🕵️‍♂️ হন্যে হয়ে খুঁজছে!',
    subtitle: 'কোথায় গেল সেই ছোট "I love you" বোতামটা?! চোখ বড় বড় করে স্ক্রিন ঘষছে!',
    emoji: '👀📱🔎',
    soundType: 'boing',
    color: 'from-sky-700 to-indigo-900'
  },
  {
    id: 'patience_test',
    trigger: 'love_milestone',
    title: '💪 হাল ছাড়েনি এখনও!',
    subtitle: 'পাগলের মতো খুঁজে খুঁজে চাপ দিচ্ছে! এ তো দেখছি সত্যিকারের পাগল প্রেমিক!',
    emoji: '🔥❤️🏃',
    soundType: 'wow',
    color: 'from-pink-600 to-purple-900'
  },

  // When 25 clicks completed (100% Love)
  {
    id: 'unlock_celebration',
    trigger: 'unlock',
    title: '🏆 ১০০% খাঁটি সোনা প্রেম প্রমাণিত!',
    subtitle: 'মিশন সাকসেস! ২৫ বার খুঁজে খুঁজে বের করেছে! এই যুগে এমন প্রেমিক পাওয়া ভাগ্যের ব্যাপার!',
    emoji: '🎉💍❤️🥂',
    soundType: 'airhorn',
    color: 'from-emerald-600 to-teal-900'
  },
  {
    id: 'unlock_pro_lover',
    trigger: 'unlock',
    title: '👑 প্রো লেভেলের ডেডিকেশন!',
    subtitle: 'চিঠির খাম খুলে গেছে! এডমিনের মন এখন খুশিতে বাগবাগ!',
    emoji: '🥳💃🕺✨',
    soundType: 'wow',
    color: 'from-amber-600 to-rose-700'
  },

  // When victim leaves before 25
  {
    id: 'rage_quit',
    trigger: 'rage_quit',
    title: '🏃‍♂️ ধৈর্য্য কুলালো না! ভেগে গেছে!',
    subtitle: 'বিরক্ত হয়ে পেজ কেটে দিলো! সত্যিকারের ভালোবাসার ধৈর্য্য সবার থাকে না!',
    emoji: '💨🤦‍♂️🥱',
    soundType: 'fail',
    color: 'from-slate-700 to-zinc-900'
  }
];

export function getRandomMeme(trigger: 'hate' | 'love_milestone' | 'unlock' | 'rage_quit'): MemeItem {
  const filtered = MEMES.filter(m => m.trigger === trigger);
  if (filtered.length === 0) return MEMES[0];
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx];
}
