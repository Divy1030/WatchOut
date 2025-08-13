export interface Attachment {
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size?: number;
}

export interface Mention {
  userId: string;
  username: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
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
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}