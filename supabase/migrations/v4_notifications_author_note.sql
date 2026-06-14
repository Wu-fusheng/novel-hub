-- 1. notifications 表（书籍更新通知）
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'chapter_update' CHECK (type IN ('chapter_update', 'author_reply', 'system')),
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 2. chapters 表新增 author_note 字段
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS author_note TEXT;

-- 3. comments 表新增 is_author_note 字段（作者置顶评论）
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_author_note BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_comments_author_note ON public.comments(chapter_id, is_author_note);

-- 4. 新章节发布时自动创建通知的 trigger
CREATE OR REPLACE FUNCTION public.notify_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
  v_novel_author UUID;
BEGIN
  SELECT author_id INTO v_novel_author FROM public.novels WHERE id = NEW.novel_id;
  INSERT INTO public.notifications (user_id, novel_id, type, title, content)
  SELECT rp.user_id, NEW.novel_id, 'chapter_update', '新章节更新',
         '您关注的小说有新章节发布了'
  FROM public.reading_progress rp
  WHERE rp.novel_id = NEW.novel_id AND rp.user_id != v_novel_author;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_new_chapter ON public.chapters;
CREATE TRIGGER notify_new_chapter
  AFTER UPDATE ON public.chapters
  FOR EACH ROW
  WHEN (NEW.is_published = true AND OLD.is_published = false)
  EXECUTE FUNCTION public.notify_new_chapter();

-- 5. 批量获取章节阅读数 RPC（替代逐章查询）
CREATE OR REPLACE FUNCTION public.get_novel_chapter_read_counts(p_novel_id UUID)
RETURNS TABLE (chapter_id UUID, read_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT cr.chapter_id, COUNT(DISTINCT cr.user_id)::BIGINT
  FROM public.chapter_reads cr
  JOIN public.chapters c ON c.id = cr.chapter_id
  WHERE c.novel_id = p_novel_id
  GROUP BY cr.chapter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
