import React from 'react'

const CardSkeleton = () => (
  <div className="rounded-3xl bg-white border border-indigo-100/60 shadow-card p-5 animate-pulse overflow-hidden relative">
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-100 via-violet-100 to-purple-100" />
    <div className="flex items-center gap-3 mb-5 pt-2">
      <div className="h-10 w-10 rounded-2xl bg-indigo-50 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-32 bg-indigo-50 rounded-full" />
        <div className="h-3 w-20 bg-indigo-50 rounded-full" />
      </div>
    </div>
    <div className="flex items-center gap-1.5 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-7 w-7 rounded-full bg-indigo-50" />
      ))}
    </div>
    <div className="flex gap-2">
      <div className="h-9 w-20 bg-indigo-50 rounded-xl" />
      <div className="h-9 w-24 bg-indigo-50 rounded-xl" />
    </div>
  </div>
)

export default function Loading() {
  return (
    <section className="flex size-full flex-col gap-8">
      <header className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white border border-indigo-100/60 animate-pulse shrink-0 shadow-sm" />
        <div className="space-y-2">
          <div className="h-6 w-36 bg-indigo-100/60 rounded-full animate-pulse" />
          <div className="h-4 w-52 bg-indigo-50 rounded-full animate-pulse" />
        </div>
      </header>

      <div className="h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </section>
  )
}
