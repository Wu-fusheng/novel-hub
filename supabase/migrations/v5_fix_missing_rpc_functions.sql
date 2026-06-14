-- =============================================
-- v5: 修复缺失的 RPC 函数和表
-- =============================================

-- 0. 创建 chapter_reads 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.chapter_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chapter_reads_chapter ON public.chapter_reads(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reads_user ON public.chapter_reads(user_id);
ALTER TABLE public.chapter_reads ENABLE ROW LEVEL SECURITY;

-- 1. 获取小说总阅读数
CREATE OR REPLACE FUNCTION public.get_novel_total_reads(p_novel_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT cr.user_id)::BIGINT
    FROM public.chapter_reads cr
    JOIN public.chapters c ON c.id = cr.chapter_id
    WHERE c.novel_id = p_novel_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 获取小说月度阅读数
CREATE OR REPLACE FUNCTION public.get_novel_monthly_reads(p_novel_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT cr.user_id)::BIGINT
    FROM public.chapter_reads cr
    JOIN public.chapters c ON c.id = cr.chapter_id
    WHERE c.novel_id = p_novel_id
      AND cr.created_at >= date_trunc('month', now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 获取小说日阅读数
CREATE OR REPLACE FUNCTION public.get_novel_daily_reads(p_novel_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT cr.user_id)::BIGINT
    FROM public.chapter_reads cr
    JOIN public.chapters c ON c.id = cr.chapter_id
    WHERE c.novel_id = p_novel_id
      AND cr.created_at >= date_trunc('day', now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 获取章节评分统计
CREATE OR REPLACE FUNCTION public.get_chapter_rating_stats(p_chapter_id UUID)
RETURNS TABLE (
  avg_rating NUMERIC,
  total_count BIGINT,
  rating_1 BIGINT,
  rating_2 BIGINT,
  rating_3 BIGINT,
  rating_4 BIGINT,
  rating_5 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(cr.rating), 0)::NUMERIC as avg_rating,
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE cr.rating = 1)::BIGINT as rating_1,
    COUNT(*) FILTER (WHERE cr.rating = 2)::BIGINT as rating_2,
    COUNT(*) FILTER (WHERE cr.rating = 3)::BIGINT as rating_3,
    COUNT(*) FILTER (WHERE cr.rating = 4)::BIGINT as rating_4,
    COUNT(*) FILTER (WHERE cr.rating = 5)::BIGINT as rating_5
  FROM public.chapter_ratings cr
  WHERE cr.chapter_id = p_chapter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 记录章节阅读
CREATE OR REPLACE FUNCTION public.record_chapter_read(
  p_chapter_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.chapter_reads (chapter_id, user_id)
  VALUES (p_chapter_id, p_user_id)
  ON CONFLICT (chapter_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 获取章节阅读数
CREATE OR REPLACE FUNCTION public.get_chapter_read_count(p_chapter_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)::BIGINT
    FROM public.chapter_reads
    WHERE chapter_id = p_chapter_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 获取小说章节评论数
CREATE OR REPLACE FUNCTION public.get_novel_chapter_comment_counts(p_novel_id UUID)
RETURNS TABLE (
  chapter_id UUID,
  chapter_number INTEGER,
  chapter_title TEXT,
  comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as chapter_id,
    c.chapter_number,
    c.title as chapter_title,
    COUNT(cm.id)::BIGINT as comment_count
  FROM public.chapters c
  LEFT JOIN public.comments cm ON cm.chapter_id = c.id AND cm.is_deleted = false
  WHERE c.novel_id = p_novel_id
  GROUP BY c.id, c.chapter_number, c.title
  ORDER BY c.chapter_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 获取小说评分概览
CREATE OR REPLACE FUNCTION public.get_novel_rating_overview(p_novel_id UUID)
RETURNS TABLE (
  chapter_id UUID,
  chapter_number INTEGER,
  chapter_title TEXT,
  avg_rating NUMERIC,
  total_ratings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as chapter_id,
    c.chapter_number,
    c.title as chapter_title,
    COALESCE(AVG(cr.rating), 0)::NUMERIC as avg_rating,
    COUNT(cr.id)::BIGINT as total_ratings
  FROM public.chapters c
  LEFT JOIN public.chapter_ratings cr ON cr.chapter_id = c.id
  WHERE c.novel_id = p_novel_id
  GROUP BY c.id, c.chapter_number, c.title
  ORDER BY c.chapter_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 获取小说总评分
CREATE OR REPLACE FUNCTION public.get_novel_avg_rating(p_novel_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(cr.rating), 0)::NUMERIC
    FROM public.chapter_ratings cr
    JOIN public.chapters c ON c.id = cr.chapter_id
    WHERE c.novel_id = p_novel_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 更新 get_visible_comments 函数以包含 is_author_note
CREATE OR REPLACE FUNCTION public.get_visible_comments(
  p_chapter_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  novel_id UUID,
  chapter_id UUID,
  user_id UUID,
  content TEXT,
  selected_text TEXT,
  annotation_start INTEGER,
  annotation_end INTEGER,
  is_private BOOLEAN,
  parent_id UUID,
  reply_to_user_id UUID,
  is_deleted BOOLEAN,
  is_author_note BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  user_avatar TEXT,
  reply_to_username TEXT,
  reply_to_display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.novel_id,
    c.chapter_id,
    c.user_id,
    c.content,
    c.selected_text,
    c.annotation_start,
    c.annotation_end,
    c.is_private,
    c.parent_id,
    c.reply_to_user_id,
    c.is_deleted,
    c.is_author_note,
    c.created_at,
    c.updated_at,
    p.username,
    p.display_name,
    p.avatar_url as user_avatar,
    rp.username as reply_to_username,
    rp.display_name as reply_to_display_name
  FROM public.comments c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.profiles rp ON rp.id = c.reply_to_user_id
  LEFT JOIN public.novels n ON n.id = c.novel_id
  WHERE c.chapter_id = p_chapter_id
    AND c.is_deleted = false
    AND (
      c.is_private = false
      OR c.user_id = p_user_id
      OR n.author_id = p_user_id
    )
  ORDER BY 
    c.is_author_note DESC,
    CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
    c.parent_id NULLS FIRST,
    c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
