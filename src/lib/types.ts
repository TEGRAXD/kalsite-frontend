export type RoleId = "super-administrator" | "administrator" | "user" | string;

export interface RoleSummary {
  id: RoleId;
  name: string;
  description?: string | null;
}

export interface User {
  id: string;
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  roleId: RoleId;
  role?: RoleSummary | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Operator {
  id: string;
  name: string;
  latinName?: string | null;
  cnName: string;
  slug: string;
  rarity: number;
  operatorClass: string;
  branch: string;
  faction?: string | null;
  factionLogoUrl?: string | null;
  gender?: string | null;
  race?: string | null;
  imageUrl: string;
  releaseOrder?: number | null;
  isEnabled?: boolean;
}

export interface PublicOperatorCard {
  id: string;
  name: string;
  latinName?: string | null;
  cnName: string;
  slug: string;
  rarity: number;
  operatorClass: string;
  branch: string;
  faction?: string | null;
  factionLogoUrl?: string | null;
  gender?: string | null;
  race?: string | null;
  imageUrl: string;
}

export function formatOperatorName(op: {
  name: string;
  latinName?: string | null;
}): string {
  const latin = op.latinName?.trim();
  if (latin && latin.toLowerCase() !== op.name.trim().toLowerCase()) {
    return `${op.name} (${latin})`;
  }
  return op.name;
}

export interface RoomSettings {
  maxPlayers: number;
  lives: number;
  turnTimerSeconds: number | null;
  allowPass: boolean;
  maxQuestionsPerTurn: number;
  operatorPool: {
    rarities: number[];
    classes: string[];
  };
}

export const PLAYER_COLORS = [
  { hex: "#34d399", name: "Emerald" },
  { hex: "#38bdf8", name: "Sky" },
  { hex: "#f472b6", name: "Pink" },
  { hex: "#fb923c", name: "Orange" },
  { hex: "#a78bfa", name: "Violet" },
  { hex: "#facc15", name: "Yellow" },
  { hex: "#f87171", name: "Coral" },
  { hex: "#2dd4bf", name: "Teal" },
  { hex: "#818cf8", name: "Indigo" },
  { hex: "#a3e635", name: "Lime" },
] as const;

export interface RoomMemberSummary {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  role: string;
  color: string;
  isReady: boolean;
  isOnline: boolean;
}

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  hostUserId: string;
  hostName: string;
  status: string;
  hasPassword: boolean;
  playerCount: number;
  maxPlayers: number;
  settings: RoomSettings;
  createdAt: string;
}

export interface RoomDetail extends RoomSummary {
  members: RoomMemberSummary[];
  activeGameId: string | null;
  roomPassword?: string | null;
}

export interface FeedItem {
  id: string;
  type:
    | "chat"
    | "clue"
    | "question"
    | "answer"
    | "reaction"
    | "guess"
    | "system"
    | "spectator_chat";
  userId: string | null;
  username: string;
  text: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface ActiveQuestion {
  id: string;
  askerUserId: string;
  askerName: string;
  question: string;
  answers: Record<string, { username: string; value: "yes" | "no" | "unsure" }>;
  createdAt: string;
}

export interface PersonalizedGamePlayer {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  color: string;
  seatOrder: number;
  livesRemaining: number;
  guessedAt: string | null;
  eliminatedAt: string | null;
  isSelf: boolean;
  isTurn: boolean;
  operatorHidden: boolean;
  operator: PublicOperatorCard | null;
}

export interface PersonalizedGameState {
  gameId: string;
  roomId: string;
  roomCode: string;
  status: "active" | "ended";
  currentTurnUserId: string | null;
  turnNumber: number;
  turnDeadlineAt: string | null;
  settings: RoomSettings;
  players: PersonalizedGamePlayer[];
  isSpectator: boolean;
  feed: FeedItem[];
  spectatorFeed: FeedItem[];
  activeQuestion: ActiveQuestion | null;
  questionsAskedThisTurn: number;
  startedAt: string;
  endedAt: string | null;
}

export interface GuessResultEvent {
  userId: string;
  username: string;
  guessedOperatorName: string;
  correct: boolean;
  livesRemaining: number;
  eliminated: boolean;
  revealedOperator: PublicOperatorCard | null;
}
