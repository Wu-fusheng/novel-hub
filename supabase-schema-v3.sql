-- =============================================
-- Novel Hub v3: Urgings, Ratings & Analytics
-- 催更系统 + 章节评分 + 阅读统计
-- =============================================

-- =============================================
-- 1. Urgings Table (催更)
-- =============================================
CREATE TABLE IF NOT EXISTS public.urgings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- 可选：记录催更时最后一章的ID
  last_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 每个用户每部小说只能催更一次（或限制频率）
  UNIQUE(novel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_urgings_novel ON public.urgings(novel_id);
CREATE INDEX IF NOT EXISTS idx_urgings_created ON public.urgings(created_at DESC);

-- Enable RLS
ALTER TABLE public.urgings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view urgings count" ON public.urgings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create urgings" ON public.urgings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own urgings" ON public.urgings
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. Chapter Ratings Table (章节评分)
-- =============================================
CREATE TABLE IF NOT EXISTS public.chapter_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  -- 可选：文字评价
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 每个用户每章只能评分一次
  UNIQUE(chapter_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_chapter ON public.chapter_ratings(chapter_id);
CREATE INDEX IF NOT EXISTS idx_ratings_novel ON public.chapter_ratings(novel_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON public.chapter_ratings(user_id);

-- Enable RLS
ALTER TABLE public.chapter_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view ratings" ON public.chapter_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON public.chapter_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.chapter_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.chapter_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.chapter_ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.chapter_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_ratings_updated_at();

-- =============================================
-- 3. Reading Stats View (阅读统计视图)
-- =============================================
CREATE OR REPLACE VIEW public.novel_reading_stats AS
SELECT
  n.id AS novel_id,
  n.author_id,
  n.title,
  -- 总阅读人数（去重）
  COUNT(DISTINCT rp.user_id) AS total_readers,
  -- 本月阅读人数
  COUNT(DISTINCT CASE WHEN rp.last_read_at >= date_trunc('month', now()) THEN rp.user_id END) AS monthly_readers,
  -- 本周阅读人数
  COUNT(DISTINCT CASE WHEN rp.last_read_at >= date_trunc('week', now()) THEN rp.user_id END) AS weekly_readers,
  -- 今日阅读人数
  COUNT(DISTINCT CASE WHEN rp.last_read_at >= date_trunc('day', now()) THEN rp.user_id END) AS daily_readers,
  -- 总催更数
  COALESCE(u.urging_count, 0) AS total_urgings,
  -- 本月催更数
  COALESCE(u.monthly_urging_count, 0) AS monthly_urgings
FROM public.novels n
LEFT JOIN public.reading_progress rp ON rp.novel_id = n.id
LEFT JOIN (
  SELECT
    novel_id,
    COUNT(*) AS urging_count,
    COUNT(CASE WHEN created_at >= date_trunc('month', now()) THEN 1 END) AS monthly_urging_count
  FROM public.urgings
  GROUP BY novel_id
) u ON u.novel_id = n.id
GROUP BY n.id, n.author_id, n.title, u.urging_count, u.monthly_urging_count;

-- =============================================
-- 4. Chapter Rating Stats View (章节评分统计)
-- =============================================
CREATE OR REPLACE VIEW public.chapter_rating_stats AS
SELECT
  cr.chapter_id,
  c.novel_id,
  c.chapter_number,
  c.title AS chapter_title,
  COUNT(cr.id) AS total_ratings,
  ROUND(AVG(cr.rating)::numeric, 2) AS average_rating,
  COUNT(CASE WHEN cr.rating = 5 THEN 1 END) AS five_star,
  COUNT(CASE WHEN cr.rating = 4 THEN 1 END) AS four_star,
  COUNT(CASE WHEN cr.rating = 3 THEN 1 END) AS three_star,
  COUNT(CASE WHEN cr.rating = 2 THEN 1 END) AS two_star,
  COUNT(CASE WHEN cr.rating = 1 THEN 1 END) AS one_star
FROM public.chapter_ratings cr
JOIN public.chapters c ON c.id = cr.chapter_id
GROUP BY cr.chapter_id, c.novel_id, c.chapter_number, c.title;

-- =============================================
-- 5. Functions for Author Dashboard
-- =============================================

-- Get novel summary stats for author
CREATE OR REPLACE FUNCTION public.get_author_novel_stats(p_author_id UUID)
RETURNS TABLE (
  novel_id UUID,
  title TEXT,
  total_readers BIGINT,
  monthly_readers BIGINT,
  weekly_readers BIGINT,
  daily_readers BIGINT,
  total_urgings BIGINT,
  monthly_urgings BIGINT,
  total_comments BIGINT,
  total_chapters BIGINT,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    COALESCE(stats.total_readers, 0) AS total_readers,
    COALESCE(stats.monthly_readers, 0) AS monthly_readers,
    COALESCE(stats.weekly_readers, 0) AS weekly_readers,
    COALESCE(stats.daily_readers, 0) AS daily_readers,
    COALESCE(stats.total_urgings, 0) AS total_urgings,
    COALESCE(stats.monthly_urgings, 0) AS monthly_urgings,
    COALESCE(comm.comment_count, 0) AS total_comments,
    COALESCE(ch.chapter_count, 0) AS total_chapters,
    COALESCE(r.avg_rating, 0) AS avg_rating
  FROM public.novels n
  LEFT JOIN public.novel_reading_stats stats ON stats.novel_id = n.id
  LEFT JOIN (
    SELECT novel_id, COUNT(*) AS comment_count
    FROM public.comments
    WHERE is_deleted = false
    GROUP BY novel_id
  ) comm ON comm.novel_id = n.id
  LEFT JOIN (
    SELECT novel_id, COUNT(*) AS chapter_count
    FROM public.chapters
    GROUP BY novel_id
  ) ch ON ch.novel_id = n.id
  LEFT JOIN (
    SELECT novel_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating
    FROM public.chapter_ratings
    GROUP BY novel_id
  ) r ON r.novel_id = n.id
  WHERE n.author_id = p_author_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get urging count for a novel
CREATE OR REPLACE FUNCTION public.get_novel_urging_count(p_novel_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.urgings WHERE novel_id = p_novel_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has urged a novel
CREATE OR REPLACE FUNCTION public.has_user_urged(p_novel_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.urgings
    WHERE novel_id = p_novel_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's rating for a chapter
CREATE OR REPLACE FUNCTION public.get_user_chapter_rating(p_chapter_id UUID, p_user_id UUID)
RETURNS TABLE (rating INTEGER, review TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT cr.rating, cr.review
  FROM public.chapter_ratings cr
  WHERE cr.chapter_id = p_chapter_id AND cr.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
