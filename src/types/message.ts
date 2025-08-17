export interface Attachment {
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size?: number;
  data?: string; // Base64 encoded data for inline display
}

export interface Mention {
  userId: string;
  username: string;
}

export interface Reaction {
  emoji: string;
  users: { _id: string; username: string; avatarUrl?: string }[];
}

export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  channelId?: string;
  serverId?: string;
  directMessageId?: string;
  attachments?: Attachment[];
  mentions?: Mention[];
  reactions: Reaction[];
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
  isEdited: boolean;
  isPinned: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt: string;
}