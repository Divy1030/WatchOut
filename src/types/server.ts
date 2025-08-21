export interface Member {
  userId: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: string;
    customStatus?: string;
  };
  roles: string[];
  nickname?: string;
  joinedAt: string;
}

export interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  position: number;
  isPrivate: boolean;
  allowedRoles?: string[];
  allowedUsers?: string[];
}

export interface Role {
  name: string;
  color: string;
  permissions: string[];
  position: number;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
}

export interface Server {
  _id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  owner: string;
  channels: Channel[];
  roles: Role[];
  memberCount?: number;
  userRoles?: string[];
  members: Member[];
  invites?: InviteCode[];
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  isArchived?: boolean;
   replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    };
  };
}