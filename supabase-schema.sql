-- =============================================
-- Novel Hub Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Profiles table (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'author', 'reader')),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'reader')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Novels table
-- =============================================
CREATE TABLE public.novels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published novels are visible to all" ON public.novels
  FOR SELECT USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "Authors can create novels" ON public.novels
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own novels" ON public.novels
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own novels" ON public.novels
  FOR DELETE USING (auth.uid() = author_id);

-- =============================================
-- Chapters table
-- =============================================
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(novel_id, chapter_number)
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published chapters are visible to all" ON public.chapters
  FOR SELECT USING (
    is_published = true
    OR EXISTS (SELECT 1 FROM public.novels WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid())
  );

CREATE POLICY "Authors can create chapters" ON public.chapters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid())
  );

CREATE POLICY "Authors can update own chapters" ON public.chapters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid())
  );

CREATE POLICY "Authors can delete own chapters" ON public.chapters
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.novels WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid())
  );

-- =============================================
-- Reading Progress table
-- =============================================
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.reading_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_novels_author ON public.novels(author_id);
CREATE INDEX idx_novels_status ON public.novels(status);
CREATE INDEX idx_chapters_novel ON public.chapters(novel_id);
CREATE INDEX idx_chapters_novel_number ON public.chapters(novel_id, chapter_number);
CREATE INDEX idx_reading_progress_user ON public.reading_progress(user_id);
CREATE INDEX idx_reading_progress_novel ON public.reading_progress(novel_id);
