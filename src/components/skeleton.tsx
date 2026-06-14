export function NovelCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between pt-1">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function ChapterSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
      <div className="text-center mb-8 space-y-3">
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  )
}

export function NovelDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-6 mb-8">
        <div className="w-32 h-44 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
