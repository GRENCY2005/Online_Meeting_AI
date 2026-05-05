'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, BrainCircuit, Calendar, ChevronRight } from 'lucide-react'

interface RecapItem {
  _id: string
  meetingId: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  decisions: string[]
  createdAt: string
  description: string | null
  scheduledAt: string | null
}

export default function RecapsPage() {
  const router = useRouter()
  const [recaps, setRecaps] = useState<RecapItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecaps = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/recaps')
        if (!res.ok) throw new Error('Failed to load recaps')
        const data: RecapItem[] = await res.json()
        // Deduplicate by meetingId — keeps first occurrence (newest, since API sorts by createdAt desc)
        const seen = new Map<string, RecapItem>()
        for (const item of data) {
          if (!seen.has(item.meetingId)) seen.set(item.meetingId, item)
        }
        setRecaps(Array.from(seen.values()))
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecaps()
  }, [])

  if (isLoading) {
    return (
      <section className="flex size-full flex-col gap-8 animate-fade-in">
        <PageHeader />
        <div className="flex items-center justify-center min-h-[380px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-500" />
            <p className="text-sm text-gray-400 font-medium">Loading recaps...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex size-full flex-col gap-8 animate-fade-in">
      <PageHeader />

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          {error} — make sure the backend server is running.
        </div>
      )}

      {!error && recaps.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[380px] rounded-3xl
          bg-white border-2 border-dashed border-indigo-200/60 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle, #E0E7FF 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col items-center gap-4 max-w-xs text-center px-6">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 border border-violet-200/60 shadow-sm">
              <BrainCircuit className="w-10 h-10 text-violet-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-800">No Recaps Yet</h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                End a meeting and generate a summary — it will appear here.
              </p>
            </div>
          </div>
        </div>
      )}

      {recaps.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {recaps.map((recap) => (
            <RecapCard key={recap._id} recap={recap} onView={() => router.push(`/recap/${recap.meetingId}`)} />
          ))}
        </div>
      )}
    </section>
  )
}

function PageHeader() {
  return (
    <>
      <header className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl
          bg-gradient-to-br from-violet-100 to-purple-100 border border-violet-200/50 shadow-sm">
          <BrainCircuit className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Meeting Recaps
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">AI summaries &amp; transcripts from your past meetings</p>
        </div>
      </header>
      <div className="h-px bg-gradient-to-r from-violet-200 via-purple-200 to-transparent mb-2" />
    </>
  )
}

function RecapCard({ recap, onView }: { recap: RecapItem; onView: () => void }) {
  const displayId = recap.meetingId.length > 16 ? '…' + recap.meetingId.slice(-12) : recap.meetingId
  const dateLabel = recap.scheduledAt
    ? new Date(recap.scheduledAt).toLocaleString()
    : new Date(recap.createdAt).toLocaleString()
  const summarySnippet = recap.summary ? recap.summary.slice(0, 120) + (recap.summary.length > 120 ? '…' : '') : null

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm
      hover:shadow-md hover:border-violet-200 transition-all duration-200 overflow-hidden">

      {/* Colour band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-purple-600" />

      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-0.5">
              {recap.description || 'Instant Meeting'}
            </p>
            <p className="text-xs text-gray-400 font-mono">{displayId}</p>
          </div>
          <div className="shrink-0 p-2 rounded-xl bg-violet-50 border border-violet-100">
            <BrainCircuit size={16} className="text-violet-500" />
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar size={12} />
          <span>{dateLabel}</span>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-1.5">
          {recap.keyPoints?.length > 0 && (
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
              {recap.keyPoints.length} key points
            </span>
          )}
          {recap.actionItems?.length > 0 && (
            <span className="text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
              {recap.actionItems.length} action items
            </span>
          )}
          {recap.decisions?.length > 0 && (
            <span className="text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
              {recap.decisions.length} decisions
            </span>
          )}
        </div>

        {/* Summary snippet */}
        {summarySnippet && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            {summarySnippet}
          </p>
        )}
      </div>

      {/* Footer button */}
      <div className="px-5 pb-5">
        <button
          onClick={onView}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-gradient-to-r from-violet-600 to-purple-600
            hover:from-violet-700 hover:to-purple-700
            text-white text-sm font-semibold
            shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          <FileText size={15} />
          View Recap &amp; PDF
          <ChevronRight size={15} className="ml-auto" />
        </button>
      </div>
    </div>
  )
}
