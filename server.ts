import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Persistent store directory
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'letters.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface LetterEvent {
  id: string;
  type: 'opened' | 'click_love' | 'click_hate' | 'unlocked' | 'rage_quit' | 'heartbeat';
  count: number;
  percentage: number;
  timestamp: number;
  message?: string;
  coords?: { x: number; y: number };
}

export interface LetterData {
  id: string;
  adminToken: string;
  recipientName: string;
  senderName: string;
  secretMessage: string;
  theme: 'romantic_rose' | 'vintage_gold' | 'midnight_purple' | 'sunset_glow';
  targetClicks: number;
  currentClicks: number;
  percentage: number;
  status: 'pending' | 'in_progress' | 'unlocked' | 'rejected';
  createdAt: number;
  lastActive: number;
  isOnline: boolean;
  events: LetterEvent[];
}

let lettersCache: Record<string, LetterData> = {};

// Load letters from disk if available
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    lettersCache = JSON.parse(raw);
  }
} catch (err) {
  console.error('Failed to load letters from disk:', err);
  lettersCache = {};
}

function saveLettersToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(lettersCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save letters to disk:', err);
  }
}

// SSE clients map by letter id
const sseClients: Record<string, Set<Response>> = {};

function notifyLetterSubscribers(letterId: string, eventData: any) {
  const clients = sseClients[letterId];
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(eventData)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch (e) {
        clients.delete(res);
      }
    }
  }
}

// API Routes
app.post('/api/letters', (req: Request, res: Response) => {
  const { recipientName, senderName, secretMessage, theme, targetClicks } = req.body;
  const id = Math.random().toString(36).substring(2, 10);
  const adminToken = Math.random().toString(36).substring(2, 14);

  const newLetter: LetterData = {
    id,
    adminToken,
    recipientName: (recipientName || 'আমার প্রিয় মানুষ').trim(),
    senderName: (senderName || 'তোমার গোপন প্রেমিক').trim(),
    secretMessage: (secretMessage || 'তুমি আমার জীবনের সবচেয়ে সুন্দর উপহার। তোমাকে অনেক বেশি ভালোবাসি! ❤️').trim(),
    theme: theme || 'romantic_rose',
    targetClicks: typeof targetClicks === 'number' && targetClicks > 0 ? targetClicks : 25,
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
        message: 'চিঠি তৈরি করা হয়েছে।'
      }
    ]
  };

  lettersCache[id] = newLetter;
  saveLettersToDisk();

  res.json({
    success: true,
    letter: newLetter
  });
});

app.get('/api/letters/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const token = req.query.token as string | undefined;

  const letter = lettersCache[id];
  if (!letter) {
    return res.status(404).json({ error: 'চিঠি খুঁজে পাওয়া যায়নি!' });
  }

  const isAdmin = token && token === letter.adminToken;

  // If not admin and not unlocked yet, hide secretMessage!
  if (!isAdmin && letter.status !== 'unlocked') {
    const { secretMessage, adminToken, ...safeLetter } = letter;
    return res.json({
      success: true,
      letter: safeLetter,
      isAdmin: false
    });
  }

  res.json({
    success: true,
    letter,
    isAdmin: !!isAdmin
  });
});

// SSE endpoint for live updates
app.get('/api/letters/:id/stream', (req: Request, res: Response) => {
  const { id } = req.params;
  const letter = lettersCache[id];
  if (!letter) {
    return res.status(404).json({ error: 'চিঠি পাওয়া যায়নি' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!sseClients[id]) {
    sseClients[id] = new Set();
  }
  sseClients[id].add(res);

  // Send initial state
  res.write(`data: ${JSON.stringify({ type: 'init', letter })}\n\n`);

  req.on('close', () => {
    sseClients[id]?.delete(res);
  });
});

// Record victim events
app.post('/api/letters/:id/event', (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, coords } = req.body;

  const letter = lettersCache[id];
  if (!letter) {
    return res.status(404).json({ error: 'চিঠি পাওয়া যায়নি' });
  }

  letter.lastActive = Date.now();
  letter.isOnline = true;

  if (type === 'opened') {
    if (letter.status === 'pending') {
      letter.status = 'in_progress';
    }
    const evt: LetterEvent = {
      id: Math.random().toString(36).substring(2, 8),
      type: 'opened',
      count: letter.currentClicks,
      percentage: letter.percentage,
      timestamp: Date.now(),
      message: 'ভিকটিম চিঠিটি ওপেন করেছে!'
    };
    letter.events.unshift(evt);
    notifyLetterSubscribers(id, { type: 'event', event: evt, letter });
    saveLettersToDisk();
    return res.json({ success: true, letter });
  }

  if (type === 'click_love') {
    if (letter.status !== 'unlocked' && letter.status !== 'rejected') {
      letter.currentClicks = Math.min(letter.targetClicks, letter.currentClicks + 1);
      letter.percentage = Math.round((letter.currentClicks / letter.targetClicks) * 100);

      let msg = `${letter.currentClicks}/${letter.targetClicks} বার I love you ক্লিক করেছে (${letter.percentage}%)`;
      if (letter.currentClicks >= letter.targetClicks) {
        letter.status = 'unlocked';
        letter.percentage = 100;
        msg = `🎉 সম্পূর্ণ ২৫ বার ক্লিক করেছে! চিঠি আনলক হয়েছে (১০০% লাভ)!`;
      }

      const evt: LetterEvent = {
        id: Math.random().toString(36).substring(2, 8),
        type: letter.currentClicks >= letter.targetClicks ? 'unlocked' : 'click_love',
        count: letter.currentClicks,
        percentage: letter.percentage,
        timestamp: Date.now(),
        message: msg,
        coords
      };
      letter.events.unshift(evt);
      if (letter.events.length > 50) letter.events.pop();

      notifyLetterSubscribers(id, { type: 'event', event: evt, letter });
      saveLettersToDisk();
    }
    return res.json({ success: true, letter });
  }

  if (type === 'click_hate') {
    letter.status = 'rejected';
    letter.percentage = 0;

    const evt: LetterEvent = {
      id: Math.random().toString(36).substring(2, 8),
      type: 'click_hate',
      count: letter.currentClicks,
      percentage: 0,
      timestamp: Date.now(),
      message: `💔 I hate you তে ক্লিক করেছে! ভালোবাসা ০% এ নেমে গেছে!`
    };
    letter.events.unshift(evt);
    if (letter.events.length > 50) letter.events.pop();

    notifyLetterSubscribers(id, { type: 'event', event: evt, letter });
    saveLettersToDisk();
    return res.json({ success: true, letter });
  }

  if (type === 'heartbeat') {
    letter.lastActive = Date.now();
    letter.isOnline = true;
    return res.json({ success: true });
  }

  if (type === 'leave') {
    letter.isOnline = false;
    const evt: LetterEvent = {
      id: Math.random().toString(36).substring(2, 8),
      type: 'rage_quit',
      count: letter.currentClicks,
      percentage: letter.percentage,
      timestamp: Date.now(),
      message: `ভিকটিম পেজ ছেড়ে চলে গেছে! শেষ স্কোর: ${letter.percentage}%`
    };
    letter.events.unshift(evt);
    notifyLetterSubscribers(id, { type: 'event', event: evt, letter });
    saveLettersToDisk();
    return res.json({ success: true, letter });
  }

  res.json({ success: true, letter });
});

// Admin reset action
app.post('/api/letters/:id/reset', (req: Request, res: Response) => {
  const { id } = req.params;
  const { token } = req.body;

  const letter = lettersCache[id];
  if (!letter) {
    return res.status(404).json({ error: 'চিঠি পাওয়া যায়নি' });
  }
  if (letter.adminToken !== token) {
    return res.status(403).json({ error: 'অনুমতি নেই' });
  }

  letter.currentClicks = 0;
  letter.percentage = 0;
  letter.status = 'pending';
  letter.events = [
    {
      id: Math.random().toString(36).substring(2, 8),
      type: 'opened',
      count: 0,
      percentage: 0,
      timestamp: Date.now(),
      message: 'এডমিন টেস্ট রিসেট করেছে।'
    }
  ];

  notifyLetterSubscribers(id, { type: 'reset', letter });
  saveLettersToDisk();
  res.json({ success: true, letter });
});

// Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
