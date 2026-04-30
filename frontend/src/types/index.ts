export interface User {
  id: string;
  kakaoId: string;
  nickname: string | null;
  email: string | null;
  profileImage: string | null;
  bio: string | null;
  region: string | null;
  instruments: string[];
  videoUrls: string[];
  noteGrade: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
  trustScore: number;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  instruments: string[];
  region: string | null;
  payType: 'HOURLY' | 'PER_SESSION' | 'MONTHLY' | 'NEGOTIABLE';
  payMin: number;
  payMax: number | null;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  viewCount: number;
  status: 'ACTIVE' | 'CLOSED' | 'HIDDEN';
  author: User;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  postId: string | null;
  sender: User;
  receiver: User;
  lastMessage: string | null;
  lastMessageAt: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: User;
  content: string;
  isRead: boolean;
  createdAt: string;
}
