export type UserRole = 'admin' | 'author' | 'reader';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type NovelStatus = 'ongoing' | 'completed' | 'hiatus';

export interface Novel {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  author_id: string;
  genre: string | null;
  status: NovelStatus;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  chapter_count?: number;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author_note: string | null;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string | null;
  last_read_at: string;
  // Joined fields
  novel?: Novel;
  chapter?: Chapter;
}

export interface Comment {
  id: string;
  novel_id: string;
  chapter_id: string | null;
  user_id: string;
  content: string;
  selected_text: string | null;
  annotation_start: number | null;
  annotation_end: number | null;
  is_private: boolean;
  parent_id: string | null;
  reply_to_user_id: string | null;
  is_deleted: boolean;
  is_author_note: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  username?: string;
  display_name?: string | null;
  user_avatar?: string | null;
  reply_to_username?: string | null;
  reply_to_display_name?: string | null;
  // Replies (for tree structure)
  replies?: Comment[];
  // For UI state
  isAuthor?: boolean;
}

export interface ChapterRating {
  id: string;
  chapter_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterRatingStats {
  avg_rating: number;
  total_count: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
}

export interface Urging {
  id: string;
  novel_id: string;
  user_id: string;
  created_at: string;
}

export interface ChapterReadStats {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  read_count: number;
}

export interface NovelStats {
  total_reads: number;
  monthly_reads: number;
  daily_reads: number;
  urging_count: number;
}

export interface ChapterCommentCount {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  comment_count: number;
}

export interface ChapterRatingOverview {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  avg_rating: number;
  total_ratings: number;
}

// ========== 新增类型 (v4) ==========

export type UserMode = 'guest' | 'reader' | 'author' | 'admin'

export interface Notification {
  id: string
  user_id: string
  novel_id: string
  type: 'chapter_update' | 'author_reply' | 'system'
  title: string
  content: string | null
  is_read: boolean
  created_at: string
  novel?: { title: string }
}

export interface AuthContextType {
  user: any | null
  profile: Profile | null
  mode: UserMode
  isLoading: boolean
  setMode: (mode: UserMode) => void
  refresh: () => void
}
