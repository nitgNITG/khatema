export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type KhatmaType = 'INDIVIDUAL' | 'COLLECTIVE';
export type KhatmaStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
export type KhatmaVisibility = 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';
export type PartStatus = 'AVAILABLE' | 'RESERVED' | 'COMPLETED';
export type ParticipantStatus = 'PENDING' | 'ACTIVE' | 'LEFT' | 'KICKED';

export interface User {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface QuranPart {
  id: string;
  partNumber: number;
  status: PartStatus;
  reservedBy?: { id: string; displayName: string; avatarUrl?: string };
  completedAt?: string;
}

export interface Khatma {
  id: string;
  title: string;
  description?: string;
  type: KhatmaType;
  status: KhatmaStatus;
  visibility: KhatmaVisibility;
  requireApproval: boolean;
  allowRepeat: boolean;
  isContinuous: boolean;
  maxMembers?: number;
  shareCode: string;
  startDate?: string;
  endDate?: string;
  completionPercentage: number;
  totalParts: number;
  completedParts: number;
  participantCount: number;
  creator: { id: string; displayName: string; avatarUrl?: string };
  parts?: QuranPart[];
  iteration: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  khatmaId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
