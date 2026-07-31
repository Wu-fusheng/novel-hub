import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNavSidebar from './nav-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || user.user_metadata?.role

  if (!role || (role !== 'admin' && role !== 'author')) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavSidebar />
      <main className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
