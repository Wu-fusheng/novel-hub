export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-12 bg-gray-200 rounded-lg w-64 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto mb-8"></div>
          <div className="flex justify-center space-x-4">
            <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
          </div>
        </div>
      </section>

      {/* Novels skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 bg-gray-200 rounded-lg w-32 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
