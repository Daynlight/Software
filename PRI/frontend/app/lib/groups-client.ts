export type JoinRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export type GroupSort = "createdAt" | "name" | "memberCount" | "freeSlots";

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
  createdAt: string;
  isMember: boolean;
  myRequestStatus: JoinRequestStatus | null;
}

export interface GroupSearchResponse {
  items: GroupSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GroupWarning {
  code: "GROUP_IS_LARGE" | "GROUP_IS_FULL";
  message: string;
}

export interface JoinRequestUser {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string | null;
}

export interface JoinRequest {
  id: string;
  status: JoinRequestStatus;
  createdAt: string;
  decidedAt: string | null;
  user: JoinRequestUser;
}

export interface JoinRequestResult {
  request: JoinRequest;
  warnings: GroupWarning[];
}

export interface JoinRequestListResponse {
  items: JoinRequest[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchGroupsParams {
  search?: string;
  leader?: string;
  hasFreeSlots?: boolean;
  mine?: boolean;
  minFreeSlots?: number;
  page?: number;
  limit?: number;
  sort?: GroupSort;
  order?: "asc" | "desc";
}

export interface CreateGroupInput {
  name: string;
  description: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

export interface ListJoinRequestsParams {
  status?: JoinRequestStatus | "ALL";
  page?: number;
  limit?: number;
}

export class GroupsApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GroupsApiError";
  }
}

const FALLBACK_ERROR = "Nie udało się wykonać operacji. Spróbuj ponownie.";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(" ");
    }

    return body.message ?? FALLBACK_ERROR;
  } catch {
    return FALLBACK_ERROR;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new GroupsApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function searchGroups(
  params: SearchGroupsParams = {},
): Promise<GroupSearchResponse> {
  return apiFetch<GroupSearchResponse>(`/groups${buildQuery(params)}`);
}

export function createGroup(input: CreateGroupInput): Promise<GroupSummary> {
  return apiFetch<GroupSummary>("/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateGroup(
  groupId: string,
  input: UpdateGroupInput,
): Promise<GroupSummary> {
  return apiFetch<GroupSummary>(`/groups/${encodeURIComponent(groupId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function leaveGroup(groupId: string): Promise<void> {
  return apiFetch<void>(`/groups/${encodeURIComponent(groupId)}/leave`, {
    method: "POST",
  });
}

export function requestJoin(groupId: string): Promise<JoinRequestResult> {
  return apiFetch<JoinRequestResult>(
    `/groups/${encodeURIComponent(groupId)}/join-requests`,
    { method: "POST" },
  );
}

export function listJoinRequests(
  groupId: string,
  params: ListJoinRequestsParams = {},
): Promise<JoinRequestListResponse> {
  return apiFetch<JoinRequestListResponse>(
    `/groups/${encodeURIComponent(groupId)}/join-requests${buildQuery(params)}`,
  );
}

export function acceptJoinRequest(
  groupId: string,
  requestId: string,
): Promise<JoinRequestResult> {
  return apiFetch<JoinRequestResult>(
    `/groups/${encodeURIComponent(groupId)}/join-requests/${encodeURIComponent(requestId)}/accept`,
    { method: "POST" },
  );
}

export function rejectJoinRequest(
  groupId: string,
  requestId: string,
): Promise<JoinRequestResult> {
  return apiFetch<JoinRequestResult>(
    `/groups/${encodeURIComponent(groupId)}/join-requests/${encodeURIComponent(requestId)}/reject`,
    { method: "POST" },
  );
}

export async function fetchMyGroup(): Promise<GroupSummary | null> {
  const response = await searchGroups({ mine: true, limit: 1 });

  return response.items[0] ?? null;
}
