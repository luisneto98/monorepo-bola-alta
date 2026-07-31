export type UserRole = 'ADMIN' | 'PLAYER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PlayerPosition =
  | 'LEVANTADOR'
  | 'PONTEIRO'
  | 'OPOSTO'
  | 'CENTRAL'
  | 'LIBERO'
  | 'INDEFINIDA';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  position: PlayerPosition;
  level: number;
  createdAt?: string;
}

export type GameStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'FINISHED';
export type AttendanceStatus = 'CONFIRMED' | 'WAITLIST' | 'OUT';

export interface GameLocation {
  name: string;
  address?: string;
  mapsUrl?: string;
}

export type GameApproval = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Game {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  location: GameLocation;
  minPlayers: number;
  maxPlayers: number;
  cost: number;
  status: GameStatus;
  notes?: string;
  cancelReason?: string;
  /** Pelada marcada por quem não organiza fica PENDING até um admin liberar. */
  approval: GameApproval;
  requestedBy?: string;
  rejectReason?: string;
  /** Grupo de WhatsApp de onde veio, quando marcada pelo bot. */
  whatsapp?: { chatId: string; groupName?: string };
  confirmedCount: number;
  waitlistCount: number;
  spotsLeft: number;
  missingToConfirm: number;
  costPerPlayer: number;
  paidCount: number;
  totalPaid: number;
  me: {
    status: AttendanceStatus | null;
    paid: boolean;
    waitlistPosition: number | null;
  };
}

export interface GamePlayer {
  /** null quando é convidado — alguém da lista que ainda não tem conta. */
  userId: string | null;
  name: string;
  phone?: string;
  isGuest?: boolean;
  invitedBy?: string | null;
  attendanceId?: string;
  position?: PlayerPosition;
  level?: number;
  status: AttendanceStatus;
  paid: boolean;
  paidAt?: string;
  noShow: boolean;
  order: number;
}

export interface GameDetail extends Game {
  confirmed: GamePlayer[];
  waitlist: GamePlayer[];
  out: GamePlayer[];
}

export interface RankingRow {
  userId: string;
  name: string;
  played: number;
  noShows: number;
  withdrawals: number;
  attendanceRate: number;
  pendingAmount: number;
  pendingGames: number;
}

export interface AdminSummary {
  pendingUsers: number;
  upcomingGames: number;
  finishedGames: number;
  totalPendingAmount: number;
  debtors: RankingRow[];
}

export interface HistoryRow {
  gameId: string;
  title: string;
  date: string;
  gameStatus: GameStatus;
  status: AttendanceStatus;
  paid: boolean;
  noShow: boolean;
}
