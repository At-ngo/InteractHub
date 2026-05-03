export interface Experience {
  id: number;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentJob: boolean;
  description?: string;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  lastActiveAt?: string;
  createdAt: string;
  postCount: number;
  friendCount: number;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
}

export interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  createdAt: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  hashtags: string[];
  commentPermission: string;
  // share/repost metadata
  isShare?: boolean;
  sharedPost?: {
    id: number;
    userId: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    content: string;
    imageUrl?: string;
  } | null;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  reactionCount?: number;
  userReaction?: string | null;
  replies?: Comment[];
}

export interface Notification {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  lastActiveAt?: string;
  gitHubUrl?: string;
  websiteUrl?: string;
  linkedInUrl?: string;
  createdAt: string;
  postCount: number;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isConnected: boolean;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
}
