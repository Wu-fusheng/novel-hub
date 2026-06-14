-- =============================================
-- Comments & Annotations Schema for Novel Hub
-- 支持：普通留言 + 文字选中批注 + 可见性控制 + 作者回复
-- =============================================

-- =============================================
-- Comments table (留言/评论/批注)
-- =============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 内容
  content TEXT NOT NULL,
  
  -- 批注特有字段（普通留言时为空）
  selected_text TEXT,                    -- 被选中的原文
  annotation_start INTEGER,              -- 选中起始位置（在章节内容中的字符偏移）
  annotation_end INTEGER,                -- 选中结束位置
  
  -- 可见性控制
  is_private BOOLEAN NOT NULL DEFAULT false,  -- true = 仅作者可见, false = 所有人可见
  
  -- 回复功能
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,  -- 回复哪条留言
  reply_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- 回复给哪个用户
  
  -- 状态
  is_deleted BOOLEAN NOT NULL DEFAULT false,  -- 软删除
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引优化
CREATE INDEX idx_comments_novel ON public.comments(novel_id);
CREATE INDEX idx_comments_chapter ON public.comments(chapter_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX idx_comments_chapter_created ON public.comments(chapter_id, created_at DESC);

-- 启用RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for Comments
-- =============================================

-- 1. 所有人可以查看公开的留言（非私密的、未删除的）
CREATE POLICY "Anyone can view public comments" ON public.comments
  FOR SELECT USING (
    is_deleted = false 
    AND is_private = false
  );

-- 2. 作者可以查看自己小说下的所有留言（包括私密的）
CREATE POLICY "Authors can view all comments on their novels" ON public.comments
  FOR SELECT USING (
    is_deleted = false
    AND EXISTS (
      SELECT 1 FROM public.novels 
      WHERE novels.id = comments.novel_id 
      AND novels.author_id = auth.uid()
    )
  );

-- 3. 用户可以查看自己的留言（包括私密的）
CREATE POLICY "Users can view own comments" ON public.comments
  FOR SELECT USING (
    is_deleted = false
    AND user_id = auth.uid()
  );

-- 4. 已登录用户可以创建留言
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- 5. 用户可以更新自己的留言
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (
    user_id = auth.uid()
    AND is_deleted = false
  );

-- 6. 用户可以软删除自己的留言
CREATE POLICY "Users can soft delete own comments" ON public.comments
  FOR UPDATE USING (
    user_id = auth.uid()
  )
  WITH CHECK (true);  -- 允许更新 is_deleted 字段

-- 7. 作者可以回复留言（通过更新添加回复，或插入新记录）
-- 这个通过INSERT policy #4 已经覆盖，作者也是已登录用户

-- =============================================
-- Author Replies View (方便查询作者回复)
-- =============================================
-- 可选：创建一个视图来方便获取留言及其回复
-- 实际上用自连接查询即可，不需要额外视图

-- =============================================
-- Function: Get visible comments for a chapter
-- 返回当前用户可见的所有留言（考虑私密性）
-- =============================================
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
      -- 公开留言，所有人可见
      c.is_private = false
      -- 或者是用户自己的留言
      OR c.user_id = p_user_id
      -- 或者是小说作者
      OR n.author_id = p_user_id
    )
  ORDER BY 
    c.is_author_note DESC,
    CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
    c.parent_id NULLS FIRST,
    c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Trigger: Update updated_at on comments
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
