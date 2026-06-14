import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/lib/types'

// Get visible comments for a chapter
export async function getChapterComments(chapterId: string): Promise<Comment[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  const { data, error } = await supabase
    .rpc('get_visible_comments', {
      p_chapter_id: chapterId,
      p_user_id: userId,
    })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Build comment tree
  const comments = (data || []) as Comment[]
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  // First pass: create map
  comments.forEach(c => {
    commentMap.set(c.id, { ...c, replies: [] })
  })

  // Second pass: build tree
  comments.forEach(c => {
    const comment = commentMap.get(c.id)!
    if (c.parent_id && commentMap.has(c.parent_id)) {
      const parent = commentMap.get(c.parent_id)!
      parent.replies = parent.replies || []
      parent.replies.push(comment)
    } else {
      rootComments.push(comment)
    }
  })

  // Sort: author notes first, then by created_at desc
  rootComments.sort((a, b) => {
    if (a.is_author_note && !b.is_author_note) return -1
    if (!a.is_author_note && b.is_author_note) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return rootComments
}

// Create a new comment
export async function createComment(comment: {
  novel_id: string
  chapter_id: string | null
  content: string
  selected_text?: string | null
  annotation_start?: number | null
  annotation_end?: number | null
  is_private?: boolean
  parent_id?: string | null
  reply_to_user_id?: string | null
}): Promise<Comment | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('请先登录后再留言')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      ...comment,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw new Error(error.message)
  }

  return data
}

// Soft delete a comment
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('请先登录')
  }

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting comment:', error)
    throw new Error(error.message)
  }
}

// Get current user
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

// Check if current user is the author of a novel
export async function isNovelAuthor(novelId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('novels')
    .select('author_id')
    .eq('id', novelId)
    .single()

  return data?.author_id === user.id
}
