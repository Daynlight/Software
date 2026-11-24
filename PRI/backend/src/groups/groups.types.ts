import { JoinRequestStatus } from '../database/join_requests/join-requests.entity';
import { GroupWarning } from './groups.constants';

export interface GroupLeader {
  id: string;
  firstName: string;
  lastName: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  leader: GroupLeader;
  memberCount: number;
  maxMembers: number;
  recommendedMembers: number;
  freeSlots: number;
  isFull: boolean;
  isLarge: boolean;
  createdAt: Date;
  isMember: boolean;
  myRequestStatus: JoinRequestStatus | null;
}

export interface JoinRequestUser {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string | null;
}

export interface JoinRequestView {
  id: string;
  status: JoinRequestStatus;
  createdAt: Date;
  decidedAt: Date | null;
  user: JoinRequestUser;
}

export interface JoinRequestResult {
  request: JoinRequestView;
  warnings: GroupWarning[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
