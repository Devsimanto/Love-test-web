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
  adminToken?: string;
  recipientName: string;
  senderName: string;
  secretMessage?: string;
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
