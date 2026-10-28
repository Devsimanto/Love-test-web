import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { LetterData, LetterEvent } from '../types';

// Obfuscation helper: hides secret message from plain text inspection
const _SALT = 'love_secret_2026_';
export function encodeSecret(text: string, key: string): string {
  try {
    const combinedKey = _SALT + key;
    let res = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
      res += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(res));
  } catch (e) {
    return text;
  }
}

export function decodeSecret(encoded: string, key: string): string {
  try {
    const raw = decodeURIComponent(atob(encoded));
    const combinedKey = _SALT + key;
    let res = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
      res += String.fromCharCode(charCode);
    }
    return res;
  } catch (e) {
    return encoded;
  }
}

// Obfuscated click constant (25 = 0x19)
export const _REQ_VAL = 0x19;

// Create Letter directly in Firestore
export async function createLetterDirect(params: {
  recipientName: string;
  senderName: string;
  secretMessage: string;
  theme?: string;
}): Promise<LetterData> {
  const id = Math.random().toString(36).substring(2, 10);
  const adminToken = Math.random().toString(36).substring(2, 14);

  const encodedMsg = encodeSecret(params.secretMessage.trim(), adminToken);

  const newLetter: LetterData = {
    id,
    adminToken,
    recipientName: params.recipientName.trim(),
    senderName: (params.senderName || 'Secret Admirer').trim(),
    secretMessage: encodedMsg,
    theme: (params.theme as any) || 'romantic_rose',
    targetClicks: _REQ_VAL,
    currentClicks: 0,
    percentage: 0,
    status: 'pending',
    createdAt: Date.now(),
    lastActive: Date.now(),
    isOnline: false,
    events: [
      {
        id: Math.random().toString(36).substring(2, 8),
        type: 'opened',
        count: 0,
        percentage: 0,
        timestamp: Date.now(),
        message: 'চিঠি তৈরি করা হয়েছে / Letter created.'
      }
    ]
  };

  const letterRef = doc(db, 'letters', id);
  await setDoc(letterRef, newLetter);

  // Also cache locally in case user is offline
  try {
    localStorage.setItem(`letter_${id}`, JSON.stringify(newLetter));
  } catch (e) {}

  return newLetter;
}

// Fetch Letter directly from Firestore
export async function getLetterDirect(id: string, token?: string): Promise<{ letter: LetterData; isAdmin: boolean }> {
  const letterRef = doc(db, 'letters', id);
  const snap = await getDoc(letterRef);

  let rawLetter: LetterData;
  if (snap.exists()) {
    rawLetter = snap.data() as LetterData;
  } else {
    // Check fallback local storage
    const cached = localStorage.getItem(`letter_${id}`);
    if (cached) {
      rawLetter = JSON.parse(cached);
    } else {
      throw new Error('Letter not found / চিঠি খুঁজে পাওয়া যায়নি');
    }
  }

  const isAdmin = !!(token && token === rawLetter.adminToken);

  // Decode secret if unlocked or if admin
  let displayedMessage = '';
  if (rawLetter.status === 'unlocked' || isAdmin) {
    displayedMessage = decodeSecret(rawLetter.secretMessage || '', rawLetter.adminToken || '');
  }

  return {
    letter: {
      ...rawLetter,
      secretMessage: displayedMessage
    },
    isAdmin
  };
}

// Push Event directly to Firestore
export async function pushLetterEventDirect(
  id: string,
  event: {
    type: 'opened' | 'click_love' | 'click_hate' | 'heartbeat' | 'leave';
    coords?: { x: number; y: number };
  }
): Promise<LetterData> {
  const letterRef = doc(db, 'letters', id);
  const snap = await getDoc(letterRef);

  if (!snap.exists()) {
    throw new Error('Letter does not exist');
  }

  const current = snap.data() as LetterData;
  const updates: Partial<LetterData> = {
    lastActive: Date.now(),
    isOnline: event.type !== 'leave'
  };

  let newEvent: LetterEvent | null = null;

  if (event.type === 'click_love') {
    if (current.status !== 'unlocked' && current.status !== 'rejected') {
      const nextClicks = Math.min(_REQ_VAL, current.currentClicks + 1);
      const nextPercent = Math.round((nextClicks / _REQ_VAL) * 100);

      updates.currentClicks = nextClicks;
      updates.percentage = nextPercent;

      if (nextClicks >= _REQ_VAL) {
        updates.status = 'unlocked';
        updates.percentage = 100;
        newEvent = {
          id: Math.random().toString(36).substring(2, 8),
          type: 'unlocked',
          count: nextClicks,
          percentage: 100,
          timestamp: Date.now(),
          message: '🎉 সম্পূর্ণ হয়েছে! চিঠি আনলকড (১০০% লাভ)! / Unlocked 100%!',
          coords: event.coords
        };
      } else {
        updates.status = 'in_progress';
        newEvent = {
          id: Math.random().toString(36).substring(2, 8),
          type: 'click_love',
          count: nextClicks,
          percentage: nextPercent,
          timestamp: Date.now(),
          message: `${nextClicks}/${_REQ_VAL} বার ক্লিক করেছে (${nextPercent}%)`,
          coords: event.coords
        };
      }
    }
  } else if (event.type === 'click_hate') {
    updates.status = 'rejected';
    updates.percentage = 0;
    newEvent = {
      id: Math.random().toString(36).substring(2, 8),
      type: 'click_hate',
      count: current.currentClicks,
      percentage: 0,
      timestamp: Date.now(),
      message: '💔 I hate you তে ক্লিক করেছে! স্কোর ০%! / Clicked I hate you! 0%!'
    };
  } else if (event.type === 'opened') {
    if (current.status === 'pending') {
      updates.status = 'in_progress';
    }
    newEvent = {
      id: Math.random().toString(36).substring(2, 8),
      type: 'opened',
      count: current.currentClicks,
      percentage: current.percentage,
      timestamp: Date.now(),
      message: 'ভিকটিম চিঠি ওপেন করেছে! / Opened letter!'
    };
  } else if (event.type === 'leave') {
    newEvent = {
      id: Math.random().toString(36).substring(2, 8),
      type: 'rage_quit',
      count: current.currentClicks,
      percentage: current.percentage,
      timestamp: Date.now(),
      message: `পেজ বন্ধ করেছে! স্কোর: ${current.percentage}% / Left page`
    };
  }

  if (newEvent) {
    updates.events = [newEvent, ...(current.events || []).slice(0, 40)];
  }

  await updateDoc(letterRef, updates);

  return {
    ...current,
    ...updates
  };
}

// Reset Letter (Admin action)
export async function resetLetterDirect(id: string, token: string): Promise<void> {
  const letterRef = doc(db, 'letters', id);
  const snap = await getDoc(letterRef);
  if (!snap.exists()) return;
  const current = snap.data() as LetterData;
  if (current.adminToken !== token) return;

  await updateDoc(letterRef, {
    currentClicks: 0,
    percentage: 0,
    status: 'pending',
    events: [
      {
        id: Math.random().toString(36).substring(2, 8),
        type: 'opened',
        count: 0,
        percentage: 0,
        timestamp: Date.now(),
        message: 'এডমিন টেস্ট রিসেট করেছে / Reset by Admin.'
      }
    ]
  });
}
