import UserNavClient from './nav-client'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">我的空间</h1>
      <UserNavClient />
      <div className="mt-6">{children}</div>
    </div>
  )
}
